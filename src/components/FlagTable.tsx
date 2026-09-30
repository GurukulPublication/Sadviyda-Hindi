/**
 * The editable review table shown after parsing a PDF (and used again when
 * editing a saved report). Nothing is saved until the parent page says so.
 */

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
  function update(id: string, patch: Partial<Flag>) {
    onChange(flags.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function remove(id: string) {
    onChange(flags.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-4">
      {flags.length === 0 && (
        <p className="rounded-lg bg-sand/60 p-4 text-sm text-ink/70">
          No flags yet. If this article was clean, leave it empty — it will score
          10.0. Otherwise add flags by hand below.
        </p>
      )}

      {flags.map((flag, index) => (
        <div key={flag.id} className="card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-heading text-xs uppercase tracking-wider text-ink/50">
              Flag {index + 1}
            </span>

            <label className="text-xs text-ink/60">
              Line
              <input
                type="number"
                className="input ml-2 inline-block w-20 py-1"
                value={flag.line ?? ''}
                onChange={(e) =>
                  update(flag.id, {
                    line: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
            </label>

            <label className="text-xs text-ink/60">
              Parameter
              <select
                className="input ml-2 inline-block w-48 py-1"
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
            </label>

            <label className="text-xs text-ink/60">
              Status
              <select
                className="input ml-2 inline-block w-32 py-1"
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
            </label>

            <label className="text-xs text-ink/60">
              Term
              <input
                className="input ml-2 inline-block w-40 py-1"
                placeholder="optional"
                value={flag.term ?? ''}
                onChange={(e) => update(flag.id, { term: e.target.value })}
              />
            </label>

            <button
              className="btn-danger ml-auto py-1 text-xs"
              onClick={() => remove(flag.id)}
            >
              Delete
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-ink/60">
              English
              <textarea
                className="input mt-1 h-20"
                value={flag.english}
                onChange={(e) => update(flag.id, { english: e.target.value })}
              />
            </label>
            <label className="text-xs text-ink/60">
              Hindi / Gujarati
              <textarea
                className="input deva mt-1 h-20"
                value={flag.hindi}
                onChange={(e) => update(flag.id, { hindi: e.target.value })}
              />
            </label>
          </div>

          <label className="mt-3 block text-xs text-ink/60">
            Reason
            <textarea
              className="input mt-1 h-16"
              value={flag.reason}
              onChange={(e) => update(flag.id, { reason: e.target.value })}
            />
          </label>
        </div>
      ))}

      <button
        className="btn-ghost"
        onClick={() => onChange([...flags, blankFlag()])}
      >
        + Add a flag
      </button>
    </div>
  )
}
