import { describe, expect, it } from 'vitest'
import { parseFlagReport, parseSummaryLine } from './parser'
import { REVIEW_TEMPLATE } from './template'

/** A report in exactly the template format. */
const SAMPLE = `FLAG REPORT
Article: The Lamp That Does Not Flicker
Date: 2026-03-14
Language: Hindi
Status: FLAGGED

--- FLAG 1 ---
Line: 4
Parameter: Natural Phrasing
Status: FLAGGED
English: He walked towards the temple with a heart full of longing.
Hindi: वह मंदिर की ओर चला एक हृदय के साथ जो लालसा से भरा था।
Reason: The Hindi copies the English clause order. A natural Hindi line would
place the longing before the walking.

--- FLAG 2 ---
Line: 11
Parameter: meaning-drift
Status: FLAGGED
Term: dehbhav
English: He had not yet let go of body-consciousness.
Hindi: उसने अभी तक शरीर का मोह नहीं छोड़ा था।
Reason: "dehbhav" is a narrower idea than "moh". The Hindi softens it.

--- FLAG 3 ---
Line: 19
Parameter: Voice & Conviction
Status: UNSURE
English: This is the only way.
Hindi: यही एकमात्र मार्ग है।
Reason: Possibly fine, but the English is more emphatic. Your call.

SUMMARY
Meaning Drift: 1 | Natural Phrasing: 1 | Term Consistency: 0 | Voice & Conviction: 0 | Unsure: 1
`

describe('parseFlagReport (header)', () => {
  it('reads the title, date, language and status', () => {
    const { report } = parseFlagReport(SAMPLE)
    expect(report.title).toBe('The Lamp That Does Not Flicker')
    expect(report.date).toBe('2026-03-14')
    expect(report.language).toBe('Hindi')
    expect(report.status).toBe('FLAGGED')
  })

  it('handles a CLEAN report with no flags', () => {
    const clean = `FLAG REPORT
Article: A Quiet Morning
Date: 2026-04-02
Language: Hindi
Status: CLEAN

SUMMARY
Meaning Drift: 0 | Natural Phrasing: 0 | Term Consistency: 0 | Voice & Conviction: 0 | Unsure: 0
`
    const { report, warnings } = parseFlagReport(clean)
    expect(report.status).toBe('CLEAN')
    expect(report.flags).toHaveLength(0)
    expect(warnings).toHaveLength(0)
  })

  it('falls back to Gujarati when the header says so', () => {
    const { report } = parseFlagReport(
      SAMPLE.replace('Language: Hindi', 'Language: Gujarati'),
    )
    expect(report.language).toBe('Gujarati')
  })
})

describe('parseFlagReport (flags)', () => {
  it('finds every flag block', () => {
    const { report } = parseFlagReport(SAMPLE)
    expect(report.flags).toHaveLength(3)
  })

  it('extracts the fields of a flag', () => {
    const { report } = parseFlagReport(SAMPLE)
    const first = report.flags[0]
    expect(first.line).toBe(4)
    expect(first.parameter).toBe('naturalPhrasing')
    expect(first.status).toBe('FLAGGED')
    expect(first.english).toContain('walked towards the temple')
    expect(first.hindi).toContain('मंदिर')
    // The reason runs over two lines in the PDF and should be joined up.
    expect(first.reason).toContain('natural Hindi line would place the longing')
  })

  it('matches parameter names leniently', () => {
    const { report } = parseFlagReport(SAMPLE)
    expect(report.flags[1].parameter).toBe('meaningDrift')
    expect(report.flags[2].parameter).toBe('voiceConviction')
  })

  it('reads the optional term', () => {
    const { report } = parseFlagReport(SAMPLE)
    expect(report.flags[1].term).toBe('dehbhav')
    expect(report.flags[0].term).toBeUndefined()
  })

  it('reads UNSURE status', () => {
    const { report } = parseFlagReport(SAMPLE)
    expect(report.flags[2].status).toBe('UNSURE')
  })
})

describe('parseFlagReport (robustness)', () => {
  it('does not throw on empty input', () => {
    const { report, warnings } = parseFlagReport('')
    expect(report.flags).toHaveLength(0)
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('warns when a parameter cannot be matched', () => {
    const odd = SAMPLE.replace('Parameter: Natural Phrasing', 'Parameter: Vibes')
    const { warnings, report } = parseFlagReport(odd)
    expect(warnings.some((w) => w.includes('Vibes'))).toBe(true)
    expect(report.flags[0].parameter).toBe('meaningDrift') // safe default
  })

  it('copes with extra spacing and mixed case labels', () => {
    const messy = SAMPLE.replace('Line: 4', '  line :  4 ').replace(
      'Status: FLAGGED\nEnglish',
      'STATUS: flagged\nENGLISH',
    )
    const { report } = parseFlagReport(messy)
    expect(report.flags[0].line).toBe(4)
    expect(report.flags[0].status).toBe('FLAGGED')
  })

  it('accepts a slash date', () => {
    const { report } = parseFlagReport(
      SAMPLE.replace('Date: 2026-03-14', 'Date: 14/03/2026'),
    )
    expect(report.date).toBe('2026-03-14')
  })

  it('treats a CLEAN header with real flags as FLAGGED', () => {
    const { report, warnings } = parseFlagReport(
      SAMPLE.replace('Status: FLAGGED\n\n--- FLAG 1', 'Status: CLEAN\n\n--- FLAG 1'),
    )
    expect(report.status).toBe('FLAGGED')
    expect(warnings.some((w) => w.includes('CLEAN'))).toBe(true)
  })

  it('parses the copy-to-clipboard template itself', () => {
    const { report } = parseFlagReport(REVIEW_TEMPLATE)
    expect(report.flags.length).toBeGreaterThan(0)
  })
})

describe('parseSummaryLine', () => {
  it('reads the counts at the bottom of the report', () => {
    const summary = parseSummaryLine(SAMPLE)
    expect(summary).toEqual({
      meaningDrift: 1,
      naturalPhrasing: 1,
      termConsistency: 0,
      voiceConviction: 0,
      unsure: 1,
    })
  })

  it('returns null when there is no summary', () => {
    expect(parseSummaryLine('FLAG REPORT\nArticle: x')).toBeNull()
  })
})
