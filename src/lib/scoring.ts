/**
 * The scoring engine.
 *
 * Rules (all numbers come from src/config/scoring.ts):
 *   parameter score = max(0, 10 - (number of FLAGGED items) x deduction)
 *   overall score   = weighted average of the four parameter scores
 *   UNSURE items are tracked but never cost points.
 */

import {
  GRADES,
  MAX_SCORE,
  PARAMETERS,
  PARAMETER_ALIASES,
  PARAM_BY_KEY,
} from '../config/scoring'
import type { Flag, ParameterKey, Report, ScoredReport } from '../types'

/** An object with 0 for every parameter — handy starting point. */
export function emptyCounts(): Record<ParameterKey, number> {
  return {
    meaningDrift: 0,
    naturalPhrasing: 0,
    termConsistency: 0,
    voiceConviction: 0,
  }
}

/** Count FLAGGED items per parameter. */
export function countFlags(flags: Flag[]): Record<ParameterKey, number> {
  const counts = emptyCounts()
  for (const f of flags) {
    if (f.status === 'FLAGGED') counts[f.parameter] += 1
  }
  return counts
}

/** Count UNSURE items per parameter. */
export function countUnsure(flags: Flag[]): Record<ParameterKey, number> {
  const counts = emptyCounts()
  for (const f of flags) {
    if (f.status === 'UNSURE') counts[f.parameter] += 1
  }
  return counts
}

/** Score for one parameter, given how many FLAGGED items it has. */
export function parameterScore(key: ParameterKey, flagCount: number): number {
  const { deduction } = PARAM_BY_KEY[key]
  return Math.max(0, MAX_SCORE - flagCount * deduction)
}

/** Round to one decimal place (0.1 steps), the way the dashboard shows scores. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Weighted average of the four parameter scores, rounded to 1 decimal. */
export function overallScore(scores: Record<ParameterKey, number>): number {
  const total = PARAMETERS.reduce(
    (sum, p) => sum + scores[p.key] * p.weight,
    0,
  )
  return round1(total)
}

/** The label shown next to a score, e.g. "Almost there". */
export function gradeFor(score: number): string {
  const found = GRADES.find((g) => score >= g.min)
  return found ? found.label : GRADES[GRADES.length - 1].label
}

/**
 * Turn a saved report into a fully scored report.
 * A report with no FLAGGED items automatically scores 10.0 everywhere,
 * which also covers reports marked CLEAN.
 */
export function scoreReport(report: Report): ScoredReport {
  const flagCounts = countFlags(report.flags)
  const unsureCounts = countUnsure(report.flags)

  const scores = emptyCounts()
  for (const p of PARAMETERS) {
    scores[p.key] = parameterScore(p.key, flagCounts[p.key])
  }

  const overall = overallScore(scores)
  return {
    ...report,
    scores,
    flagCounts,
    unsureCounts,
    overall,
    grade: gradeFor(overall),
  }
}

/** Score a whole list, oldest first (the order charts expect). */
export function scoreAll(reports: Report[]): ScoredReport[] {
  return reports
    .map(scoreReport)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0))
}

/**
 * Match a parameter name written by hand or read from a PDF.
 * Ignores case, spacing, punctuation and small variations such as
 * "meaning-drift" or "Term consistency". Returns null if nothing matches.
 */
export function matchParameter(raw: string): ParameterKey | null {
  if (!raw) return null
  // Normalise: lower case, strip everything that is not a letter or space.
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z\s&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return null

  const squashed = cleaned.replace(/\s|&/g, '')

  // Longest alias first so "voice and conviction" wins over "voice".
  const candidates: { key: ParameterKey; alias: string }[] = []
  for (const key of Object.keys(PARAMETER_ALIASES) as ParameterKey[]) {
    for (const alias of PARAMETER_ALIASES[key]) candidates.push({ key, alias })
  }
  candidates.sort((a, b) => b.alias.length - a.alias.length)

  for (const { key, alias } of candidates) {
    const aliasSquashed = alias.replace(/\s|&/g, '')
    if (cleaned === alias || squashed === aliasSquashed) return key
  }
  for (const { key, alias } of candidates) {
    const aliasSquashed = alias.replace(/\s|&/g, '')
    if (squashed.includes(aliasSquashed)) return key
  }
  return null
}

/** Match a flag status leniently ("flagged", "Flag", "unsure", "?"). */
export function matchStatus(raw: string): 'FLAGGED' | 'UNSURE' {
  const t = (raw || '').toLowerCase()
  if (t.includes('unsure') || t.includes('maybe') || t.includes('?')) {
    return 'UNSURE'
  }
  return 'FLAGGED'
}
