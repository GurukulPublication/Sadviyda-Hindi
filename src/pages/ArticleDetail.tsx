/**
 * ARTICLE (/articles/:id)
 *
 * The report card: the overall score, the four parameter cards, what went
 * well, what to work on, and every flag grouped by parameter.
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ScoreBar from '../components/ScoreBar'
import ScoreInfo from '../components/ScoreInfo'
import FlagTable from '../components/FlagTable'
import { downloadJson } from '../components/SettingsDrawer'
import { useApp } from '../context/AppContext'
import { MAX_SCORE, PARAMETERS, PARAM_BY_KEY } from '../config/scoring'
import { palette, scoreColor } from '../config/theme'
import { deleteReport, updateReport } from '../db/db'
import {
  averageByParameter,
  cleanParameters,
  resolvedInReport,
  sortFlagsForReading,
  weakestOf,
} from '../lib/stats'
import { scoreReport } from '../lib/scoring'
import { buildFixPrompt, chat, hasKey, parseFixReply } from '../lib/ai'
import type { Flag, Language, ParameterKey } from '../types'

export default function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { allReports, loaded } = useApp()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  /** AI suggestions, per flag: either "asking", a result, or an error. */
  const [suggestions, setSuggestions] = useState<
    Record<string, { busy: boolean; suggestion?: string; why?: string; error?: string }>
  >({})

  const report = allReports.find((r) => String(r.id) === id)

  // Draft copies used while editing.
  const [draftFlags, setDraftFlags] = useState<Flag[]>([])
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDate, setDraftDate] = useState('')
  const [draftLanguage, setDraftLanguage] = useState<Language>('Hindi')

  const averages = useMemo(() => averageByParameter(allReports), [allReports])

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-olive">
        Opening the report…
      </div>
    )
  }

  if (!report) {
    return (
      <div className="card p-10 text-center">
        <p className="font-heading text-lg font-semibold">
          That article could not be found.
        </p>
        <Link to="/articles" className="btn-ghost mt-5">
          Back to articles
        </Link>
      </div>
    )
  }

  const clean = cleanParameters(report)
  const weakest = weakestOf(report)
  const flaggedCount = report.flags.filter((f) => f.status === 'FLAGGED').length
  const fixed = resolvedInReport(report)

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

  /**
   * Tick a flag off as fixed (or put it back). The score is untouched: it
   * records how the translation read when it was reviewed.
   */
  async function toggleResolved(flagId: string) {
    await updateReport(report!.id!, {
      ...report!,
      flags: report!.flags.map((f) =>
        f.id === flagId
          ? {
              ...f,
              resolved: !f.resolved,
              resolvedAt: !f.resolved ? new Date().toISOString() : undefined,
            }
          : f,
      ),
    })
  }

  /** Ask the AI for a corrected line for one flag. */
  async function suggestFix(flag: Flag) {
    setSuggestions((s) => ({ ...s, [flag.id]: { busy: true } }))
    try {
      const reply = await chat(
        buildFixPrompt(flag, report!.language, report!.title),
      )
      const { suggestion, why } = parseFixReply(reply)
      setSuggestions((s) => ({ ...s, [flag.id]: { busy: false, suggestion, why } }))
    } catch (err) {
      setSuggestions((s) => ({
        ...s,
        [flag.id]: { busy: false, error: (err as Error).message },
      }))
    }
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

  // --- Editing ------------------------------------------------------------
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
        <h1 className="font-heading text-2xl font-bold">Edit report</h1>
        <div className="card grid gap-4 p-5 sm:grid-cols-3">
          <label className="label">
            Article title
            <input
              className="input mt-1.5 font-body normal-case tracking-normal"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </label>
          <label className="label">
            Date
            <input
              type="date"
              className="input mt-1.5 font-body normal-case tracking-normal"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
            />
          </label>
          <label className="label">
            Language
            <select
              className="select mt-1.5 normal-case tracking-normal"
              value={draftLanguage}
              onChange={(e) => setDraftLanguage(e.target.value as Language)}
            >
              <option value="Hindi">Hindi</option>
              <option value="Gujarati">Gujarati</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-olive">
          Score with these changes:{' '}
          <b style={{ color: scoreColor(preview.overall) }}>
            {preview.overall.toFixed(1)}/10
          </b>{' '}
          · {preview.grade}
        </p>
        <FlagTable flags={draftFlags} onChange={setDraftFlags} />
        <div className="flex gap-3 border-t border-border pt-5">
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
    <div className="space-y-7">
      <div className="flex items-center gap-4">
        <Link to="/" className="btn-ghost">
          ← Back to Home
        </Link>
        <Link to="/articles" className="font-heading text-sm text-olive hover:text-ink">
          All articles
        </Link>
      </div>

      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-wrap items-center gap-5 border-b border-border pb-6">
        <ScoreBar
          score={report.overall}
          tone="light"
          height={100}
          width={26}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm text-olive">{formatMonth(report.date)}</span>
            <span
              className={`chip ${
                report.language === 'Hindi'
                  ? 'bg-tintBlue text-blue'
                  : 'bg-tintPeach text-[#9A5700]'
              }`}
            >
              {report.language}
            </span>
            {report.isDemo && <span className="chip bg-sand text-olive">Demo</span>}
          </p>
          <h1 className="mt-1 font-heading text-[clamp(24px,3vw,38px)] font-bold leading-tight">
            {report.title}
          </h1>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span
              className="font-heading text-[48px] font-bold leading-none tabular-nums"
              style={{ color: scoreColor(report.overall) }}
            >
              {report.overall.toFixed(1)}
            </span>
            <span className="font-heading text-lg text-olive">/10</span>
            <ScoreInfo className="ml-1" />
          </div>
          <p className="mt-1 font-heading text-sm font-semibold">{report.grade}</p>
        </div>
      </header>

      {/* -------------------------------------------------- parameter cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PARAMETERS.map((p) => {
          const score = report.scores[p.key]
          const flags = report.flagCounts[p.key]
          const unsure = report.unsureCounts[p.key]
          const diff = Number((score - averages[p.key]).toFixed(1))
          return (
            <div key={p.key} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-sm font-semibold">{p.label}</h3>
                <span className="whitespace-nowrap text-xs text-olive">
                  {flags} flag{flags === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-heading text-[30px] font-bold leading-none tabular-nums">
                  {score.toFixed(1)}
                </span>
                <span className="font-heading text-sm text-olive">/10</span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(score / MAX_SCORE) * 100}%`,
                    background: scoreColor(score),
                  }}
                />
              </div>

              <p className="mt-3 text-sm leading-snug">
                {flags === 0 ? p.guide.checks : plainResult(p.key, flags)}
              </p>
              {unsure > 0 && (
                <p className="mt-1 text-xs text-olive">
                  {unsure} unsure item{unsure === 1 ? '' : 's'}, not counted.
                </p>
              )}

              {allReports.length > 1 && (
                <p
                  className="mt-3 font-heading text-[13px]"
                  style={{ color: diff >= 0 ? palette.greenDark : palette.brand }}
                >
                  {diff === 0
                    ? 'exactly your average'
                    : `${diff > 0 ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)} ${
                        diff > 0 ? 'above' : 'below'
                      } your average`}
                </p>
              )}
            </div>
          )
        })}
      </section>

      {/* ------------------------------------- what went well / to work on */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-tintGreen p-5">
          <h3 className="font-heading font-semibold text-greenDark">
            What went well
          </h3>
          <ul className="mt-3 space-y-2">
            {clean.length === 0 ? (
              <li className="text-[15px] leading-relaxed">
                Every parameter picked up at least one flag this time. The list
                below is the whole map of what to fix.
              </li>
            ) : (
              clean.map((key) => (
                <li key={key} className="flex gap-2.5 text-[15px] leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                  {praise(key)}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-card border border-border bg-tintPeach p-5">
          <h3 className="font-heading font-semibold text-[#9A5700]">
            What to work on
          </h3>
          <ul className="mt-3 space-y-2">
            {weakest === null ? (
              <li className="text-[15px] leading-relaxed">
                Nothing to fix — this report is clean. Keep doing exactly what
                you did here.
              </li>
            ) : (
              [
                `Give ${PARAM_BY_KEY[weakest].label} a second read before sending.`,
                PARAM_BY_KEY[weakest].guide.checks,
                PARAM_BY_KEY[weakest].tip,
              ].map((line) => (
                <li key={line} className="flex gap-2.5 text-[15px] leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
                  {line}
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------- flags */}
      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-xl font-bold">Flags</h2>
          <span className="aside text-sm">
            {fixed.total === 0
              ? 'nothing to look at again'
              : fixed.resolved === fixed.total
                ? `all ${fixed.total} fixed — the score stays as it was reviewed`
                : `${fixed.resolved} of ${fixed.total} fixed · ${
                    fixed.total - fixed.resolved
                  } still to do`}
          </span>
        </div>

        {report.flags.length === 0 ? (
          <p className="card p-8 text-center aside">
            No flags at all. This one was clean.
          </p>
        ) : (
          <div className="space-y-3">
            {/*
              One sequence, in the order the report numbers them (F1, F2, F3 …),
              so the card can be read straight down alongside the PDF. The
              parameter travels on each card instead of being a group heading.
            */}
            {sortFlagsForReading(report.flags).map((flag) => {
              const parameter = PARAM_BY_KEY[flag.parameter]
              return (
                <article
                  key={flag.id}
                  className={`card p-5 transition-opacity ${
                    flag.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2.5 border-b border-border/70 pb-2.5">
                    <span className="font-heading text-sm font-semibold text-olive">
                      {flag.ref ?? (flag.line !== null ? `L${flag.line}` : '—')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: parameter.color }}
                        aria-hidden
                      />
                      <span className="font-heading text-xs font-semibold">
                        {parameter.label}
                      </span>
                    </span>
                    {flag.section && (
                      <span className="chip bg-sand text-olive">{flag.section}</span>
                    )}
                    {flag.term && (
                      <span className="chip bg-sand text-olive">{flag.term}</span>
                    )}

                    <span className="ml-auto flex items-center gap-2">
                      <span
                        className={
                          flag.resolved
                            ? 'inline-block rounded-full border border-green bg-green/10 px-2.5 py-1 font-heading text-[11px] font-semibold tracking-wide text-greenDark'
                            : flag.status === 'FLAGGED'
                              ? 'badge-flagged'
                              : 'badge-unsure'
                        }
                      >
                        {flag.resolved ? 'FIXED' : flag.status}
                      </span>
                      {/* Ticking this off never changes the score. */}
                      {/* Only offered once a key is saved in Settings. */}
                      {hasKey() && (
                        <button
                          onClick={() => suggestFix(flag)}
                          disabled={suggestions[flag.id]?.busy}
                          className="btn border border-border bg-card px-3 py-1 text-xs hover:bg-sand disabled:opacity-50"
                          title="Ask the AI for a corrected line"
                        >
                          {suggestions[flag.id]?.busy ? 'Asking…' : '✨ Suggest a fix'}
                        </button>
                      )}
                      <button
                        onClick={() => toggleResolved(flag.id)}
                        className={`btn px-3 py-1 text-xs ${
                          flag.resolved
                            ? 'text-olive hover:bg-sand'
                            : 'border border-border bg-card hover:bg-sand'
                        }`}
                        title="Marking a flag fixed does not change the score"
                      >
                        {flag.resolved ? 'Undo' : 'Mark as fixed'}
                      </button>
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="label text-[10px]">English</span>
                      <p className="mt-1 text-[15px] leading-relaxed">
                        {flag.english || <i className="text-muted">—</i>}
                      </p>
                    </div>
                    <div>
                      <span className="label text-[10px]">{report.language}</span>
                      <p className="deva mt-1 text-[15px] leading-relaxed">
                        {flag.hindi || <i className="text-muted">—</i>}
                      </p>
                    </div>
                  </div>

                  {flag.reason && (
                    <p className="mt-3 aside border-t border-dashed border-border pt-3 text-sm leading-relaxed">
                      {flag.reason}
                    </p>
                  )}

                  {suggestions[flag.id] && !suggestions[flag.id].busy && (
                    <div className="mt-3 rounded-xl border border-border bg-tintBlue/50 p-4">
                      {suggestions[flag.id].error ? (
                        <p className="text-sm text-brand">
                          {suggestions[flag.id].error}
                        </p>
                      ) : (
                        <>
                          <span className="label text-[10px]">
                            AI suggestion — your call
                          </span>
                          <p className="deva mt-1.5 text-[15px] leading-relaxed">
                            {suggestions[flag.id].suggestion}
                          </p>
                          {suggestions[flag.id].why && (
                            <p className="mt-2 aside text-sm leading-relaxed">
                              {suggestions[flag.id].why}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className="btn-ghost px-3 py-1 text-xs"
                              onClick={() =>
                                navigator.clipboard
                                  ?.writeText(suggestions[flag.id].suggestion ?? '')
                                  .catch(() => {})
                              }
                            >
                              Copy
                            </button>
                            <button
                              className="btn-ghost px-3 py-1 text-xs"
                              onClick={() =>
                                setSuggestions((s) => {
                                  const next = { ...s }
                                  delete next[flag.id]
                                  return next
                                })
                              }
                            >
                              Dismiss
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------- actions */}
      <section className="flex flex-wrap gap-3 border-t border-border pt-6">
        <button className="btn-ghost" onClick={startEditing}>
          Edit report
        </button>
        <button className="btn-ghost" onClick={exportOne}>
          Export as JSON
        </button>
        {!confirmDelete ? (
          <button
            className="btn border border-brand/40 text-brand hover:bg-brand/5"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-2 text-sm">
            Delete “{report.title}” for good?
            <button className="btn-primary" onClick={doDelete}>
              Yes, delete
            </button>
            <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </span>
        )}
      </section>
    </div>
  )
}

/** One plain sentence about a parameter that picked up flags. */
function plainResult(key: ParameterKey, flags: number): string {
  const n = `${flags} line${flags === 1 ? '' : 's'}`
  switch (key) {
    case 'meaningDrift':
      return `${n} landed on a nearby idea instead of the English one.`
    case 'naturalPhrasing':
      return `${n} still follow English word order.`
    case 'termConsistency':
      return `${n} spell a key term differently from the rest.`
    case 'voiceConviction':
      return `${n} lost some of the conviction of the original.`
  }
}

/** A short compliment for a parameter with no flags. */
function praise(key: ParameterKey): string {
  switch (key) {
    case 'meaningDrift':
      return 'The Hindi says exactly what the English means.'
    case 'naturalPhrasing':
      return 'Reads as if it was first written in Hindi.'
    case 'termConsistency':
      return 'Key terms stay the same from start to finish.'
    case 'voiceConviction':
      return 'The conviction of the original comes through.'
  }
}

/** "Sep 2026", as used throughout the design. */
export function formatMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'article'
  )
}
