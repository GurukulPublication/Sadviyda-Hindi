/**
 * ARTICLE (/articles/:id)
 *
 * A clean report card in simple English: overall score, the four parameter
 * cards, what went well, what to work on, and the full flag list.
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Diya from '../components/Diya'
import ScoreInfo from '../components/ScoreInfo'
import FlagTable from '../components/FlagTable'
import { downloadJson } from '../components/SettingsDrawer'
import { useApp } from '../context/AppContext'
import { PARAMETERS, PARAM_BY_KEY, MAX_SCORE } from '../config/scoring'
import { deleteReport, updateReport } from '../db/db'
import { averageByParameter, cleanParameters, weakestOf } from '../lib/stats'
import { scoreReport } from '../lib/scoring'
import type { Flag, Language, ParameterKey } from '../types'

export default function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { allReports, loaded } = useApp()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const report = allReports.find((r) => String(r.id) === id)

  // Draft copies used while editing.
  const [draftFlags, setDraftFlags] = useState<Flag[]>([])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDate, setDraftDate] = useState('')
  const [draftLanguage, setDraftLanguage] = useState<Language>('Hindi')

  const averages = useMemo(() => averageByParameter(allReports), [allReports])

  // Still reading from storage — don't flash "not found" on a refresh.
  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink/50">
        Opening the report…
      </div>
    )
  }

  if (!report) {
    return (
      <div className="card p-8 text-center">
        <p className="font-heading text-lg">That article could not be found.</p>
        <Link to="/articles" className="btn-ghost mt-4">
          Back to articles
        </Link>
      </div>
    )
  }

  const clean = cleanParameters(report)
  const weakest = weakestOf(report)

  function startEditing() {
    setDraftFlags(report!.flags.map((f) => ({ ...f })))
    setDraftTitle(report!.title)
    setDraftDate(report!.date)
    setDraftLanguage(report!.language)
    setEditing(true)
  }

  async function saveEdits() {
    await updateReport(report!.id!, {
      ...report!,
      title: draftTitle.trim() || 'Untitled article',
      date: draftDate,
      language: draftLanguage,
      status: draftFlags.some((f) => f.status === 'FLAGGED') ? 'FLAGGED' : 'CLEAN',
      flags: draftFlags,
    })
    setEditing(false)
  }

  async function doDelete() {
    await deleteReport(report!.id!)
    navigate('/articles')
  }

  function exportOne() {
    const { scores, flagCounts, unsureCounts, overall, grade, ...plain } = report!
    downloadJson(
      { ...plain, computed: { scores, overall, grade } },
      `${slug(report!.title)}.json`,
    )
  }

  // While editing, show the same table used on the Add page.
  if (editing) {
    const preview = scoreReport({
      ...report,
      title: draftTitle,
      date: draftDate,
      language: draftLanguage,
      flags: draftFlags,
    })
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold">Edit report</h1>
        <div className="card grid gap-4 p-4 sm:grid-cols-3">
          <label className="text-xs text-ink/60">
            Article title
            <input
              className="input mt-1"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </label>
          <label className="text-xs text-ink/60">
            Date
            <input
              type="date"
              className="input mt-1"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
            />
          </label>
          <label className="text-xs text-ink/60">
            Language
            <select
              className="input mt-1"
              value={draftLanguage}
              onChange={(e) => setDraftLanguage(e.target.value as Language)}
            >
              <option value="Hindi">Hindi</option>
              <option value="Gujarati">Gujarati</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-ink/60">
          Score with these changes:{' '}
          <b className="text-terracotta">{preview.overall.toFixed(1)}/10</b> ·{' '}
          {preview.grade}
        </p>
        <FlagTable flags={draftFlags} onChange={setDraftFlags} />
        <div className="flex gap-3 border-t border-ink/10 pt-4">
          <button className="btn-primary" onClick={saveEdits}>
            Save changes
          </button>
          <button className="btn-ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-8">
      <div className="section-number" aria-hidden>
        02
      </div>

      {/* Header */}
      <header className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Diya score={report.overall} size={96} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xs uppercase tracking-wider text-ink/50">
            {formatDate(report.date)} · {report.language}
            {report.isDemo && ' · Demo'}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold sm:text-3xl">
            {report.title}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {report.flags.filter((f) => f.status === 'FLAGGED').length} flagged ·{' '}
            {report.flags.filter((f) => f.status === 'UNSURE').length} unsure
          </p>
        </div>
        <div className="text-center sm:text-right">
          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <span className="font-heading text-5xl font-bold text-terracotta">
              {report.overall.toFixed(1)}
            </span>
            <span className="font-heading text-lg text-ink/40">/10</span>
            <ScoreInfo />
          </div>
          <p className="mt-1 font-heading text-sm text-olive">{report.grade}</p>
        </div>
      </header>

      {/* The four parameter cards */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">
          The four parameters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PARAMETERS.map((p) => {
            const score = report.scores[p.key]
            const flags = report.flagCounts[p.key]
            const unsure = report.unsureCounts[p.key]
            const avg = averages[p.key]
            const diff = Number((score - avg).toFixed(1))
            return (
              <div key={p.key} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-semibold">{p.label}</h3>
                    <p className="mt-0.5 text-xs text-ink/60">{p.meaning}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className="font-heading text-2xl font-semibold"
                      style={{ color: p.color }}
                    >
                      {score.toFixed(1)}
                    </span>
                    <span className="text-xs text-ink/40">/10</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: p.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / MAX_SCORE) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                <p className="mt-2 text-xs text-ink/70">
                  {flags === 0
                    ? `No flags here — nothing was deducted.`
                    : `${flags} flag${flags === 1 ? '' : 's'} × ${p.deduction.toFixed(1)} point${p.deduction === 1 ? '' : 's'} = −${(flags * p.deduction).toFixed(1)}.`}
                  {unsure > 0 &&
                    ` ${unsure} unsure item${unsure === 1 ? '' : 's'} (not counted).`}
                </p>

                {allReports.length > 1 && (
                  <p className="mt-1 text-xs text-ink/50">
                    {diff === 0
                      ? 'Exactly your average.'
                      : `${diff > 0 ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)} compared with your average of ${avg.toFixed(1)}.`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Encouragement + one thing to work on */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-heading font-semibold">What went well</h3>
          {clean.length === 0 ? (
            <p className="mt-2 text-sm text-ink/70">
              Every parameter picked up at least one flag this time. That happens
              — the flag list below is the whole map of what to fix.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-ink/70">
              {clean.map((key) => (
                <li key={key}>
                  ✓ <b>{PARAM_BY_KEY[key].label}</b> — clean. {praise(key)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-heading font-semibold">What to work on</h3>
          {weakest === null ? (
            <p className="mt-2 text-sm text-ink/70">
              Nothing to fix — this report is clean. Keep doing exactly what you
              did here.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink/70">
                <b>{PARAM_BY_KEY[weakest].label}</b> is the weakest here, with{' '}
                {report.flagCounts[weakest]} flag
                {report.flagCounts[weakest] === 1 ? '' : 's'}.
              </p>
              <p className="mt-2 rounded-lg bg-sage/50 p-3 text-sm">
                <b>Try this:</b> {PARAM_BY_KEY[weakest].tip}
              </p>
            </>
          )}
        </div>
      </section>

      {/* Flag list, grouped by parameter */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">
          Every flag in this report
        </h2>
        {report.flags.length === 0 ? (
          <p className="card p-6 text-sm text-ink/70">
            No flags at all. This one was clean. 🪔
          </p>
        ) : (
          <div className="space-y-6">
            {PARAMETERS.map((p) => {
              const items = report.flags.filter((f) => f.parameter === p.key)
              if (!items.length) return null
              return (
                <div key={p.key}>
                  <h3
                    className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider"
                    style={{ color: p.color }}
                  >
                    {p.label} ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((flag) => (
                      <div key={flag.id} className="card p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="font-heading text-xs text-ink/50">
                            Line {flag.line ?? '—'}
                          </span>
                          <span
                            className={
                              flag.status === 'FLAGGED'
                                ? 'badge-flagged'
                                : 'badge-unsure'
                            }
                          >
                            {flag.status}
                          </span>
                          {flag.term && (
                            <span className="rounded-full bg-peach px-2 py-0.5 text-[11px]">
                              {flag.term}
                            </span>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <p className="rounded-lg bg-sand/50 p-3 text-sm">
                            {flag.english || <i className="text-ink/40">—</i>}
                          </p>
                          <p className="deva rounded-lg bg-sage/40 p-3 text-sm">
                            {flag.hindi || <i className="text-ink/40">—</i>}
                          </p>
                        </div>
                        {flag.reason && (
                          <p className="mt-2 text-sm text-ink/70">
                            <b className="font-heading text-xs uppercase tracking-wider text-ink/50">
                              Why:{' '}
                            </b>
                            {flag.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="flex flex-wrap gap-3 border-t border-ink/10 pt-6">
        <button className="btn-ghost" onClick={startEditing}>
          Edit report
        </button>
        <button className="btn-ghost" onClick={exportOne}>
          Export as JSON
        </button>
        {!confirmDelete ? (
          <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        ) : (
          <span className="flex items-center gap-2 text-sm">
            Delete “{report.title}” for good?
            <button className="btn-danger" onClick={doDelete}>
              Yes, delete
            </button>
            <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </span>
        )}
        <Link to="/articles" className="btn-ghost ml-auto">
          All articles
        </Link>
      </section>
    </div>
  )
}

/** A short compliment for a clean parameter. */
function praise(key: ParameterKey): string {
  switch (key) {
    case 'meaningDrift':
      return 'Every line landed on the same idea as the English.'
    case 'naturalPhrasing':
      return 'It reads as Hindi, not as English wearing Hindi clothes.'
    case 'termConsistency':
      return 'Names and terms were handled the same way throughout.'
    case 'voiceConviction':
      return 'Your voice carried across intact.'
  }
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'article'
  )
}
