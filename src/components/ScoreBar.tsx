/**
 * The score bar — the main motif of the dashboard.
 *
 * One bar per article. The filled part is the score out of 10 and its colour
 * follows the flame scale (green = radiant, amber = burning low). On the dark
 * hero panel the empty part shows as a faint track above the fill.
 */

import { scoreColor } from '../config/theme'

interface ScoreBarProps {
  /** Score out of 10. */
  score: number
  /** Height of the whole 0–10 track, in pixels. */
  height?: number
  /** Width of the bar, in pixels. */
  width?: number
  /** Dark hero panel vs. light card. */
  tone?: 'dark' | 'light'
  /** Plays the grow-from-the-bottom animation. */
  animate?: boolean
  /** Delay, so a row of bars grows one after another. */
  delay?: number
  className?: string
}

export default function ScoreBar({
  score,
  height = 90,
  width = 26,
  tone = 'dark',
  animate = true,
  delay = 0,
  className = '',
}: ScoreBarProps) {
  const fraction = Math.max(0, Math.min(1, score / 10))
  const color = scoreColor(score)

  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{
        width,
        height,
        // The unfilled remainder of the 0–10 track.
        background: tone === 'dark' ? 'rgba(255,255,255,0.10)' : '#EFE8DA',
      }}
    >
      <div
        className={`absolute bottom-0 left-0 w-full rounded-md ${
          animate ? 'animate-barGrow' : ''
        }`}
        style={{
          height: `${fraction * 100}%`,
          background: color,
          transformOrigin: 'bottom',
          animationDelay: `${delay}ms`,
        }}
      />
    </div>
  )
}
