/**
 * The Home page charts, styled to the Sadvidya design:
 *  - Score journey: a blue line with a soft area fill and a dotted 8.0 target
 *  - Four parameters: a radar with the all-time average filled and the
 *    latest article dashed on top
 *  - Flags per month: stacked bars, one column per calendar month
 */

import type { ReactNode } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
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
import { chart, palette } from '../config/theme'
import { averageByParameter, byMonth } from '../lib/stats'
import type { ScoredReport } from '../types'

const AXIS = { fontSize: 11, fill: chart.axisText }

/** Shared tooltip styling, so all three charts match. */
const TOOLTIP = {
  background: chart.tooltipBackground,
  border: `1px solid ${chart.tooltipBorder}`,
  borderRadius: chart.tooltipRadius,
  fontSize: 12,
  fontFamily: 'Poppins, sans-serif',
}

/** A section card with a heading on the left and a legend on the right. */
function Panel({
  title,
  legend,
  children,
  className = '',
}: {
  title: string
  legend?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-[17px] font-semibold">{title}</h3>
        {legend}
      </div>
      {children}
    </section>
  )
}

/** Small legend entry: a swatch (or a line) plus a label. */
function LegendItem({
  color,
  label,
  dashed,
  dotted,
}: {
  color: string
  label: string
  dashed?: boolean
  dotted?: boolean
}) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap font-heading text-xs text-olive">
      {dashed || dotted ? (
        <span
          className="inline-block w-4"
          style={{ borderTop: `2px ${dotted ? 'dotted' : 'dashed'} ${color}` }}
        />
      ) : (
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ background: color }}
        />
      )}
      {label}
    </span>
  )
}

/** a) Overall score over time, with the dotted target line. */
export function ScoreJourney({ reports }: { reports: ScoredReport[] }) {
  const data = reports.map((r) => ({
    name: monthLabel(r.date),
    title: r.title,
    score: r.overall,
  }))

  return (
    <Panel
      title="Score journey"
      legend={
        <LegendItem
          color={chart.target}
          label={`target ${TARGET_SCORE.toFixed(1)}`}
          dotted
        />
      }
    >
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: -20 }}>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis
              domain={[5, 10]}
              ticks={[5, 6, 7, 8, 9, 10]}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP}
              formatter={(v: number) => [`${Number(v).toFixed(1)}/10`, 'Score']}
              labelFormatter={(_label, p) => p?.[0]?.payload?.title ?? ''}
            />
            <ReferenceLine y={TARGET_SCORE} stroke={chart.target} strokeDasharray="2 4" />
            <Area
              type="linear"
              dataKey="score"
              stroke="none"
              fill={chart.area}
              baseValue={5}
            />
            <Line
              type="linear"
              dataKey="score"
              stroke={chart.line}
              strokeWidth={2}
              dot={{ r: 4, fill: palette.card, stroke: chart.line, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: palette.brand, stroke: palette.brand }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

/** b) Radar of the four parameters: all-time average vs the latest article. */
export function ParameterRadar({ reports }: { reports: ScoredReport[] }) {
  const average = averageByParameter(reports)
  const latest = reports[reports.length - 1]

  const data = PARAMETERS.map((p) => ({
    parameter: p.guide.short,
    average: average[p.key],
    latest: latest ? latest.scores[p.key] : 0,
  }))

  return (
    <Panel
      title="Four parameters"
      legend={
        <span className="flex flex-wrap gap-3">
          <LegendItem color={chart.radarAverage} label="average" />
          <LegendItem color={chart.radarLatest} label="latest" dashed />
        </span>
      }
    >
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="68%">
            <PolarGrid stroke={chart.grid} />
            <PolarAngleAxis
              dataKey="parameter"
              tick={{ ...AXIS, fontFamily: 'Poppins, sans-serif' }}
            />
            <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
            <Radar
              name="average"
              dataKey="average"
              stroke={chart.radarAverage}
              fill={chart.radarAverage}
              fillOpacity={0.18}
            />
            <Radar
              name="latest"
              dataKey="latest"
              stroke={chart.radarLatest}
              strokeDasharray="4 3"
              fill="none"
            />
            <Tooltip
              contentStyle={TOOLTIP}
              formatter={(v: number) => `${Number(v).toFixed(1)}/10`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

/** c) Stacked bars of flags per calendar month. */
export function FlagsPerMonth({ reports }: { reports: ScoredReport[] }) {
  const months = byMonth(reports)
  const data = months.map((m) => {
    const row: Record<string, string | number> = { name: m.month, total: m.total }
    for (const p of PARAMETERS) row[p.label] = m.flags[p.key]
    return row
  })

  return (
    <Panel
      title="Flags per month"
      legend={
        <span className="flex flex-wrap gap-3">
          {PARAMETERS.map((p) => (
            <LegendItem key={p.key} color={p.color} label={p.label} />
          ))}
        </span>
      }
    >
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: -24 }}>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP} cursor={{ fill: 'rgba(34,32,28,0.04)' }} />
            {PARAMETERS.map((p, i) => (
              <Bar
                key={p.key}
                dataKey={p.label}
                stackId="flags"
                fill={p.color}
                radius={i === PARAMETERS.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 aside text-sm">{trendSentence(months)}</p>
    </Panel>
  )
}

/** "Jan", used as an axis label. */
function monthLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short' })
}

/** One honest sentence about whether the flags are falling. */
function trendSentence(months: { total: number }[]): string {
  if (months.length < 3) return 'A few more months and the trend will show here.'
  const half = Math.floor(months.length / 2)
  const avg = (xs: { total: number }[]) =>
    xs.reduce((s, m) => s + m.total, 0) / (xs.length || 1)
  const before = avg(months.slice(0, half))
  const after = avg(months.slice(half))
  if (after < before * 0.8) return 'Fewer flags each month lately. The bars keep climbing.'
  if (after > before * 1.2) return 'More flags than earlier months — worth a slower read.'
  return 'Flags are holding steady month to month.'
}
