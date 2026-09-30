/**
 * The settings drawer: language filter, backup export/import, demo data and
 * the (double-confirmed) clear-everything button.
 */

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  bulkAdd,
  clearAll,
  clearDemo,
  db,
} from '../db/db'
import { demoReports } from '../lib/demo'
import { useApp, type LanguageFilter } from '../context/AppContext'
import type { Report } from '../types'

const FILTERS: LanguageFilter[] = ['All', 'Hindi', 'Gujarati']

export default function SettingsDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { languageFilter, setLanguageFilter, allReports } = useApp()
  const [confirmStep, setConfirmStep] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const demoCount = allReports.filter((r) => r.isDemo).length

  /** Download every report as one JSON backup file. */
  function exportAll() {
    const payload = {
      app: 'sadvidya-translation-scorecard',
      version: 1,
      exportedAt: new Date().toISOString(),
      reports: allReports.map(
        ({ scores, flagCounts, unsureCounts, overall, grade, ...report }) =>
          report,
      ),
    }
    downloadJson(payload, `sadvidya-backup-${todayStamp()}.json`)
    setMessage(`Exported ${payload.reports.length} report(s).`)
  }

  /** Read a backup file and add its reports alongside the existing ones. */
  async function importBackup(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const reports: Report[] = Array.isArray(data) ? data : data.reports
      if (!Array.isArray(reports)) throw new Error('No reports found in file')
      await bulkAdd(reports)
      setMessage(`Imported ${reports.length} report(s).`)
    } catch (err) {
      setMessage(`Could not read that file: ${(err as Error).message}`)
    }
  }

  async function loadDemo() {
    await bulkAdd(demoReports())
    setMessage('Demo data loaded. Remove it any time with the button below.')
  }

  async function removeDemo() {
    await clearDemo()
    setMessage('Demo articles removed.')
  }

  async function doClearAll() {
    await clearAll()
    setConfirmStep(0)
    setMessage('All data cleared.')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto
                       bg-card border-l border-border p-6"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-semibold">Settings</h2>
              <button className="btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>

            {/* Language filter */}
            <section className="mb-8">
              <h3 className="font-heading text-sm font-semibold mb-2">
                Language filter
              </h3>
              <p className="text-xs text-olive mb-2">
                Applies to every page of the dashboard.
              </p>
              <div className="flex gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setLanguageFilter(f)}
                    className={
                      languageFilter === f
                        ? 'btn bg-ink text-white'
                        : 'btn-ghost'
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </section>

            {/* Backup */}
            <section className="mb-8">
              <h3 className="font-heading text-sm font-semibold mb-2">Backup</h3>
              <div className="flex flex-col gap-2">
                <button className="btn-ghost" onClick={exportAll}>
                  Export all data (JSON)
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => fileRef.current?.click()}
                >
                  Import from a backup
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) importBackup(file)
                    e.target.value = ''
                  }}
                />
              </div>
            </section>

            {/* Demo data */}
            <section className="mb-8">
              <h3 className="font-heading text-sm font-semibold mb-2">
                Sample data
              </h3>
              <p className="text-xs text-olive mb-2">
                Six fake articles so you can see the dashboard full. They are
                labelled “Demo” and can be removed in one click.
              </p>
              <div className="flex flex-col gap-2">
                <button className="btn-ghost" onClick={loadDemo}>
                  Load demo data
                </button>
                <button
                  className="btn-ghost"
                  onClick={removeDemo}
                  disabled={demoCount === 0}
                >
                  Remove demo data{demoCount ? ` (${demoCount})` : ''}
                </button>
              </div>
            </section>

            {/* Danger zone */}
            <section className="mb-8">
              <h3 className="font-heading text-sm font-semibold mb-2">
                Clear everything
              </h3>
              {confirmStep === 0 && (
                <button className="btn border border-brand/40 text-brand hover:bg-brand/5" onClick={() => setConfirmStep(1)}>
                  Clear all data
                </button>
              )}
              {confirmStep === 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-ink/80">
                    This deletes every report on this machine. Export a backup
                    first if you are not sure.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn border border-brand/40 text-brand hover:bg-brand/5" onClick={() => setConfirmStep(2)}>
                      Yes, continue
                    </button>
                    <button className="btn-ghost" onClick={() => setConfirmStep(0)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {confirmStep === 2 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-brand">
                    Really delete all {allReports.length} report(s)? This cannot
                    be undone.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn border border-brand/40 text-brand hover:bg-brand/5" onClick={doClearAll}>
                      Delete everything
                    </button>
                    <button className="btn-ghost" onClick={() => setConfirmStep(0)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            {message && (
              <p className="rounded-lg bg-tintGreen p-3 text-xs">{message}</p>
            )}

            <p className="mt-8 text-[11px] text-muted">
              Everything is stored in this browser only ({db.name}). No account,
              no server.
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/** Trigger a file download for a JSON object. */
export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
