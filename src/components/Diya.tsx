/**
 * The little diya (oil lamp) inside a milestone badge.
 * Earned badges show a lit lamp on a warm gold disc; locked ones are grey.
 */

import { palette } from '../config/theme'

interface DiyaProps {
  /** Diameter of the round badge, in pixels. */
  size?: number
  /** A lit lamp (earned) or a grey one (locked). */
  lit?: boolean
  className?: string
}

export default function Diya({ size = 56, lit = true, className = '' }: DiyaProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: lit ? '#FFF3B8' : '#ECE7DC',
        border: `1px solid ${lit ? '#F3B000' : '#DCD5C6'}`,
      }}
    >
      <svg viewBox="0 0 40 40" width={size * 0.62} height={size * 0.62} aria-hidden>
        <defs>
          <linearGradient id="diyaFlame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={palette.orange} />
            <stop offset="55%" stopColor={palette.yellow} />
            <stop offset="100%" stopColor="#FFF6DE" />
          </linearGradient>
        </defs>

        {/* Flame */}
        <path
          d="M20 6c3.6 4.6 5.8 7.4 5.8 10.6a5.8 5.8 0 1 1-11.6 0C14.2 13.4 16.4 10.6 20 6Z"
          fill={lit ? 'url(#diyaFlame)' : '#C7C0B2'}
          style={
            lit
              ? {
                  animation: 'flicker 2.6s ease-in-out infinite',
                  transformOrigin: '20px 26px',
                }
              : undefined
          }
        />
        {/* Wick */}
        <rect
          x="19.2"
          y="24"
          width="1.6"
          height="4"
          fill={lit ? '#9A5700' : '#B3AB9C'}
        />
        {/* Lamp bowl */}
        <path
          d="M6 28h28c-1.8 4.6-7.2 7.4-14 7.4S7.8 32.6 6 28Z"
          fill={lit ? palette.brand : '#BDB6A7'}
        />
        {/* Oil surface */}
        <ellipse
          cx="20"
          cy="28"
          rx="14"
          ry="2.2"
          fill={lit ? '#FFD84A' : '#D2CBBC'}
        />
      </svg>
    </div>
  )
}
