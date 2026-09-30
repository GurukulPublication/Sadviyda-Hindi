/**
 * The diya (oil lamp). Its flame reflects a score out of 10:
 *   high score -> tall, bright, steady flame
 *   low score  -> small, dim, quickly flickering flame
 *   no score   -> unlit lamp (used in the empty state)
 */

import { motion } from 'framer-motion'

interface DiyaProps {
  /** Overall score 0–10, or null for an unlit lamp. */
  score: number | null
  /** Overall pixel size of the lamp. */
  size?: number
  /** Adds a gentle lift on hover when true. */
  interactive?: boolean
  /** Plays the "just lit" animation. */
  justLit?: boolean
  title?: string
}

export default function Diya({
  score,
  size = 72,
  interactive = false,
  justLit = false,
  title,
}: DiyaProps) {
  const lit = score !== null
  // 0 (weak) .. 1 (perfect). Real scores cluster between 5 and 10, so the
  // range is stretched over that band — otherwise every flame looks the same.
  const t = lit ? Math.max(0, Math.min(1, (score - 5) / 5)) : 0

  const flameHeight = 12 + t * 30 // small and stubby at 5/10, tall at 10/10
  const flameWidth = 9 + t * 8
  const glow = 0.15 + t * 0.55
  // A steady flame flickers slowly; a weak one jitters.
  const flickerSeconds = lit ? 2.6 - t * 1.4 : 0

  return (
    <motion.div
      className="relative flex flex-col items-center justify-end"
      style={{ width: size, height: size * 1.15 }}
      title={title}
      initial={justLit ? { opacity: 0, y: 8 } : false}
      animate={justLit ? { opacity: 1, y: 0 } : undefined}
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      {/* Glow behind the flame */}
      {lit && (
        <div
          className="absolute rounded-full blur-md"
          style={{
            width: flameWidth * 3,
            height: flameWidth * 3,
            bottom: size * 0.42,
            background: `radial-gradient(circle, rgba(255,186,94,${glow}) 0%, rgba(255,186,94,0) 70%)`,
          }}
          aria-hidden
        />
      )}

      {/* Flame */}
      {lit && (
        <div
          className="relative"
          style={{
            width: flameWidth,
            height: flameHeight,
            marginBottom: size * 0.34,
            animation: `flicker ${flickerSeconds}s ease-in-out infinite`,
            transformOrigin: 'bottom center',
          }}
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, #F0A23B 0%, #FFC861 45%, #FFF2CC 100%)',
              borderRadius: '50% 50% 45% 45% / 65% 65% 35% 35%',
              clipPath: 'ellipse(50% 50% at 50% 55%)',
              opacity: 0.55 + t * 0.45,
            }}
          />
          {/* Bright core */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: '10%',
              width: flameWidth * 0.4,
              height: flameHeight * 0.45,
              background: '#FFF6DE',
              borderRadius: '50%',
              opacity: 0.4 + t * 0.6,
            }}
          />
        </div>
      )}

      {/* Wick */}
      <div
        className="absolute"
        style={{
          width: 2,
          height: size * 0.1,
          bottom: size * 0.3,
          background: lit ? '#5A4634' : '#9A8F80',
        }}
        aria-hidden
      />

      {/* Lamp bowl */}
      <svg
        viewBox="0 0 100 46"
        width={size}
        height={size * 0.46}
        className="relative"
        aria-hidden
      >
        <defs>
          <linearGradient id="clay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lit ? '#D2795A' : '#C8BEB0'} />
            <stop offset="100%" stopColor={lit ? '#A8492C' : '#A79C8D'} />
          </linearGradient>
        </defs>
        {/* Bowl */}
        <path d="M6 6 Q50 0 94 6 Q86 40 50 44 Q14 40 6 6 Z" fill="url(#clay)" />
        {/* Oil surface */}
        <ellipse cx="50" cy="8" rx="43" ry="6" fill={lit ? '#E8A96B' : '#D9D0C2'} />
        {/* Base shadow */}
        <ellipse cx="50" cy="45" rx="26" ry="3" fill="rgba(34,32,28,0.12)" />
      </svg>
    </motion.div>
  )
}
