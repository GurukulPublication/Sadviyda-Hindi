/**
 * Reading text out of a PDF, entirely in the browser with pdfjs-dist.
 * Nothing is uploaded anywhere.
 */

// Vite bundles the worker for us with this "?url" import.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/**
 * pdf.js is a big library and is only needed when a PDF is actually dropped,
 * so it is loaded on demand rather than on every page load.
 */
async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  return pdfjsLib
}

/**
 * A designed Flag Report puts the English and the translation in two columns
 * side by side. Both sit on the same line of the page, so reading a line
 * straight through would glue an English sentence onto a Hindi one.
 *
 * Columns are found by evidence rather than by gap size alone: a wide gap is
 * only treated as a column break if other lines on the same page break at the
 * same horizontal position. That distinguishes a real column from the loose
 * word spacing of a justified paragraph, which lands at random positions.
 */
const COLUMN_GAP_RATIO = 0.05 // of the page width
const MIN_COLUMN_GAP = 20 // points, for unusually narrow pages
const COLUMN_X_TOLERANCE = 6 // points; column starts rarely line up exactly
const MIN_LINES_PER_COLUMN = 3 // how much evidence a column needs

/** Arrows and rules used as dividers between the two columns. */
const DIVIDER = /[⟶→➝➞⇒⇨»]/g
const DIVIDER_ONLY = /^[\s⟶→➝➞⇒⇨»|│—–-]*$/

interface Piece {
  x: number
  width: number
  text: string
}

/**
 * Pieces worth measuring: the arrow drawn between the two columns would
 * otherwise bridge the gap between them and hide the column break.
 */
function meaningful(pieces: Piece[]): Piece[] {
  return pieces
    // Drop a piece only when it is nothing but a divider glyph. Blank pieces
    // are kept: they carry the real spacing between words.
    .filter((p) => !(p.text.trim() && DIVIDER_ONLY.test(p.text)))
    .sort((a, b) => a.x - b.x)
}

/** Where a line would break into segments, given the column positions. */
function renderLine(pieces: Piece[], gap: number, columnStarts: number[]): string {
  let out = ''
  let previousEnd: number | null = null
  for (const piece of meaningful(pieces)) {
    const isColumnStart = columnStarts.some(
      (x) => Math.abs(piece.x - x) <= COLUMN_X_TOLERANCE,
    )
    if (previousEnd !== null && piece.x - previousEnd > gap && isColumnStart) {
      out += '\t'
    }
    out += piece.text
    previousEnd = piece.x + piece.width
  }

  const segments = out.split('\t').map((segment) =>
    segment
      // An arrow often sits against the start of the second column.
      .replace(DIVIDER, ' ')
      .replace(/ +/g, ' ')
      .trim(),
  )
  return (segments.length > 1 ? segments.filter((s) => s) : segments)
    .join('\t')
    .trim()
}

/**
 * Extract the text of a PDF file, keeping line breaks, and marking column
 * breaks within a line with a tab character.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await loadPdfjs()
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise

  // --- Pass 1: read every page into lines of positioned pieces -------------
  const pageRows: Piece[][][] = []
  let gap = MIN_COLUMN_GAP
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo)
    const content = await page.getTextContent()
    const pageWidth = page.getViewport({ scale: 1 }).width
    gap = Math.max(MIN_COLUMN_GAP, pageWidth * COLUMN_GAP_RATIO)

    // Group text pieces into lines by their y coordinate (transform[5]).
    const lines = new Map<number, Piece[]>()
    for (const item of content.items as any[]) {
      if (typeof item.str !== 'string') continue
      const y = Math.round(item.transform[5])
      const x = item.transform[4] as number
      // Allow a couple of points of wobble so one visual line stays one line.
      const key = [...lines.keys()].find((k) => Math.abs(k - y) <= 2) ?? y
      const bucket = lines.get(key) ?? []
      bucket.push({ x, width: item.width ?? 0, text: item.str })
      lines.set(key, bucket)
    }

    pageRows.push(
      [...lines.entries()]
        .sort((a, b) => b[0] - a[0]) // top of the page first
        .map(([, pieces]) => pieces),
    )
  }

  // --- Pass 2: which horizontal positions are really columns? --------------
  // Every wide gap is a candidate; a position only counts as a column once
  // enough separate lines across the document break at it. A justified
  // paragraph's loose word spacing lands at random positions and never does.
  const candidates = new Map<number, number>()
  for (const rows of pageRows) {
    for (const pieces of rows) {
      let previousEnd: number | null = null
      for (const piece of meaningful(pieces)) {
        if (previousEnd !== null && piece.x - previousEnd > gap) {
          const bucket =
            Math.round(piece.x / COLUMN_X_TOLERANCE) * COLUMN_X_TOLERANCE
          candidates.set(bucket, (candidates.get(bucket) ?? 0) + 1)
        }
        previousEnd = piece.x + piece.width
      }
    }
  }
  const columnStarts = [...candidates.entries()]
    .filter(([, count]) => count >= MIN_LINES_PER_COLUMN)
    .map(([x]) => x)

  // --- Pass 3: render ------------------------------------------------------
  return pageRows
    .map((rows) =>
      rows
        .map((pieces) => renderLine(pieces, gap, columnStarts))
        .filter((line, i, all) => line || (i > 0 && i < all.length - 1))
        .join('\n'),
    )
    .join('\n')
}

/** Exported for the tests: is this segment nothing but a divider? */
export function isDividerOnly(segment: string): boolean {
  return DIVIDER_ONLY.test(segment)
}
