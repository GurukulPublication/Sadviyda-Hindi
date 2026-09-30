import type { Config } from 'tailwindcss'
// The colours and fonts live in one place. Edit src/config/theme.ts, not this file.
import { fonts, palette } from './src/config/theme'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ...palette },
      fontFamily: {
        heading: [...fonts.heading],
        body: [...fonts.body],
        deva: [...fonts.deva],
      },
      borderRadius: {
        /** The standard card radius used throughout the design. */
        card: '18px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(34, 32, 28, 0.05)',
        lift: '0 6px 20px rgba(34, 32, 28, 0.10)',
      },
      keyframes: {
        barGrow: {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        barGrow: 'barGrow .7s cubic-bezier(.2,.8,.2,1) both',
        riseIn: 'riseIn .5s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
