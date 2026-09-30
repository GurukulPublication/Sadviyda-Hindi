/**
 * Generates a sample Flag Report PDF from the template, so the PDF upload flow
 * can be tested without waiting for a real review.
 *
 *   npm run make-sample-pdf
 *
 * It writes samples/sample-flag-report.pdf. Drop that file on the Add Report
 * page to see the whole parse -> review -> save flow.
 *
 * Note: the built-in PDF fonts cannot draw Devanagari, so the Hindi lines in
 * this sample are transliterated. Real reports exported from a word processor
 * embed their own fonts and read fine.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { PDFDocument, StandardFonts } from 'pdf-lib'

const REPORT = `FLAG REPORT
Article: The Lamp That Does Not Flicker
Date: 2026-03-14
Language: Hindi
Status: FLAGGED

--- FLAG 1 ---
Line: 4
Parameter: Natural Phrasing
Status: FLAGGED
English: He walked towards the temple with a heart full of longing.
Hindi: vah mandir ki or chala ek hriday ke saath jo laalasa se bhara tha.
Reason: The Hindi copies the English clause order. A natural Hindi line would
place the longing before the walking.

--- FLAG 2 ---
Line: 11
Parameter: meaning-drift
Status: FLAGGED
Term: dehbhav
English: He had not yet let go of body-consciousness.
Hindi: usne abhi tak sharir ka moh nahin chhoda tha.
Reason: "dehbhav" is a narrower idea than "moh". The Hindi softens it.

--- FLAG 3 ---
Line: 19
Parameter: Voice & Conviction
Status: UNSURE
English: This is the only way.
Hindi: yahi ekmatra marg hai.
Reason: Possibly fine, but the English is more emphatic. Your call.

--- FLAG 4 ---
Line: 26
Parameter: Term consistency
Status: FLAGGED
Term: Vachanamrut
English: as the Vachanamrut says
Hindi: jaisa Vachanamrutam mein kaha gaya hai
Reason: Spelt one way here and another way earlier in the same article.

SUMMARY
Meaning Drift: 1 | Natural Phrasing: 1 | Term Consistency: 1 | Voice & Conviction: 0 | Unsure: 1
`

const pdf = await PDFDocument.create()
const font = await pdf.embedFont(StandardFonts.Helvetica)
const fontSize = 11
const lineHeight = 15
const margin = 54
const pageHeight = 792
const pageWidth = 612

let page = pdf.addPage([pageWidth, pageHeight])
let y = pageHeight - margin

for (const line of REPORT.split('\n')) {
  if (y < margin) {
    page = pdf.addPage([pageWidth, pageHeight])
    y = pageHeight - margin
  }
  page.drawText(line, { x: margin, y, size: fontSize, font })
  y -= lineHeight
}

await mkdir('samples', { recursive: true })
await writeFile('samples/sample-flag-report.pdf', await pdf.save())
console.log('Wrote samples/sample-flag-report.pdf')
