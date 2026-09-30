/**
 * Prepares the built app (dist/) for publishing as a Claude artifact.
 *
 *   npm run build && npm run make-artifact
 *
 * It does two things:
 *
 * 1. Writes dist/artifact-page.html — the same app, but as a fragment. The
 *    artifact platform wraps the published page in its own <!doctype>, <head>
 *    and <body>, so the page must not carry its own.
 *
 * 2. Escapes the single raw ESC byte in the bundled pdf.js worker. The byte
 *    sits inside a string literal, so writing it as \x1b is identical to the
 *    browser but keeps the file publishable as text.
 *
 * It then prints the file map to hand to the Artifact tool, since Vite's
 * filenames carry a content hash that changes on every build.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist/index.html', 'utf8')

const css = html.match(/href="\.\/(assets\/[^"]+\.css)"/)?.[1]
const js = html.match(/src="\.\/(assets\/[^"]+\.js)"/)?.[1]
const fonts = html.match(/<link\s+href="https:\/\/fonts\.googleapis\.com[\s\S]*?\/>/)?.[0]

if (!css || !js || !fonts) {
  throw new Error('Could not read dist/index.html — did `npm run build` succeed?')
}

// --- 1. The page fragment -------------------------------------------------
writeFileSync(
  'dist/artifact-page.html',
  `<title>Sadvidya Translation Scorecard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<link rel="stylesheet" href="${css}">
<style>
  /* The app is a single, deliberately light design: warm cream, Gurukul red. */
  :root { color-scheme: light; }
  html, body { background: #F7F3EA; margin: 0; }
</style>

<div id="root"></div>
<script type="module" src="${js}"></script>
`,
)

// --- 2. Make the pdf.js worker text-safe ----------------------------------
// latin1 is byte-preserving, so this round-trips the file without touching
// anything but the ESC bytes.
const pdfFiles = readdirSync('dist/assets').filter((f) => f.startsWith('pdf'))
for (const file of pdfFiles) {
  const path = `dist/assets/${file}`
  const original = readFileSync(path).toString('latin1')
  if (!original.includes('\x1b')) continue
  const fixed = original.replaceAll('\x1b', '\\x1b')
  writeFileSync(path, Buffer.from(fixed, 'latin1'))
  console.log(`Escaped ESC byte(s) in ${file}`)
}

// --- 3. The file map to publish -------------------------------------------
const files = {
  [css]: `dist/${css}`,
  [js]: `dist/${js}`,
  ...Object.fromEntries(
    pdfFiles.map((f) => [
      `assets/${f}`,
      { from: `dist/assets/${f}`, contentType: 'text/javascript' },
    ]),
  ),
  'gurukul-emblem.png': 'dist/gurukul-emblem.png',
  'sadvidya-wordmark.png': 'dist/sadvidya-wordmark.png',
  'favicon.svg': 'dist/favicon.svg',
}

console.log('\nPublish dist/artifact-page.html with these files:\n')
console.log(JSON.stringify(files, null, 2))
