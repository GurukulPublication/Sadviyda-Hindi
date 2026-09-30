/**
 * The editable review table shown after parsing a PDF (and again when editing
 * a saved report). Nothing is saved until the parent page says so.
 *
 * Compact by default — line, parameter, status and reason on one row, as in
 * the design. Expanding a row reveals the English and Hindi lines.
 */

import { useState } from 'react'
import { PARAMETERS } from '../config/scoring'
import type { Flag, ParameterKey } from '../types'

interface Props {
  flags: Flag[]
  onChange: (flags: Flag[]) => void
}

/** A blank row, used by "Add a flag". */
export function blankFlag(): Flag {
  return {
    id: Math.random().toString(36).slice(2, 10),
    line: null,
    english: '',
    hindi: '',
    parameter: 'meaningDrift',
    status: 'FLAGGED',
    reason: '',
    term: '',
  }
}

export default function FlagTable({ flags, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  function update(id: string, patch: Partial<Flag>) {
    onChange(flags.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  return (
    <div>
      {/* Column headings */}
      <div className="hidden grid-cols-[64px_190px_140px_1fr_40px] items-center gap-3 border-b border-border px-1 pb-2 lg:grid">
        <span className="label">Line</span>
        <span className="label">Parameter</span>
        <span className="label">Status</span>
        <span className="label">Reason</span>
        <span />
      </div>

      {flags.length === 0 && (
        <p className="rounded-xl bg-sand/60 p-4 text-sm">
          No flags yet. If this article was clean, leave it empty — it will
          score 10.0. Otherwise add flags by hand below.
        </p>
      )}

      <div className="divide-y divide-border">
        {flags.map((flag) => (
          <div key={flag.id} className="py-3">
            <div className="grid items-center gap-3 lg:grid-cols-[64px_190px_140px_1fr_40px]">
              {/* Line number */}
              <label className="flex items-center gap-2">
                <span className="label lg:hidden">Line</span>
                <span className="font-heading text-sm text-olive">L</span>
                <input
                  type="number"
                  className="input w-16 px-2 py-1.5 text-sm"
                  value={flag.line ?? ''}
                  onChange={(e) =>
                    update(flag.id, {
                      line: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>

              {/* Parameter */}
              <select
                className="select py-1.5 text-sm"
                value={flag.parameter}
                onChange={(e) =>
                  update(flag.id, { parameter: e.target.value as ParameterKey })
                }
              >
                {PARAMETERS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>

              {/* Status — coloured like the badge it will become */}
              <select
                className={`select py-1.5 text-sm font-semibold ${
                  flag.status === 'FLAGGED'
                    ? 'border-brand/40 bg-brand/5 text-brand'
                    : 'border-yellow bg-yellow/15 text-[#6E5200]'
                }`}
                value={flag.status}
                onChange={(e) =>
                  update(flag.id, {
                    status: e.target.value as 'FLAGGED' | 'UNSURE',
                  })
                }
              >
                <option value="FLAGGED">FLAGGED</option>
                <option value="UNSURE">UNSURE</option>
              </select>

              {/* Reason */}
              <input
                className="input py-1.5 text-sm"
                placeholder="Why was this flagged?"
                value={flag.reason}
                onChange={(e) => update(flag.id, { reason: e.target.value })}
              />

              {/* Remove */}
              <button
                className="justify-self-start rounded-full px-2 py-1 text-olive hover:bg-sand hover:text-brand lg:justify-self-center"
                onClick={() => onChange(flags.filter((f) => f.id !== flag.id))}
                aria-label="Remove this flag"
                title="Remove this flag"
              >
                ×
              </button>
            </div>

            {/* The two lines themselves, hidden until asked for. */}
            <button
              className="mt-1 font-heading text-xs text-olive hover:text-ink"
              onClick={() =>
                setExpanded(expanded === flag.id ? null : flag.id)
              }
            >
              {expanded === flag.id ? '− hide the lines' : '+ show the lines'}
            </button>

            {expanded === flag.id && (
              <div className="mt-2 grid gap-3 rounded-xl bg-cream/70 p-3 sm:grid-cols-2">
                <label className="label">
                  English
                  <textarea
                    className="input mt-1 h-20 font-body normal-case tracking-normal"
                    value={flag.english}
                    onChange={(e) => update(flag.id, { english: e.target.value })}
                  />
                </label>
                <label className="label">
                  Hindi / Gujarati
                  <textarea
                    className="input deva mt-1 h-20 normal-case tracking-normal"
                    value={flag.hindi}
                    onChange={(e) => update(flag.id, { hindi: e.target.value })}
                  />
                </label>
                <label className="label sm:col-span-2">
                  Key term (optional)
                  <input
                    className="input mt-1 font-body normal-case tracking-normal"
                    placeholder="e.g. dehbhav"
                    value={flag.term ?? ''}
                    onChange={(e) => update(flag.id, { term: e.target.value })}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="btn-ghost mt-4"
        onClick={() => onChange([...flags, blankFlag()])}
      >
        + Add a flag
      </button>
    </div>
  )
}
