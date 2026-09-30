/** One of the four small number cards at the top of the Home page. */

import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  /** Small line under the value. */
  note?: ReactNode
  /** Positive/negative change, shown as an arrow. */
  delta?: number | null
  accent?: string
}

export default function StatCard({
  label,
  value,
  note,
  delta,
  accent = '#C4623F',
}: StatCardProps) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="font-heading text-xs uppercase tracking-wider text-ink/50">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className="font-heading text-3xl font-semibold"
          style={{ color: accent }}
        >
          {value}
        </span>
        {delta !== undefined && delta !== null && (
          <span
            className="font-heading text-sm"
            style={{ color: delta >= 0 ? '#6B6B52' : '#C4623F' }}
            title="Compared with the previous article"
          >
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
          </span>
        )}
      </div>
      {/* A div, not a p: the note sometimes contains the score popover. */}
      {note && <div className="mt-1 text-xs text-ink/60">{note}</div>}
    </div>
  )
}
