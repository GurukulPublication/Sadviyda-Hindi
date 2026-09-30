/**
 * Flag Report parser.
 *
 * Step 1 (pdf.ts) turns the PDF into plain text.
 * Step 2 (this file) turns that plain text into a Report object.
 *
 * The parser is deliberately forgiving: PDF text extraction shifts spacing
 * around, so every label is matched case-insensitively and blocks are split on
 * anything that looks like "--- FLAG 3 ---".
 */

import { matchParameter, matchStatus } from './scoring'
import type { Flag, Language, ParameterKey, Report } from '../types'

export interface ParseResult {
  report: Report
  /** Anything the parser was unsure about, shown above the review table. */
  warnings: string[]
  /** The raw text, kept so the review step can show it if needed. */
  rawText: string
}

/** Make a unique-enough id for a flag row. */
function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Read "Label: value" from a block of text (first match wins). */
function field(text: string, label: string): string {
  const re = new RegExp(`^[\\s>*-]*${label}\\s*[:\\-]\\s*(.*)$`, 'im')
  const m = text.match(re)
  return m ? m[1].trim() : ''
}

/**
 * Read a field that may run over several lines (English / Hindi / Reason).
 * It keeps reading until it hits the next known label or the end of the block.
 */
function multilineField(text: string, label: string): string {
  const labels = [
    'line',
    'parameter',
    'status',
    'term',
    'english',
    'hindi',
    'gujarati',
    'reason',
  ]
  const others = labels.filter((l) => l !== label.toLowerCase()).join('|')
  const re = new RegExp(
    // Stop at the next known label, or at the very end of the block.
    `^[\\s>*-]*${label}\\s*[:\\-]\\s*([\\s\\S]*?)(?=^[\\s>*-]*(?:${others})\\s*[:\\-]|$(?![\\s\\S]))`,
    'im',
  )
  const m = text.match(re)
  if (!m) return ''
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .trim()
}

/** Normalise the whitespace pdf.js gives us, without losing line breaks. */
export function normaliseText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
}

/** Pull a date out of the header, accepting a few common spellings. */
function parseDate(raw: string): string | null {
  if (!raw) return null
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const slash = raw.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{4})/)
  if (slash) {
    const [, d, m, y] = slash
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const parsed = Date.parse(raw)
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10)
  return null
}

/**
 * Parse the plain text of a Flag Report into a Report plus warnings.
 * Never throws: if it cannot find anything it returns an empty report and
 * says so in the warnings, so the Add page can fall back to manual entry.
 */
export function parseFlagReport(rawInput: string): ParseResult {
  const text = normaliseText(rawInput || '')
  const warnings: string[] = []

  // --- Header -------------------------------------------------------------
  // Everything before the first "--- FLAG" marker (or before SUMMARY).
  const firstFlagIndex = text.search(/^\s*-{2,}\s*flag\b/im)
  const summaryIndex = text.search(/^\s*summary\b/im)
  const headerEnd =
    firstFlagIndex >= 0
      ? firstFlagIndex
      : summaryIndex >= 0
        ? summaryIndex
        : text.length
  const header = text.slice(0, headerEnd)

  const title = field(header, 'article') || field(header, 'title')
  if (!title) warnings.push('Could not find the article title — please type it in.')

  const dateRaw = field(header, 'date')
  const date = parseDate(dateRaw)
  if (!date) warnings.push('Could not read the date — please check it.')

  const langRaw = (field(header, 'language') || '').toLowerCase()
  const language: Language = langRaw.includes('gujarati') ? 'Gujarati' : 'Hindi'

  const statusRaw = (field(header, 'status') || '').toUpperCase()
  const headerStatus: 'CLEAN' | 'FLAGGED' =
    statusRaw.includes('CLEAN') ? 'CLEAN' : 'FLAGGED'

  // --- Flag blocks --------------------------------------------------------
  const body = text.slice(headerEnd, summaryIndex >= 0 ? summaryIndex : text.length)
  // Split on "--- FLAG n ---" style separators.
  const blocks = body
    .split(/^\s*-{2,}\s*flag\b[^\n]*$/gim)
    .map((b) => b.trim())
    .filter(Boolean)

  const flags: Flag[] = []
  blocks.forEach((block, index) => {
    const parameterRaw = field(block, 'parameter')
    const englishText = multilineField(block, 'english')
    const hindiText =
      multilineField(block, 'hindi') || multilineField(block, 'gujarati')
    const reason = multilineField(block, 'reason')

    // A block with none of these is probably stray text, not a flag.
    if (!parameterRaw && !englishText && !hindiText && !reason) return

    const parameter: ParameterKey | null = matchParameter(parameterRaw)
    if (!parameter) {
      warnings.push(
        `Flag ${index + 1}: could not tell which parameter "${parameterRaw}" is — set to Meaning Drift, please correct it.`,
      )
    }

    const lineRaw = field(block, 'line')
    const lineNum = lineRaw.match(/\d+/)
    if (!lineNum) {
      warnings.push(`Flag ${index + 1}: no line number found.`)
    }

    flags.push({
      id: newId(),
      line: lineNum ? Number(lineNum[0]) : null,
      english: englishText,
      hindi: hindiText,
      parameter: parameter ?? 'meaningDrift',
      status: matchStatus(field(block, 'status')),
      reason,
      term: field(block, 'term') || undefined,
    })
  })

  if (flags.length === 0 && headerStatus !== 'CLEAN') {
    warnings.push(
      'No flags were found in this PDF. Add them by hand below, or check that the report uses the standard template.',
    )
  }

  // A report is CLEAN only if the header says so AND nothing was flagged.
  const hasFlagged = flags.some((f) => f.status === 'FLAGGED')
  const status: 'CLEAN' | 'FLAGGED' =
    headerStatus === 'CLEAN' && !hasFlagged ? 'CLEAN' : 'FLAGGED'
  if (headerStatus === 'CLEAN' && hasFlagged) {
    warnings.push(
      'The header says CLEAN but flags were found — treating the report as FLAGGED.',
    )
  }

  const report: Report = {
    title: title || 'Untitled article',
    date: date || new Date().toISOString().slice(0, 10),
    language,
    status,
    flags,
    createdAt: new Date().toISOString(),
  }

  return { report, warnings, rawText: text }
}

/**
 * Read the SUMMARY line, if the report has one. Used only as a sanity check
 * shown in the review step — the score always comes from the actual flags.
 */
export function parseSummaryLine(
  rawInput: string,
): Partial<Record<ParameterKey | 'unsure', number>> | null {
  const text = normaliseText(rawInput)
  const idx = text.search(/^\s*summary\b/im)
  if (idx < 0) return null
  const section = text.slice(idx)
  const out: Partial<Record<ParameterKey | 'unsure', number>> = {}
  const pairs = section.match(/([A-Za-z&\s]+?)\s*:\s*(\d+)/g) || []
  for (const pair of pairs) {
    const m = pair.match(/([A-Za-z&\s]+?)\s*:\s*(\d+)/)
    if (!m) continue
    const name = m[1].trim()
    const value = Number(m[2])
    if (/unsure/i.test(name)) {
      out.unsure = value
      continue
    }
    const key = matchParameter(name)
    if (key) out[key] = value
  }
  return Object.keys(out).length ? out : null
}
