/**
 * ARTICLES (/articles)
 * A searchable, sortable list of every scored article.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Diya from '../components/Diya'
import { useApp } from '../context/AppContext'
import { formatDate } from './ArticleDetail'

type SortKey = 'date' | 'score' | 'title'

export default function Articles() {
  const { reports, languageFilter } = useApp()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('date')
  const [descending, setDescending] = useState(true)

  const visible = useMemo(() => {
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
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'score') return a.overall - b.overall
      if (sort === 'title') return a.title.localeCompare(b.title)
      return a.date.localeCompare(b.date)
    })
    return descending ? sorted.reverse() : sorted
  }, [reports, query, sort, descending])

  return (
    <div className="relative">
      <div className="section-number" aria-hidden>
        02
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Articles
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {reports.length} article{reports.length === 1 ? '' : 's'}
            {languageFilter !== 'All' && ` · ${languageFilter} only`}
          </p>
        </div>
        <Link to="/add" className="btn-primary">
          + Add Report
        </Link>
      </div>

      {/* Search and sort */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search titles, terms or reasons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink/50">Sort by</span>
          {(['date', 'score', 'title'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={sort === key ? 'btn bg-sand' : 'btn-ghost'}
            >
              {key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
          <button
            className="btn-ghost"
            onClick={() => setDescending((v) => !v)}
            title="Reverse the order"
          >
            {descending ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <Diya score={null} size={80} />
          <p className="mt-4 font-heading text-lg">Nothing here yet</p>
          <p className="mt-1 text-sm text-ink/60">
            {reports.length === 0
              ? 'Upload your first Flag Report to light the first diya.'
              : 'No article matches that search.'}
          </p>
          {reports.length === 0 && (
            <Link to="/add" className="btn-primary mt-4">
              Add Report
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <Link
              key={r.id}
              to={`/articles/${r.id}`}
              className="card flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5"
            >
              <Diya score={r.overall} size={56} />
              <div className="min-w-0 flex-1">
                <p className="font-heading text-xs uppercase tracking-wider text-ink/50">
                  {formatDate(r.date)} · {r.language}
                </p>
                <h2 className="truncate font-heading font-semibold">{r.title}</h2>
                <p className="text-xs text-ink/60">{r.grade}</p>
              </div>
              <div className="text-right">
                <span className="font-heading text-xl font-semibold text-terracotta">
                  {r.overall.toFixed(1)}
                </span>
                <p className="text-[11px] text-ink/40">
                  {r.flags.filter((f) => f.status === 'FLAGGED').length} flags
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
