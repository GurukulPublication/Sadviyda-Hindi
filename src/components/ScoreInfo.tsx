/**
 * The little "How is this calculated?" question mark shown next to any score.
 * Clicking it opens a small popover explaining the deductions and weights,
 * read straight from src/config/scoring.ts.
 */

import { useEffect, useRef, useState } from 'react'
import { GRADES, PARAMETERS, TARGET_SCORE } from '../config/scoring'

export default function ScoreInfo({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="How is this calculated?"
        className="h-5 w-5 rounded-full border border-border text-[11px] font-heading
                   text-olive transition-colors hover:bg-sand hover:text-ink"
      >
        ?
      </button>

      {open && (
        <div
          role="dialog"
          className="card absolute right-0 z-30 mt-2 w-72 p-4 text-left text-xs leading-relaxed"
        >
          <p className="font-heading text-sm font-semibold mb-2">
            How is this calculated?
          </p>
          <p className="mb-2">
            Each of the four parameters starts at 10. Every <b>FLAGGED</b> item
            takes points off. <b>UNSURE</b> items are tracked but never cost you
            anything.
          </p>
          <table className="w-full mb-2">
            <thead>
              <tr className="text-olive">
                <th className="text-left font-heading font-medium">Parameter</th>
                <th className="text-right font-heading font-medium">Per flag</th>
                <th className="text-right font-heading font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {PARAMETERS.map((p) => (
                <tr key={p.key}>
                  <td className="py-0.5">{p.label}</td>
                  <td className="py-0.5 text-right">−{p.deduction.toFixed(1)}</td>
                  <td className="py-0.5 text-right">
                    {Math.round(p.weight * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mb-2">
            The overall score is the weighted average of the four, rounded to one
            decimal. A clean report scores 10.0. The target line on the chart is{' '}
            {TARGET_SCORE.toFixed(1)}.
          </p>
          <p className="text-olive">
            {GRADES.map((g) => `${g.min}+ ${g.label}`).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
