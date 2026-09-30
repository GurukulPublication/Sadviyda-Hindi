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
 * Extract the text of a PDF file, keeping line breaks.
 *
 * pdf.js gives us positioned text pieces rather than lines, so we group the
 * pieces by their vertical position and join each group into one line.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await loadPdfjs()
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise

  const pages: string[] = []
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo)
    const content = await page.getTextContent()

    // Group text pieces into lines by their y coordinate (transform[5]).
    const lines = new Map<number, { x: number; text: string }[]>()
    for (const item of content.items as any[]) {
      if (typeof item.str !== 'string') continue
      const y = Math.round(item.transform[5])
      const x = item.transform[4] as number
      // Allow a couple of points of wobble so one visual line stays one line.
      const key = [...lines.keys()].find((k) => Math.abs(k - y) <= 2) ?? y
      const bucket = lines.get(key) ?? []
      bucket.push({ x, text: item.str })
      lines.set(key, bucket)
    }

    const ordered = [...lines.entries()]
      .sort((a, b) => b[0] - a[0]) // top of the page first
      .map(([, pieces]) =>
        pieces
          .sort((a, b) => a.x - b.x)
          .map((p) => p.text)
          .join('')
          .replace(/\s+/g, ' ')
          .trim(),
      )

    pages.push(ordered.join('\n'))
  }

  return pages.join('\n')
}
