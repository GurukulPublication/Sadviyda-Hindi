/**
 * Everything the Home page needs to say something useful about progress:
 * averages, streaks, repeat offenders and re-flags.
 */

import { PARAMETERS, PARAM_BY_KEY } from '../config/scoring'
import type { ParameterKey, ScoredReport } from '../types'
import { emptyCounts, round1 } from './scoring'

/** Average overall score across the given reports. */
export function averageOverall(reports: ScoredReport[]): number {
  if (!reports.length) return 0
  return round1(
    reports.reduce((sum, r) => sum + r.overall, 0) / reports.length,
  )
}

/** Average score per parameter (used by the radar chart). */
export function averageByParameter(
  reports: ScoredReport[],
): Record<ParameterKey, number> {
  const out = emptyCounts()
  if (!reports.length) return out
  for (const p of PARAMETERS) {
    out[p.key] = round1(
      reports.reduce((sum, r) => sum + r.scores[p.key], 0) / reports.length,
    )
  }
  return out
}

/** Total FLAGGED items per parameter across the given reports. */
export function totalFlagsByParameter(
  reports: ScoredReport[],
): Record<ParameterKey, number> {
  const out = emptyCounts()
  for (const r of reports) {
    for (const p of PARAMETERS) out[p.key] += r.flagCounts[p.key]
  }
  return out
}

/** Total number of FLAGGED items everywhere. */
export function totalFlags(reports: ScoredReport[]): number {
  return reports.reduce(
    (sum, r) => sum + r.flags.filter((f) => f.status === 'FLAGGED').length,
    0,
  )
}

/**
 * "Flags resolved": every flag from an earlier article that no longer appears
 * in the latest one is counted as dealt with. In practice this is simply the
 * number of flags in all reports except the newest — issues already behind you.
 */
export function flagsResolved(reports: ScoredReport[]): number {
  if (reports.length < 2) return 0
  return totalFlags(reports.slice(0, -1))
}

/** How many of the most recent articles in a row scored 8 or higher. */
export function currentStreak(reports: ScoredReport[], threshold = 8): number {
  let streak = 0
  for (let i = reports.length - 1; i >= 0; i--) {
    if (reports[i].overall >= threshold) streak++
    else break
  }
  return streak
}

/** The change between the last two articles (positive = improving). */
export function latestDelta(reports: ScoredReport[]): number | null {
  if (reports.length < 2) return null
  const last = reports[reports.length - 1].overall
  const prev = reports[reports.length - 2].overall
  return round1(last - prev)
}

/** The three parameters with the most flags, weakest first. */
export function weakestParameters(
  reports: ScoredReport[],
  count = 3,
): { key: ParameterKey; flags: number; average: number; sentence: string }[] {
  const flags = totalFlagsByParameter(reports)
  const avg = averageByParameter(reports)
  return PARAMETERS.map((p) => ({
    key: p.key,
    flags: flags[p.key],
    average: avg[p.key],
    sentence: weaknessSentence(p.key, flags[p.key], reports.length),
  }))
    .filter((p) => p.flags > 0)
    .sort((a, b) => b.flags - a.flags || a.average - b.average)
    .slice(0, count)
}

/** One simple sentence describing a weak parameter. */
function weaknessSentence(
  key: ParameterKey,
  flags: number,
  reportCount: number,
): string {
  const label = PARAM_BY_KEY[key].label
  const per = reportCount ? (flags / reportCount).toFixed(1) : '0'
  switch (key) {
    case 'meaningDrift':
      return `${flags} ${label} flags (about ${per} per article) — your Hindi sometimes lands on a nearby idea instead of the exact one.`
    case 'naturalPhrasing':
      return `${flags} ${label} flags (about ${per} per article) — your Hindi often follows English word order.`
    case 'termConsistency':
      return `${flags} ${label} flags (about ${per} per article) — key terms and names are not always spelt or handled the same way.`
    case 'voiceConviction':
      return `${flags} ${label} flags (about ${per} per article) — the tone flattens out where the English is firm.`
  }
}

export interface RepeatOffender {
  /** The term, or a short version of the reason if there was no term. */
  label: string
  /** How many different articles it appeared in. */
  articles: number
  /** How many flags in total. */
  count: number
}

/**
 * Terms (or recurring reasons) flagged in two or more different articles.
 * Terms are preferred; if a flag has no term we fall back to its first few
 * meaningful words, which catches repeated phrasing notes.
 */
export function repeatOffenders(reports: ScoredReport[]): RepeatOffender[] {
  const map = new Map<string, { articles: Set<number>; count: number; label: string }>()

  reports.forEach((report, index) => {
    for (const flag of report.flags) {
      if (flag.status !== 'FLAGGED') continue
      const raw = flag.term?.trim() || reasonKey(flag.reason)
      if (!raw) continue
      const key = raw.toLowerCase()
      const entry = map.get(key) ?? {
        articles: new Set<number>(),
        count: 0,
        label: raw,
      }
      entry.articles.add(report.id ?? index)
      entry.count += 1
      map.set(key, entry)
    }
  })

  return [...map.values()]
    .filter((e) => e.articles.size >= 2)
    .map((e) => ({ label: e.label, articles: e.articles.size, count: e.count }))
    .sort((a, b) => b.articles - a.articles || b.count - a.count)
}

/** A short, comparable key made from a reason sentence. */
function reasonKey(reason: string): string {
  const words = (reason || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
  return words.slice(0, 4).join(' ')
}

/**
 * How many flags in the newest report repeat something already flagged before
 * (same term, or the same parameter with a very similar reason).
 */
export function reflagCount(reports: ScoredReport[]): number {
  if (reports.length < 2) return 0
  const latest = reports[reports.length - 1]
  const earlier = reports.slice(0, -1)

  const seen = new Set<string>()
  for (const r of earlier) {
    for (const f of r.flags) {
      if (f.term) seen.add(`term:${f.term.trim().toLowerCase()}`)
      seen.add(`reason:${f.parameter}:${reasonKey(f.reason)}`)
    }
  }

  let count = 0
  for (const f of latest.flags) {
    if (f.status !== 'FLAGGED') continue
    const termKey = f.term ? `term:${f.term.trim().toLowerCase()}` : null
    const reasonK = `reason:${f.parameter}:${reasonKey(f.reason)}`
    if ((termKey && seen.has(termKey)) || seen.has(reasonK)) count++
  }
  return count
}

/** Parameters with no flags at all in a single report. */
export function cleanParameters(report: ScoredReport): ParameterKey[] {
  return PARAMETERS.filter((p) => report.flagCounts[p.key] === 0).map(
    (p) => p.key,
  )
}

/** The weakest parameter of a single report (lowest score, most flags). */
export function weakestOf(report: ScoredReport): ParameterKey | null {
  const withFlags = PARAMETERS.filter((p) => report.flagCounts[p.key] > 0)
  if (!withFlags.length) return null
  return withFlags.sort(
    (a, b) =>
      report.scores[a.key] - report.scores[b.key] ||
      report.flagCounts[b.key] - report.flagCounts[a.key],
  )[0].key
}

export interface MonthBucket {
  /** Sort key, e.g. "2026-01". */
  key: string
  /** Short month name, e.g. "Jan". */
  month: string
  /** Four-digit year, shown only when it changes. */
  year: string
  reports: ScoredReport[]
  /** FLAGGED items in that month, per parameter. */
  flags: Record<ParameterKey, number>
  /** Total FLAGGED items in that month. */
  total: number
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Group reports by calendar month, oldest first. Used by the "flags per month"
 * chart and by the month headings on the Articles page.
 */
export function byMonth(reports: ScoredReport[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>()
  for (const r of reports) {
    const key = r.date.slice(0, 7) // YYYY-MM
    const monthIndex = Number(r.date.slice(5, 7)) - 1
    const bucket =
      map.get(key) ??
      {
        key,
        month: MONTH_NAMES[monthIndex] ?? '',
        year: r.date.slice(0, 4),
        reports: [],
        flags: emptyCounts(),
        total: 0,
      }
    bucket.reports.push(r)
    for (const p of PARAMETERS) {
      bucket.flags[p.key] += r.flagCounts[p.key]
      bucket.total += r.flagCounts[p.key]
    }
    map.set(key, bucket)
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

/** The long month name for a heading, e.g. "September 2026". */
export function monthHeading(bucket: MonthBucket): string {
  const full = new Date(`${bucket.key}-01T00:00:00`)
  if (Number.isNaN(full.getTime())) return `${bucket.month} ${bucket.year}`
  return full.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
