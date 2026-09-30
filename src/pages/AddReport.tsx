/**
 * ADD REPORT (/add)
 *
 * Flow: drop a PDF -> parse -> review and fix in an editable table -> Save.
 * Nothing touches the database until "Save Report" is clicked.
 * If the PDF cannot be read at all, the same table works as a blank manual form.
 */

import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FlagTable, { blankFlag } from '../components/FlagTable'
import Diya from '../components/Diya'
import ScoreInfo from '../components/ScoreInfo'
import { addReport } from '../db/db'
import { extractPdfText } from '../lib/pdf'
import { parseFlagReport, parseSummaryLine } from '../lib/parser'
import { scoreReport } from '../lib/scoring'
import { CLIPBOARD_TEXT } from '../lib/template'
import { PARAM_BY_KEY } from '../config/scoring'
import type { Flag, Language, Report } from '../types'

type Step = 'upload' | 'review' | 'saved'

export default function AddReport() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The report being built, before saving.
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [language, setLanguage] = useState<Language>('Hindi')
  const [flags, setFlags] = useState<Flag[]>([])
  const [summaryCheck, setSummaryCheck] = useState<string | null>(null)

  /** Live preview of the score while reviewing. */
  const preview = useMemo(
    () =>
      scoreReport({
        title: title || 'Untitled',
        date,
        language,
        status: flags.some((f) => f.status === 'FLAGGED') ? 'FLAGGED' : 'CLEAN',
        flags,
        createdAt: new Date().toISOString(),
      }),
    [title, date, language, flags],
  )

  /** Read the dropped/selected PDF and move to the review step. */
  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const text = await extractPdfText(file)
      const { report, warnings: w } = parseFlagReport(text)
      setTitle(report.title === 'Untitled article' ? '' : report.title)
      setDate(report.date)
      setLanguage(report.language)
      setFlags(report.flags)
      setWarnings(w)

      // Cross-check the SUMMARY line, if the report has one.
      const summary = parseSummaryLine(text)
      if (summary) {
        const parts = Object.entries(summary)
          .filter(([k]) => k !== 'unsure')
          .map(
            ([k, v]) =>
              `${PARAM_BY_KEY[k as keyof typeof PARAM_BY_KEY].label}: ${v}`,
          )
        setSummaryCheck(
          `The PDF's own summary line says — ${parts.join(' · ')}${
            summary.unsure !== undefined ? ` · Unsure: ${summary.unsure}` : ''
          }. Check that against the table below.`,
        )
      } else {
        setSummaryCheck(null)
      }
      setStep('review')
    } catch (err) {
      // Total failure: fall back to a blank manual form.
      setError(
        `That PDF could not be read (${(err as Error).message}). You can still enter the report by hand below.`,
      )
      setFlags([blankFlag()])
      setWarnings([])
      setSummaryCheck(null)
      setStep('review')
    } finally {
      setBusy(false)
    }
  }

  /** Save to IndexedDB, play the "diya lit" moment, then open the article. */
  async function save() {
    const report: Report = {
      title: title.trim() || 'Untitled article',
      date,
      language,
      status: flags.some((f) => f.status === 'FLAGGED') ? 'FLAGGED' : 'CLEAN',
      flags: flags.map((f) => ({ ...f, term: f.term?.trim() || undefined })),
      createdAt: new Date().toISOString(),
    }
    const id = await addReport(report)
    setStep('saved')
    setTimeout(() => navigate(`/articles/${id}`), 1700)
  }

  function copyTemplate() {
    navigator.clipboard
      .writeText(CLIPBOARD_TEXT)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
      .catch(() => setCopied(false))
  }

  // --- The "new diya lit" celebration ------------------------------------
  if (step === 'saved') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        >
          <Diya score={preview.overall} size={140} justLit />
        </motion.div>
        <motion.h2
          className="mt-6 font-heading text-2xl font-semibold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          A new diya is lit — {preview.overall.toFixed(1)}/10
        </motion.h2>
        <p className="mt-1 text-sm text-ink/60">{preview.grade}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="section-number" aria-hidden>
        03
      </div>

      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
        Add a Flag Report
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-ink/60">
        Drop the PDF Claude gave you. It is read here in your browser — nothing
        is uploaded anywhere. You will get a chance to fix anything before it is
        saved.
      </p>

      {step === 'upload' && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
            onClick={() => fileRef.current?.click()}
            className={`mt-6 cursor-pointer rounded-xl2 border-2 border-dashed p-10 text-center transition-colors sm:p-16 ${
              dragging
                ? 'border-terracotta bg-peach/40'
                : 'border-ink/20 bg-card hover:bg-sand/40'
            }`}
          >
            <div className="text-4xl" aria-hidden>
              📄
            </div>
            <p className="mt-3 font-heading text-lg">
              {busy ? 'Reading the PDF…' : 'Drop your Flag Report PDF here'}
            </p>
            <p className="mt-1 text-sm text-ink/60">or click to choose a file</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn-ghost" onClick={copyTemplate}>
              {copied ? '✓ Copied' : 'Copy review template'}
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setFlags([blankFlag()])
                setStep('review')
              }}
            >
              Enter a report by hand
            </button>
            <span className="text-xs text-ink/50">
              Paste the template into your review request so the PDF always comes
              back in the format this dashboard reads.
            </span>
          </div>
        </>
      )}

      {step === 'review' && (
        <div className="mt-6 space-y-6">
          {error && (
            <p className="rounded-lg border border-terracotta/30 bg-peach/50 p-4 text-sm">
              {error}
            </p>
          )}

          {warnings.length > 0 && (
            <div className="rounded-lg border border-ink/10 bg-sand/60 p-4 text-sm">
              <p className="font-heading font-semibold">
                Please check these before saving:
              </p>
              <ul className="mt-1 list-disc pl-5 text-ink/70">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {summaryCheck && (
            <p className="rounded-lg bg-sage/50 p-4 text-sm text-ink/70">
              {summaryCheck}
            </p>
          )}

          {/* Article details */}
          <div className="card grid gap-4 p-4 sm:grid-cols-3">
            <label className="text-xs text-ink/60">
              Article title
              <input
                className="input mt-1"
                value={title}
                placeholder="Auto-filled from the PDF"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="text-xs text-ink/60">
              Date
              <input
                type="date"
                className="input mt-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="text-xs text-ink/60">
              Language
              <select
                className="input mt-1"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                <option value="Hindi">Hindi</option>
                <option value="Gujarati">Gujarati</option>
              </select>
            </label>
          </div>

          {/* Live score preview */}
          <div className="card flex items-center gap-4 p-4">
            <Diya score={preview.overall} size={64} />
            <div>
              <p className="font-heading text-xs uppercase tracking-wider text-ink/50">
                Score so far
              </p>
              <p className="font-heading text-2xl font-semibold text-terracotta">
                {preview.overall.toFixed(1)}
                <span className="text-base text-ink/50">/10</span>
              </p>
              <p className="text-xs text-ink/60">{preview.grade}</p>
            </div>
            <ScoreInfo className="ml-auto self-start" />
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold">
              Review the flags
            </h2>
            <p className="mb-3 text-sm text-ink/60">
              Fix anything the parser got wrong, then save. {flags.length} flag
              {flags.length === 1 ? '' : 's'} found.
            </p>
            <FlagTable flags={flags} onChange={setFlags} />
          </div>

          <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-4">
            <button className="btn-primary" onClick={save}>
              Save Report
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setStep('upload')
                setFlags([])
                setWarnings([])
                setError(null)
              }}
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
