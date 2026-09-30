import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration.
// `base: './'` makes the built site work from any folder or static host.
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as any)
