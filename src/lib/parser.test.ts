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

/**
 * A designed report, as pdf.ts hands it over: the flag boxes carry a status,
 * a parameter, a reference and a section, and the English and the Hindi sit
 * in two columns separated by a tab.
 */
const STYLED = [
  'H I N D I T R A N S L A T I O N · R E V I E W R E P O R T',
  '“How to Transform',
  'Your Life, Easily?”',
  'English original checked line-by-line against the Hindi translation.',
  '24 checkpoints reviewed across the article.',
  '',
  'O P E N I N G',
  'FLAGGED — TONE LOSS F1 · Opening',
  'E NGLISH\tH INDI',
  'WHAT IF BONDING IS THE TRAP?\tजिन दोस्तों के साथ आप रहते हो,',
  "What if the friends closest to you\tवह हर समय आपकी भक्ति में विघ्न",
  'THE GAP The punchy hook line is dropped completely. The line that should',
  'grab the reader is gone.',
  'WHY IT MATTERS Same as ditching the headline of a news story.',
  '',
  'FLAGGED — OMISSION (minor) F5 · Story: Aditya',
  'E NGLISH\tH INDI',
  'He stopped going to the mandir.\tवह मंदिर जाना बंद कर दिया।',
  'THE GAP A whole clause is missing.',
  '',
  'FLAGGED — STIFF PHRASING F9 · Classroom',
  'E NGLISH\tH INDI',
  'It was then that he understood.\tयह तब था कि उसने समझा।',
  'THE GAP A direct calque of the English.',
  '',
  'Unsure — Your Call',
  'UNSURE U1 · Throughout',
  'T HE CALL',
  'Every section heading diverges from the English one.',
  'O PTIONS',
  'This could be a deliberate house style. Your call.',
  '',
  'Clean — Worth Calling Out',
  'CLEAN C1 · Classroom',
  'The puzzle reads clearer in Hindi than in the English here.',
  'CLEAN C2 · How to Transform',
  'A livelier, more physical image than a literal rendering.',
].join('\n')

describe('parseFlagReport (designed report)', () => {
  it('reads the title from the quoted heading, across its line break', () => {
    const { report } = parseFlagReport(STYLED)
    expect(report.title).toBe('How to Transform Your Life, Easily?')
  })

  it('finds the flagged and unsure boxes', () => {
    const { report } = parseFlagReport(STYLED)
    expect(report.flags).toHaveLength(4)
    expect(report.flags.filter((f) => f.status === 'FLAGGED')).toHaveLength(3)
    expect(report.flags.filter((f) => f.status === 'UNSURE')).toHaveLength(1)
  })

  it('leaves the clean highlights out, and says so', () => {
    const { report, warnings } = parseFlagReport(STYLED)
    expect(report.flags.some((f) => f.ref?.startsWith('C'))).toBe(false)
    expect(warnings.some((w) => /clean.*highlight/i.test(w))).toBe(true)
  })

  it('maps the review wording onto the four parameters', () => {
    const { report } = parseFlagReport(STYLED)
    const byRef = Object.fromEntries(report.flags.map((f) => [f.ref, f.parameter]))
    expect(byRef.F1).toBe('voiceConviction') // TONE LOSS
    expect(byRef.F5).toBe('meaningDrift') // OMISSION (minor)
    expect(byRef.F9).toBe('naturalPhrasing') // STIFF PHRASING
  })

  it('keeps the reference and the section', () => {
    const { report } = parseFlagReport(STYLED)
    const f5 = report.flags.find((f) => f.ref === 'F5')!
    expect(f5.ref).toBe('F5')
    expect(f5.section).toBe('Story: Aditya')
  })

  it('splits the two columns into English and Hindi', () => {
    const { report } = parseFlagReport(STYLED)
    const f1 = report.flags.find((f) => f.ref === 'F1')!
    expect(f1.english).toContain('WHAT IF BONDING IS THE TRAP?')
    expect(f1.english).toContain('What if the friends closest to you')
    expect(f1.english).not.toMatch(/[ऀ-ॿ]/)
    expect(f1.hindi).toContain('जिन दोस्तों')
    expect(f1.hindi).toContain('विघ्न')
  })

  it('does not treat the ENGLISH / HINDI headings as content', () => {
    const { report } = parseFlagReport(STYLED)
    for (const flag of report.flags) {
      expect(flag.english).not.toMatch(/NGLISH/)
      expect(flag.hindi).not.toMatch(/INDI/)
    }
  })

  it('joins the reason out of THE GAP and WHY IT MATTERS', () => {
    const { report } = parseFlagReport(STYLED)
    const f1 = report.flags.find((f) => f.ref === 'F1')!
    expect(f1.reason).toContain('punchy hook line is dropped completely')
    // The paragraph runs over two lines and must not be cut short.
    expect(f1.reason).toContain('grab the reader is gone')
    expect(f1.reason).toContain('ditching the headline')
  })

  it('uses the call and the options as the reason for an unsure item', () => {
    const { report } = parseFlagReport(STYLED)
    const u1 = report.flags.find((f) => f.ref === 'U1')!
    expect(u1.reason).toContain('Every section heading diverges')
    expect(u1.reason).toContain('deliberate house style')
  })

  it('warns that the report carries no date', () => {
    const { warnings } = parseFlagReport(STYLED)
    expect(warnings.some((w) => /date/i.test(w))).toBe(true)
  })

  it('still parses the plain template, which has no flag boxes', () => {
    const { report } = parseFlagReport(SAMPLE)
    expect(report.flags).toHaveLength(3)
    expect(report.flags[0].ref).toBeUndefined()
  })
})
