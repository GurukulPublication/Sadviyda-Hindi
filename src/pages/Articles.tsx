/**
 * ARTICLES (/articles)
 *
 * Every article, grouped under a month heading, with search, a newest/oldest
 * toggle and the language filter.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ScoreBar from '../components/ScoreBar'
import { useApp, type LanguageFilter } from '../context/AppContext'
import { scoreColor } from '../config/theme'
import { byMonth, monthHeading } from '../lib/stats'
import { formatMonth } from './ArticleDetail'

const LANGUAGES: LanguageFilter[] = ['All', 'Hindi', 'Gujarati']

export default function Articles() {
  const { reports, languageFilter, setLanguageFilter, loaded } = useApp()
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)

  const months = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? reports.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.flags.some(
              (f) =>
                f.term?.toLowerCase().includes(q) ||
                f.reason.toLowerCase().includes(q),
            ),
        )
      : reports
    const grouped = byMonth(filtered)
    return newestFirst ? [...grouped].reverse() : grouped
  }, [reports, query, newestFirst])

  const count = months.reduce((sum, m) => sum + m.reports.length, 0)

  return (
    <div className="space-y-6">
      <Link to="/" className="btn-ghost">
        ← Back to Home
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[clamp(26px,3vw,34px)] font-bold">
            Articles
          </h1>
          <p className="mt-0.5 text-sm text-olive">
            {count} translation{count === 1 ? '' : 's'} reviewed
            {languageFilter !== 'All' && ` · ${languageFilter} only`}
          </p>
        </div>

        {/* Newest / oldest toggle */}
        <div className="flex rounded-full border border-border bg-sand/60 p-1">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setNewestFirst(v)}
              className={`rounded-full px-4 py-1.5 font-heading text-[13px] transition-colors ${
                newestFirst === v ? 'bg-card text-ink shadow-soft' : 'text-olive'
              }`}
            >
              {v ? 'Newest first' : 'Oldest first'}
            </button>
          ))}
        </div>
      </div>

      {/* Search + language filter */}
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          className="input min-w-0 flex-1"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => setLanguageFilter(l)}
            className={`btn px-4 py-2 ${
              languageFilter === l
                ? 'bg-ink text-white'
                : 'border border-border bg-card text-ink hover:bg-sand'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {count === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-heading text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 aside">
            {!loaded
              ? 'Reading your reports…'
              : reports.length === 0
                ? 'Upload your first Flag Report to raise the first bar.'
                : 'No article matches that search.'}
          </p>
          {loaded && reports.length === 0 && (
            <Link to="/add" className="btn-primary mt-5">
              + Add Report
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {months.map((m) => (
            <section key={m.key}>
              <div className="mb-3 flex items-baseline gap-3 border-b border-border pb-2">
                <h2 className="font-heading text-[17px] font-semibold">
                  {monthHeading(m)}
                </h2>
                <span className="text-sm text-olive">
                  {m.reports.length} article{m.reports.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {m.reports.map((r) => (
                  <Link
                    key={r.id}
                    to={`/articles/${r.id}`}
                    className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-lift"
                  >
                    <ScoreBar
                      score={r.overall}
                      tone="light"
                      height={54}
                      width={16}
                      animate={false}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-sm font-semibold leading-snug">
                        {r.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-olive">
                          {formatMonth(r.date)}
                        </span>
                        <span
                          className={`chip ${
                            r.language === 'Hindi'
                              ? 'bg-tintBlue text-blue'
                              : 'bg-tintPeach text-[#9A5700]'
                          }`}
                        >
                          {r.language}
                        </span>
                      </p>
                    </div>
                    <span
                      className="font-heading text-xl font-bold tabular-nums"
                      style={{ color: scoreColor(r.overall) }}
                    >
                      {r.overall.toFixed(1)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
