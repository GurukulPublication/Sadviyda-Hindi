/**
 * The three charts on the Home page, all built on Recharts and using the
 * warm palette from the design language.
 */

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PARAMETERS, TARGET_SCORE } from '../config/scoring'
import { averageByParameter } from '../lib/stats'
import type { ScoredReport } from '../types'

const AXIS = { fontSize: 11, fill: '#6B6B52' }
const GRID = '#E4DCCB'

/** Shorten a long title so the axis stays readable. */
function shortTitle(title: string, max = 16): string {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title
}

/** a) Overall score over time, with the dotted target line. */
export function ScoreJourney({ reports }: { reports: ScoredReport[] }) {
  const data = reports.map((r) => ({
    name: shortTitle(r.title),
    date: r.date,
    score: r.overall,
  }))

  return (
    <div className="card p-5">
      <h3 className="font-heading font-semibold">Score journey</h3>
      <p className="mb-3 text-xs text-ink/60">
        Every article in order. The dotted line is your target of{' '}
        {TARGET_SCORE.toFixed(1)}.
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -18 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={AXIS} interval="preserveStartEnd" />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={AXIS} />
            <Tooltip
              contentStyle={{
                background: '#FDFBF6',
                border: '1px solid rgba(34,32,28,0.12)',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v.toFixed(1)}/10`, 'Score']}
            />
            <ReferenceLine
              y={TARGET_SCORE}
              stroke="#6B6B52"
              strokeDasharray="6 4"
              label={{
                value: 'target',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#6B6B52',
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#C4623F"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#C4623F' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** b) Radar of the four parameters, all time vs the last three articles. */
export function ParameterRadar({ reports }: { reports: ScoredReport[] }) {
  const [showRecent, setShowRecent] = useState(true)
  const allTime = averageByParameter(reports)
  const recent = averageByParameter(reports.slice(-3))

  const data = PARAMETERS.map((p) => ({
    parameter: p.label,
    'All time': allTime[p.key],
    'Last 3': recent[p.key],
  }))

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold">Parameter radar</h3>
          <p className="mb-2 text-xs text-ink/60">
            Your average score per parameter. Bigger shape is better.
          </p>
        </div>
        <button
          className="btn-ghost py-1 text-xs"
          onClick={() => setShowRecent((v) => !v)}
        >
          {showRecent ? 'Hide last 3' : 'Overlay last 3'}
        </button>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke={GRID} />
            <PolarAngleAxis dataKey="parameter" tick={{ ...AXIS, fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 10]} tick={{ ...AXIS, fontSize: 9 }} />
            <Radar
              name="All time"
              dataKey="All time"
              stroke="#6B6B52"
              fill="#6B6B52"
              fillOpacity={0.25}
            />
            {showRecent && (
              <Radar
                name="Last 3"
                dataKey="Last 3"
                stroke="#C4623F"
                fill="#C4623F"
                fillOpacity={0.25}
              />
            )}
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#FDFBF6',
                border: '1px solid rgba(34,32,28,0.12)',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** c) Stacked bar of flags per article, split by parameter. */
export function FlagsByParameter({ reports }: { reports: ScoredReport[] }) {
  const data = reports.map((r) => {
    const row: Record<string, string | number> = { name: shortTitle(r.title) }
    for (const p of PARAMETERS) row[p.label] = r.flagCounts[p.key]
    return row
  })

  return (
    <div className="card p-5 lg:col-span-2">
      <h3 className="font-heading font-semibold">Flags by parameter</h3>
      <p className="mb-3 text-xs text-ink/60">
        How many flagged items each article picked up, and of which kind. Shorter
        bars are better.
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -18 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={AXIS} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={AXIS} />
            <Tooltip
              contentStyle={{
                background: '#FDFBF6',
                border: '1px solid rgba(34,32,28,0.12)',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {PARAMETERS.map((p) => (
              <Bar
                key={p.key}
                dataKey={p.label}
                stackId="flags"
                fill={p.color}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
