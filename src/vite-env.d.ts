/// <reference types="vite/client" />

// Lets TypeScript understand Vite's "?url" imports (used for the pdf.js worker).
declare module '*?url' {
  const src: string
  export default src
}
