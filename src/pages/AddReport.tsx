/**
 * ADD REPORT (/add)
 *
 * Flow: drop a PDF -> parse -> review and fix in the table -> Save.
 * Nothing touches the database until "Save Report" is clicked.
 * If the PDF cannot be read at all, the same table works as a blank form.
 */

import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FlagTable, { blankFlag } from '../components/FlagTable'
import ScoreBar from '../components/ScoreBar'
import { addReport } from '../db/db'
import { extractPdfText } from '../lib/pdf'
import { parseFlagReport, parseSummaryLine } from '../lib/parser'
import { scoreReport } from '../lib/scoring'
import { CLIPBOARD_TEXT } from '../lib/template'
import { PARAM_BY_KEY } from '../config/scoring'
import { scoreColor } from '../config/theme'
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
  const [fileName, setFileName] = useState<string | null>(null)

  // The report being built, before saving.
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [language, setLanguage] = useState<Language>('Hindi')
  const [flags, setFlags] = useState<Flag[]>([])
  const [summaryCheck, setSummaryCheck] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [savedIndex, setSavedIndex] = useState(0)

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
    setFileName(file.name)
    try {
      const text = await extractPdfText(file)
      const { report, warnings: w } = parseFlagReport(text)
      setTitle(report.title === 'Untitled article' ? '' : report.title)
      setDate(report.date)
      setLanguage(report.language)
      setFlags(report.flags)
      setWarnings(w)

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

  /** Save to IndexedDB, then show the "your bar is in" screen. */
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
    const { allReports } = await import('../db/db')
    setSavedIndex((await allReports()).length)
    setSavedId(id)
    setStep('saved')
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

  // --- "Report saved" celebration ----------------------------------------
  if (step === 'saved') {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center text-center">
        {/* The emblem sits faintly behind the new bar. */}
        <img
          src="./gurukul-emblem.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute w-64 max-w-[60%] opacity-20"
        />
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          style={{ transformOrigin: 'bottom' }}
          className="relative"
        >
          <ScoreBar
            score={preview.overall}
            tone="light"
            height={190}
            width={56}
            animate={false}
          />
        </motion.div>

        <motion.h1
          className="relative mt-8 font-heading text-[clamp(24px,3vw,32px)] font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Report saved — your bar is in
        </motion.h1>
        <p className="relative mt-1 aside text-lg">“{preview.title}”</p>
        <p className="relative mt-3 flex items-baseline gap-1">
          <span
            className="font-heading text-[40px] font-bold leading-none"
            style={{ color: scoreColor(preview.overall) }}
          >
            {preview.overall.toFixed(1)}
          </span>
          <span className="font-heading text-lg text-olive">/10</span>
        </p>
        <p className="relative mt-1 font-heading text-sm font-semibold">
          {preview.grade} · article {savedIndex} in your journey
        </p>

        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
          <Link to={`/articles/${savedId}`} className="btn-primary">
            See report card
          </Link>
          <Link to="/" className="btn-ghost">
            Back to the journey
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="btn-ghost">
        ← Back to Home
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[clamp(26px,3vw,34px)] font-bold">
            Add a report
          </h1>
          <p className="mt-0.5 text-[15px] text-olive">
            Upload the Flag Report PDF from Claude. Check the flags, then save.
          </p>
        </div>
        <button
          className="font-heading text-sm text-blue underline underline-offset-4 hover:text-brand"
          onClick={copyTemplate}
        >
          {copied ? '✓ Copied' : 'Copy review template'}
        </button>
      </div>

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
            className={`cursor-pointer rounded-card border-2 border-dashed p-12 text-center transition-colors sm:p-16 ${
              dragging ? 'border-brand bg-brand/5' : 'border-border hover:bg-sand/40'
            }`}
          >
            {/* A small PDF sheet with an upward arrow. */}
            <div className="mx-auto mb-5 flex h-16 w-14 flex-col items-center justify-center rounded-lg border border-border bg-card">
              <span className="text-2xl leading-none text-brand" aria-hidden>
                ↑
              </span>
              <span className="mt-0.5 font-heading text-[9px] font-semibold tracking-wider text-olive">
                PDF
              </span>
            </div>
            <p className="font-heading text-lg font-semibold">
              {busy ? 'Reading the PDF…' : 'Drop your Flag Report PDF here'}
            </p>
            <p className="mt-1 text-[15px] text-olive">
              or <span className="text-blue underline underline-offset-4">browse files</span>
            </p>
            <p className="mt-2 font-mono text-xs text-muted">PDF · stays on this device</p>
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

          <button
            className="btn-ghost"
            onClick={() => {
              setFlags([blankFlag()])
              setFileName(null)
              setStep('review')
            }}
          >
            Enter a report by hand
          </button>
        </>
      )}

      {step === 'review' && (
        <div className="space-y-5">
          {/* The file that was read */}
          {fileName && (
            <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="rounded bg-ink px-1.5 py-0.5 font-heading text-[10px] font-bold text-white">
                PDF
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                {fileName}
              </span>
              <span className="font-heading text-sm font-semibold text-greenDark">
                {flags.length} flag{flags.length === 1 ? '' : 's'} extracted
              </span>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
              {error}
            </p>
          )}

          {warnings.length > 0 && (
            <div className="rounded-xl border border-border bg-tintYellow p-4 text-sm">
              <p className="font-heading font-semibold">
                Please check these before saving:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {summaryCheck && (
            <p className="rounded-xl bg-tintGreen p-4 text-sm">{summaryCheck}</p>
          )}

          {/* Article details */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="label">
              Article title
              <input
                className="input mt-1.5 font-body normal-case tracking-normal"
                value={title}
                placeholder="Auto-filled from the PDF"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="label">
              Date
              <input
                type="date"
                className="input mt-1.5 font-body normal-case tracking-normal"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="label">
              Language
              <select
                className="select mt-1.5 normal-case tracking-normal"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                <option value="Hindi">Hindi</option>
                <option value="Gujarati">Gujarati</option>
              </select>
            </label>
          </div>

          {/* The review table */}
          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-[17px] font-semibold">
                Review extracted flags
              </h2>
              <span className="font-heading text-sm text-olive">
                Estimated score{' '}
                <b
                  className="text-base"
                  style={{ color: scoreColor(preview.overall) }}
                >
                  {preview.overall.toFixed(1)}
                </b>
              </span>
            </div>
            <FlagTable flags={flags} onChange={setFlags} />
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="btn-ghost"
              onClick={() => {
                setStep('upload')
                setFlags([])
                setWarnings([])
                setError(null)
                setFileName(null)
              }}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={save}>
              Save Report
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
