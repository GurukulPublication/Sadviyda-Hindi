/**
 * The review format. The "Copy review template" button on the Add Report page
 * copies this text, so it can be pasted into a review request to Claude.
 *
 * The parser in parser.ts targets exactly this layout.
 */

export const REVIEW_TEMPLATE = `FLAG REPORT
Article: <title>
Date: <YYYY-MM-DD>
Language: Hindi
Status: FLAGGED   (or CLEAN)

--- FLAG 1 ---
Line: 4
Parameter: Natural Phrasing
Status: FLAGGED
Term: (optional)
English: <english line>
Hindi: <hindi line>
Reason: <one or two sentences>

--- FLAG 2 ---
Line: 11
Parameter: Meaning Drift
Status: UNSURE
Term: (optional)
English: <english line>
Hindi: <hindi line>
Reason: <one or two sentences>

SUMMARY
Meaning Drift: 1 | Natural Phrasing: 1 | Term Consistency: 0 | Voice & Conviction: 0 | Unsure: 1
`

/** The instruction sentence copied above the template. */
export const TEMPLATE_INTRO = `Please review my English article and my Hindi translation side by side, and write the result in exactly this format (one block per flag, no extra commentary), using only these four parameters: Meaning Drift, Natural Phrasing, Term Consistency, Voice & Conviction. Mark each flag FLAGGED or UNSURE.`

/** What the Copy button actually puts on the clipboard. */
export const CLIPBOARD_TEXT = `${TEMPLATE_INTRO}\n\n${REVIEW_TEMPLATE}`
