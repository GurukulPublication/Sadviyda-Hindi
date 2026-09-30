/**
 * HOME — "My Translation Journey" (/)
 *
 * The comparison page. Sections, top to bottom:
 *   hero · score bars · four stat cards · score journey · four parameters
 *   · parameter key · flags per month · milestones
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ScoreBar from '../components/ScoreBar'
import Diya from '../components/Diya'
import ScoreInfo from '../components/ScoreInfo'
import { FlagsPerMonth, ParameterRadar, ScoreJourney } from '../components/Charts'
import { useApp } from '../context/AppContext'
import { PARAMETERS } from '../config/scoring'
import { palette, scoreColor } from '../config/theme'
import { computeBadges } from '../lib/badges'
import {
  averageOverall,
  currentStreak,
  flagsResolved,
  latestDelta,
  totalFlags,
} from '../lib/stats'

export default function Home() {
  const { reports, loaded, languageFilter } = useApp()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<number | null>(null)

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-olive">
        Lighting the lamps…
      </div>
    )
  }

  // --- First visit --------------------------------------------------------
  if (reports.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <img
          src="./sadvidya-wordmark.png"
          alt="Sadvidya"
          className="mb-8 w-full max-w-md"
        />
        <div className="h-24 w-8 rounded-md bg-sand" aria-hidden />
        <h1 className="mt-6 font-heading text-2xl font-semibold">
          Upload your first Flag Report to raise the first bar
        </h1>
        <p className="mt-2 max-w-md aside">
          Each article you review becomes a bar in the row. The better the
          translation, the taller and greener it stands.
          {languageFilter !== 'All' &&
            ` (The language filter is set to ${languageFilter} — change it in settings if you expected to see something here.)`}
        </p>
        <Link to="/add" className="btn-primary mt-7">
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
  const total = totalFlags(reports)
  const open = total - resolved
  const badges = computeBadges(reports)
  const earned = badges.filter((b) => b.earned).length

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------------- hero */}
      <section className="flex flex-col items-center gap-2 pb-2 text-center">
        <img
          src="./sadvidya-wordmark.png"
          alt="Sadvidya"
          className="w-full max-w-lg"
        />
        <h1 className="mt-3 font-heading text-[clamp(26px,3.4vw,40px)] font-bold">
          My Translation Journey
        </h1>
        <p className="aside text-[17px]">
          Every article, one bar. Here is how yours are growing.
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-heading text-[40px] font-bold leading-none text-brand">
            {avg.toFixed(1)}
          </span>
          <span className="font-heading text-lg font-medium text-olive">
            / 10 average
          </span>
          <ScoreInfo />
        </div>
      </section>

      {/* ---------------------------------------------------- the score bars */}
      <section className="relative overflow-hidden rounded-card bg-night p-5 sm:p-7">
        {/* A warm glow along the bottom edge, as in the design. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background:
              'radial-gradient(60% 100% at 50% 100%, rgba(243,146,0,0.20) 0%, rgba(243,146,0,0) 70%)',
          }}
          aria-hidden
        />
        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-2">
          <span className="label text-yellow">Score bars</span>
          <span className="aside text-sm text-white/35">
            Hover a bar to see its article
          </span>
        </div>

        <div className="relative overflow-x-auto pb-1">
          <div className="flex min-w-min items-end justify-center gap-3 sm:gap-5">
            {reports.map((r, i) => {
              const showYear =
                i === 0 || r.date.slice(0, 4) !== reports[i - 1].date.slice(0, 4)
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/articles/${r.id}`)}
                  onMouseEnter={() => setHovered(r.id ?? null)}
                  onMouseLeave={() => setHovered(null)}
                  className="group relative flex flex-col items-center focus:outline-none"
                >
                  <span
                    className="mb-2 font-heading text-xs font-semibold tabular-nums"
                    style={{ color: scoreColor(r.overall) }}
                  >
                    {r.overall.toFixed(1)}
                  </span>

                  {/* Tooltip */}
                  {hovered === r.id && (
                    <div className="pointer-events-none absolute -top-16 z-10 w-44 rounded-xl border border-white/10 bg-[#141310] p-2.5 text-center shadow-lift">
                      <div className="truncate font-heading text-[11px] font-medium text-white">
                        {r.title}
                      </div>
                      <div className="font-heading text-sm font-semibold text-white">
                        {r.overall.toFixed(1)}
                        <span className="text-[11px] font-medium text-white/50">
                          /10
                        </span>
                      </div>
                    </div>
                  )}

                  <ScoreBar
                    score={r.overall}
                    height={96}
                    width={26}
                    delay={i * 60}
                    className="transition-transform group-hover:-translate-y-1"
                  />

                  <span className="mt-2 font-heading text-[11px] font-semibold text-white/80">
                    {shortMonth(r.date)}
                  </span>
                  <span className="font-heading text-[10px] text-white/35">
                    {showYear ? r.date.slice(0, 4) : ' '}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <p className="relative mt-4 text-center font-heading text-sm text-white/70">
          {reports.length} article{reports.length === 1 ? '' : 's'}{' '}
          <span className="text-white/25">·</span> average{' '}
          <span className="tabular-nums text-yellow">{avg.toFixed(1)}/10</span>
        </p>
      </section>

      {/* -------------------------------------------------------- stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Latest score */}
        <div className="card p-5">
          <span className="label">Latest score</span>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span
              className="font-heading text-[32px] font-bold leading-none tabular-nums"
              style={{ color: scoreColor(latest.overall) }}
            >
              {latest.overall.toFixed(1)}
            </span>
            {delta !== null && (
              <span
                className="font-heading text-sm font-medium"
                style={{ color: delta >= 0 ? palette.greenDark : palette.brand }}
              >
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-snug text-olive">{latest.title}</p>
        </div>

        {/* Average score */}
        <div className="card p-5">
          <span className="label">Average score</span>
          <div className="mt-1.5 font-heading text-[32px] font-bold leading-none tabular-nums">
            {avg.toFixed(1)}
          </div>
          <p className="mt-2 text-sm text-olive">
            across {reports.length} article{reports.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Streak */}
        <div className="card p-5">
          <span className="label">Streak</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-heading text-[32px] font-bold leading-none tabular-nums">
              {streak}
            </span>
            <span className="font-heading text-sm text-olive">in a row</span>
          </div>
          {/* One tally mark per article in the streak. */}
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
              <span
                key={i}
                className="h-3.5 w-2.5 rounded-sm bg-yellow"
                aria-hidden
              />
            ))}
            {streak === 0 && (
              <span className="h-3.5 w-2.5 rounded-sm bg-sand" aria-hidden />
            )}
          </div>
          <p className="mt-2 text-sm text-olive">articles scoring 8 or higher</p>
        </div>

        {/* Flags resolved */}
        <div className="card p-5">
          <span className="label">Flags resolved</span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-heading text-[32px] font-bold leading-none tabular-nums text-greenDark">
              {resolved}
            </span>
            <span className="font-heading text-sm text-olive">/ {total}</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-green transition-all"
              style={{ width: `${total ? (resolved / total) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-olive">{open} still open</p>
        </div>
      </section>

      {/* ------------------------------------------------------------ charts */}
      <ScoreJourney reports={reports} />
      <ParameterRadar reports={reports} />

      {/* ---------------------------------------------------- parameter key */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-[17px] font-semibold">Parameter key</h3>
          <span className="aside text-sm">What each score is checking</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARAMETERS.map((p) => (
            <article
              key={p.key}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-cream/60 p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full font-heading text-sm"
                  style={{ background: `${p.color}1F`, color: p.color }}
                  aria-hidden
                >
                  {p.guide.icon}
                </span>
                <span className="font-heading text-base font-semibold">
                  {p.guide.short}
                </span>
              </div>

              <p className="font-heading text-sm font-semibold leading-snug">
                “{p.guide.question}”
              </p>
              <p className="text-[15px] leading-relaxed text-[#4A4738]">
                {p.guide.checks}
              </p>

              {/* A worked example: the English, the weak Hindi, and why. */}
              <div className="space-y-1.5 rounded-xl border border-border bg-card p-3">
                <p className="text-sm leading-snug">
                  <span className="label mr-1.5 text-[10px]">EN</span>
                  “{p.guide.example.en}”
                </p>
                <p className="deva text-sm leading-snug">
                  <span className="mr-1.5 font-heading text-brand">✗</span>
                  “{p.guide.example.hi}”
                </p>
                <p className="aside text-[13px] leading-snug">
                  {p.guide.example.why}
                </p>
              </div>

              <p className="mt-auto text-sm leading-relaxed">
                <span className="font-heading font-semibold text-brand">Tip · </span>
                {p.tip}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- flags per month */}
      <FlagsPerMonth reports={reports} />

      {/* --------------------------------------------------------- milestones */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-[17px] font-semibold">Milestones</h3>
          <span className="font-heading text-[13px] text-olive">
            {earned} of {badges.length} earned
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {badges.map((b) => (
            <div
              key={b.id}
              className="flex flex-col items-center gap-2 text-center"
              title={b.earned ? 'Earned' : b.hint}
            >
              <Diya size={56} lit={b.earned} />
              <span
                className={`font-heading text-[13px] font-semibold leading-tight ${
                  b.earned ? '' : 'text-olive/70'
                }`}
              >
                {b.label}
              </span>
              <span className="text-[11px] leading-tight text-olive/70">
                {b.hint}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/** "Sep", used under each score bar. */
function shortMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short' })
}
