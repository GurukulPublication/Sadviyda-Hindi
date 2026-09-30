/**
 * HOME — "Progress Garden" (/)
 *
 * The comparison page: a row of diyas (one per article), four stat cards,
 * three charts, the common-mistakes panel and the milestone badges.
 */

import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Diya from '../components/Diya'
import StatCard from '../components/StatCard'
import ScoreInfo from '../components/ScoreInfo'
import { FlagsByParameter, ParameterRadar, ScoreJourney } from '../components/Charts'
import { useApp } from '../context/AppContext'
import { computeBadges } from '../lib/badges'
import {
  averageOverall,
  currentStreak,
  flagsResolved,
  latestDelta,
  reflagCount,
  repeatOffenders,
  weakestParameters,
} from '../lib/stats'
import { formatDate } from './ArticleDetail'

export default function Home() {
  const { reports, loaded, languageFilter } = useApp()
  const navigate = useNavigate()

  // --- Still reading from storage ----------------------------------------
  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink/50">
        Lighting the lamps…
      </div>
    )
  }

  // --- First visit --------------------------------------------------------
  if (reports.length === 0) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <Diya score={null} size={120} />
        <h1 className="mt-6 font-heading text-2xl font-semibold">
          Upload your first Flag Report to light the first diya
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink/60">
          Each article you review becomes a lamp in this row. The better the
          translation, the taller and steadier its flame.
          {languageFilter !== 'All' &&
            ` (The language filter is set to ${languageFilter} — change it in settings if you expected to see something here.)`}
        </p>
        <Link to="/add" className="btn-primary mt-6">
          + Add Report
        </Link>
      </div>
    )
  }

  const latest = reports[reports.length - 1]
  const avg = averageOverall(reports)
  const delta = latestDelta(reports)
  const streak = currentStreak(reports)
  const resolved = flagsResolved(reports)
  const weakest = weakestParameters(reports)
  const offenders = repeatOffenders(reports)
  const reflags = reflagCount(reports)
  const badges = computeBadges(reports)

  return (
    <div className="space-y-10">
      {/* a) The diya row */}
      <section className="relative">
        <div className="section-number" aria-hidden>
          01
        </div>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Progress Garden
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          One diya per article, oldest on the left. Hover to see the score, click
          to open the report.
        </p>

        <div className="card mt-5 overflow-x-auto p-6">
          <div className="flex min-w-min items-end gap-5 sm:gap-8">
            {reports.map((r, i) => (
              <motion.button
                key={r.id}
                onClick={() => navigate(`/articles/${r.id}`)}
                className="group flex flex-col items-center focus:outline-none"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.6) }}
                title={`${r.title} · ${formatDate(r.date)} · ${r.overall.toFixed(1)}/10`}
              >
                <Diya score={r.overall} size={78} interactive />
                <span className="mt-2 max-w-[92px] truncate text-[11px] text-ink/60 group-hover:text-ink">
                  {r.title}
                </span>
                <span className="font-heading text-xs font-semibold text-terracotta">
                  {r.overall.toFixed(1)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-center font-heading text-sm text-olive">
          {reports.length} diya{reports.length === 1 ? '' : 's'} lit · average
          flame {avg.toFixed(1)}/10
        </p>
      </section>

      {/* b) Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Latest score"
          value={latest.overall.toFixed(1)}
          delta={delta}
          note={
            <span className="inline-flex items-center gap-1">
              {latest.grade}
              <ScoreInfo />
            </span>
          }
        />
        <StatCard
          label="Average score"
          value={avg.toFixed(1)}
          note={`Across ${reports.length} article${reports.length === 1 ? '' : 's'}`}
          accent="#6B6B52"
        />
        <StatCard
          label="Streak above 8"
          value={streak}
          note={
            streak === 0
              ? 'Your last article was below 8.0'
              : `${streak} article${streak === 1 ? '' : 's'} in a row at 8.0 or better`
          }
          accent="#C98B6B"
        />
        <StatCard
          label="Flags resolved"
          value={resolved}
          note="Flags from earlier articles now behind you"
          accent="#8C9A72"
        />
      </section>

      {/* c) Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ScoreJourney reports={reports} />
        <ParameterRadar reports={reports} />
        <FlagsByParameter reports={reports} />
      </section>

      {/* d) Common mistakes */}
      <section className="relative">
        <div className="section-number" aria-hidden>
          02
        </div>
        <h2 className="font-heading text-xl font-semibold">Your common mistakes</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-heading font-semibold">Where the flags come from</h3>
            {weakest.length === 0 ? (
              <p className="mt-2 text-sm text-ink/70">
                No flags at all so far. Remarkable — keep going.
              </p>
            ) : (
              <ol className="mt-3 space-y-3">
                {weakest.map((w, i) => (
                  <li key={w.key} className="flex gap-3 text-sm">
                    <span className="font-heading text-lg text-ink/25">{i + 1}</span>
                    <span className="text-ink/75">{w.sentence}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-heading font-semibold">Repeat offenders</h3>
            <p className="text-xs text-ink/60">
              Flagged in two or more different articles.
            </p>
            {offenders.length === 0 ? (
              <p className="mt-3 text-sm text-ink/70">
                Nothing repeats across articles yet. Good sign.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {offenders.slice(0, 6).map((o) => (
                  <li key={o.label} className="flex items-baseline justify-between gap-3">
                    <span className="deva truncate text-ink/80">{o.label}</span>
                    <span className="whitespace-nowrap text-xs text-terracotta">
                      {o.articles} articles
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 rounded-lg bg-sand/60 p-3 text-sm">
              <b className="font-heading">Re-flags in your latest report:</b>{' '}
              {reflags}
              <p className="mt-1 text-xs text-ink/60">
                {reflags === 0
                  ? 'Nothing from the past came back this time.'
                  : `${reflags} flag${reflags === 1 ? '' : 's'} repeated an issue you had already been told about.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* e) Milestone badges */}
      <section>
        <h2 className="font-heading text-xl font-semibold">Milestones</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`card flex items-center gap-3 p-4 ${
                b.earned ? '' : 'opacity-50 grayscale'
              }`}
              title={b.earned ? 'Earned' : b.hint}
            >
              <span className="text-2xl" aria-hidden>
                {b.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold">
                  {b.label}
                </p>
                <p className="text-[11px] text-ink/60">
                  {b.earned ? 'Earned' : b.hint}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
