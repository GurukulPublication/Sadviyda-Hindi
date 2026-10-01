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
    // Tabs are kept: pdf.ts uses them to mark a column break inside a line,
    // which is how the English and the translation stay apart.
    .map((l) =>
      l
        .split('\t')
        .map((segment) => segment.replace(/ +/g, ' ').trim())
        .join('\t')
        .replace(/\s+$/, ''),
    )
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
 * Parse a report written in the plain template (the one the "Copy review
 * template" button produces).
 */
function parseTemplateReport(text: string): ParseResult {
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

/* ------------------------------------------------------------------------- *
 * The designed Flag Report
 *
 * Reviews are not always written in the plain template. A designed report lays
 * each flag out as a titled box:
 *
 *   FLAGGED — TONE LOSS F1 · Opening
 *   ENGLISH                  HINDI            <- two columns, one line
 *   What if the friends...   जिन दोस्तों...
 *   THE GAP          <why it was flagged>
 *   WHY IT MATTERS   <why it matters>
 *
 * There are no line numbers; each flag has a reference (F1, U1, C1) and the
 * article section it came from. CLEAN entries are praise, not problems, so
 * they are counted and reported but never saved as flags.
 * ------------------------------------------------------------------------- */

/** "FLAGGED — TONE LOSS F1 · Opening", "UNSURE U1 · Throughout". */
/**
 * No word boundary after the status: PDF text extraction sometimes loses the
 * space, leaving "UNSUREU1 · Throughout". The reference and the "·" that
 * follow are distinctive enough on their own.
 */
const STYLED_FLAG_HEADER =
  /^(FLAGGED|UNSURE|CLEAN)[ \t]*(?:[—–-][ \t]*([^\t\n]*?))?[ \t]*([FUC]\d+)[ \t]*·[ \t]*([^\t\n]*)$/i

/** Does this text look like a designed report rather than the template? */
export function isStyledReport(text: string): boolean {
  return text.split('\n').some((line) => STYLED_FLAG_HEADER.test(line.trim()))
}

/** Labels inside a flag box. Compared with spaces removed, because the */
/** designed reports letter-space their small caps ("T HE CALL"). */
const BOX_LABELS: { key: string; match: string }[] = [
  { key: 'english', match: 'ENGLISH' },
  { key: 'hindi', match: 'HINDI' },
  { key: 'gujarati', match: 'GUJARATI' },
  { key: 'gap', match: 'THEGAP' },
  { key: 'why', match: 'WHYITMATTERS' },
  { key: 'call', match: 'THECALL' },
  { key: 'options', match: 'OPTIONS' },
  { key: 'note', match: 'THENOTE' },
]

/** Strip a known label off the front of a line; returns null if there is none. */
function takeLabel(line: string): { key: string; rest: string } | null {
  const squashed = line.replace(/\s/g, '').toUpperCase()
  for (const { key, match } of BOX_LABELS) {
    if (!squashed.startsWith(match)) continue
    // Walk the original line until `match` worth of non-space characters pass.
    let seen = 0
    let i = 0
    for (; i < line.length && seen < match.length; i++) {
      if (!/\s/.test(line[i])) seen++
    }
    return { key, rest: line.slice(i).trim() }
  }
  return null
}

/** "ENGLISH", "HINDI", or the two of them as one column-heading row. */
function isColumnHeading(line: string): boolean {
  const squashed = line.replace(/\s/g, '').toUpperCase()
  return /^(ENGLISH|HINDI|GUJARATI)+$/.test(squashed)
}

/** True when a string contains Devanagari or Gujarati letters. */
function hasIndicText(s: string): boolean {
  return /[ऀ-ॿ઀-૿]/.test(s)
}

/** Parse a designed report into a Report plus warnings. */
function parseStyledReport(text: string): ParseResult {
  const warnings: string[] = []
  const lines = text.split('\n')

  // --- Header -------------------------------------------------------------
  const head = lines.slice(0, 20).join('\n')
  // The article title is the quoted phrase near the top, often split over
  // two lines by the layout.
  const quoted = head.match(/[“"]([^”"]{3,160})[”"]/)
  const title = quoted ? quoted[1].replace(/\s*\n\s*/g, ' ').trim() : ''
  if (!title) {
    warnings.push('Could not find the article title — please type it in.')
  }

  const language: Language = /gujarati/i.test(head) ? 'Gujarati' : 'Hindi'

  // These reports carry no date, so today's is used until it is corrected.
  const dateMatch = head.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!dateMatch) {
    warnings.push(
      'This report does not carry a date — set the article date yourself.',
    )
  }

  // --- Flag boxes ---------------------------------------------------------
  const headerIndexes: number[] = []
  lines.forEach((line, i) => {
    if (STYLED_FLAG_HEADER.test(line.trim())) headerIndexes.push(i)
  })

  const flags: Flag[] = []
  let cleanCount = 0

  headerIndexes.forEach((startIndex, n) => {
    const header = lines[startIndex].trim().match(STYLED_FLAG_HEADER)!
    const rawStatus = header[1].toUpperCase()
    const rawParameter = (header[2] || '').trim()
    const ref = header[3].toUpperCase()
    const section = (header[4] || '').trim()

    // CLEAN entries praise what went well; they are not flags.
    if (rawStatus === 'CLEAN') {
      cleanCount++
      return
    }

    const end = headerIndexes[n + 1] ?? lines.length
    const body = lines.slice(startIndex + 1, end)

    // Inside a box, everything before a prose label ("THE GAP", "WHY IT
    // MATTERS") belongs to the bilingual area: the English line and its
    // translation, side by side. Which is which is decided by the script
    // itself rather than by position, so a line that wraps or loses its
    // column still lands in the right place.
    const PROSE_LABELS = new Set(['gap', 'why', 'call', 'options', 'note'])
    const parts: Record<string, string[]> = {}
    let current: string | null = null

    for (const rawLine of body) {
      const line = rawLine.trim()
      if (!line) continue

      // "ENGLISH | HINDI" column headings carry no content.
      if (isColumnHeading(line)) {
        current = null
        continue
      }

      const labelled = takeLabel(line)
      if (labelled && PROSE_LABELS.has(labelled.key)) {
        current = labelled.key
        if (labelled.rest) (parts[current] ??= []).push(labelled.rest)
        continue
      }

      if (current && PROSE_LABELS.has(current)) {
        // A prose paragraph. If a justified line was split into segments,
        // put it back together.
        ;(parts[current] ??= []).push(line.split('\t').join(' ').trim())
        continue
      }

      // The bilingual area.
      for (const segment of line.split('\t')) {
        const text = segment.trim()
        if (!text) continue
        const side = hasIndicText(text) ? 'hindi' : 'english'
        ;(parts[side] ??= []).push(text)
      }
    }

    const join = (key: string) => (parts[key] ?? []).join(' ').trim()

    // The reason is "the gap" plus "why it matters" (or, for an unsure item,
    // "the call" plus "options").
    const reason = [join('gap'), join('why'), join('call'), join('options'), join('note')]
      .filter(Boolean)
      .join(' — ')

    const parameter: ParameterKey | null = matchParameter(rawParameter)
    if (!parameter) {
      warnings.push(
        rawParameter
          ? `${ref}: could not tell which parameter "${rawParameter}" is — set to Meaning Drift, please correct it.`
          : `${ref}: no parameter was named — set to Meaning Drift, please correct it.`,
      )
    }

    flags.push({
      id: newId(),
      line: null,
      ref,
      section: section || undefined,
      english: join('english'),
      hindi: join('hindi') || join('gujarati'),
      parameter: parameter ?? 'meaningDrift',
      status: rawStatus === 'UNSURE' ? 'UNSURE' : 'FLAGGED',
      reason,
    })
  })

  if (cleanCount > 0) {
    warnings.push(
      `${cleanCount} "clean" highlight${cleanCount === 1 ? ' was' : 's were'} listed in this report. Those praise what went well, so they are not saved as flags and do not affect the score.`,
    )
  }

  if (flags.length === 0) {
    warnings.push(
      'No flags were found in this PDF. Add them by hand below, or check that the report uses one of the known formats.',
    )
  }

  const report: Report = {
    title: title || 'Untitled article',
    date: dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10),
    language,
    status: flags.some((f) => f.status === 'FLAGGED') ? 'FLAGGED' : 'CLEAN',
    flags,
    createdAt: new Date().toISOString(),
  }

  return { report, warnings, rawText: text }
}

/**
 * Parse the plain text of a Flag Report into a Report plus warnings.
 *
 * Two layouts are understood: the plain template, and the designed report
 * with its FLAGGED/UNSURE/CLEAN boxes. Never throws — if it cannot find
 * anything it returns an empty report and says so in the warnings, so the Add
 * page can fall back to manual entry.
 */
export function parseFlagReport(rawInput: string): ParseResult {
  const text = normaliseText(rawInput || '')
  if (isStyledReport(text)) return parseStyledReport(text)
  return parseTemplateReport(text)
}
