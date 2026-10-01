/**
 * The card a chart sits in, with an Expand button.
 *
 * The charts are small when four of them share a page, which is fine for a
 * glance but not for reading exact values. Expand opens the same chart in a
 * large overlay, where it is given room and can show more detail.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ChartPanelProps {
  title: string
  /** Shown on the right of the heading. */
  legend?: ReactNode
  /**
   * The chart. It is given `expanded`, so it can grow and show more detail
   * in the overlay than it does on the page.
   */
  children: (expanded: boolean) => ReactNode
  /** Extra detail shown only in the overlay, e.g. the figures as a table. */
  detail?: ReactNode
  /** Set false for a panel that gains nothing from being bigger. */
  expandable?: boolean
  className?: string
  /** Whether the overlay is open, and how to change that. */
  expanded: boolean
  onExpandedChange: (open: boolean) => void
}

export default function ChartPanel({
  title,
  legend,
  children,
  detail,
  expandable = true,
  className = '',
  expanded,
  onExpandedChange,
}: ChartPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape closes the overlay, and the page behind it must not scroll.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExpandedChange(false)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [expanded, onExpandedChange])

  return (
    <>
      <section className={`card p-5 sm:p-6 ${className}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-[17px] font-semibold">{title}</h3>
          <span className="flex flex-wrap items-center gap-3">
            {legend}
            {expandable && (
              <button
                onClick={() => onExpandedChange(true)}
                className="rounded-full border border-border px-2.5 py-1 font-heading text-xs text-olive transition-colors hover:bg-sand hover:text-ink"
                aria-label={`Expand ${title}`}
                title="Open this chart larger"
              >
                ⤢ Expand
              </button>
            )}
          </span>
        </div>
        {children(false)}
      </section>

      {/*
        The overlay is rendered straight into <body>. Inside the page it would
        sit among cards whose layout can shift it, and a modal has to cover the
        whole window or the page stays clickable behind it.
      */}
      {expanded &&
        createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-3 sm:p-6"
          onClick={() => onExpandedChange(false)}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="card flex max-h-full w-full max-w-5xl flex-col overflow-y-auto p-5 sm:p-7"
            // A click inside the card must not close it.
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading text-xl font-semibold">{title}</h3>
              <span className="flex flex-wrap items-center gap-3">
                {legend}
                <button
                  ref={closeRef}
                  onClick={() => onExpandedChange(false)}
                  className="btn-ghost px-4 py-1.5 text-xs"
                >
                  Close
                </button>
              </span>
            </div>

            {children(true)}
            {detail}
          </div>
        </div>,
          document.body,
        )}
    </>
  )
}
