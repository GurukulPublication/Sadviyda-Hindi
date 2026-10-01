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
  Cell,
  ComposedChart,
  LabelList,
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
import { averageByParameter, byMonth, totalFlagsByParameter } from '../lib/stats'
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

/**
 * c) Where the flags are.
 *
 * With reports from two or more months this is a stacked bar per month, which
 * shows the trend. With only one month there is no trend to show and a single
 * stacked bar stretched across the panel says nothing, so it becomes a plain
 * breakdown by parameter instead — the same numbers, in a form that reads.
 */
export function FlagsPerMonth({ reports }: { reports: ScoredReport[] }) {
  const months = byMonth(reports)
  const totals = totalFlagsByParameter(reports)
  const grandTotal = PARAMETERS.reduce((sum, p) => sum + totals[p.key], 0)

  // --- Not enough months for a trend: show the breakdown ------------------
  if (months.length < 2) {
    const data = PARAMETERS.map((p) => ({
      label: p.label,
      short: p.guide.short,
      flags: totals[p.key],
      color: p.color,
    }))

    return (
      <Panel
        title="Where your flags are"
        legend={
          <span className="font-heading text-xs text-olive">
            {grandTotal} flag{grandTotal === 1 ? '' : 's'} in all
          </span>
        }
      >
        {grandTotal === 0 ? (
          <p className="py-10 text-center aside">
            No flags yet — nothing to break down.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 36, bottom: 4, left: 8 }}
              >
                <CartesianGrid stroke={chart.grid} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={AXIS}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="short"
                  width={72}
                  tick={{ ...AXIS, fontFamily: 'Poppins, sans-serif' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP}
                  cursor={{ fill: 'rgba(34,32,28,0.04)' }}
                  formatter={(v: number) => [`${v}`, 'Flags']}
                  labelFormatter={(_l, p) => p?.[0]?.payload?.label ?? ''}
                />
                <Bar dataKey="flags" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {data.map((d) => (
                    <Cell key={d.label} fill={d.color} />
                  ))}
                  {/* The count sits at the end of each bar, so the figure is
                      readable without relying on the colour. */}
                  <LabelList
                    dataKey="flags"
                    position="right"
                    style={{
                      fill: chart.axisText,
                      fontSize: 12,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-3 aside text-sm">
          Once you have reports from a few different months, this becomes a
          month-by-month trend.
        </p>
      </Panel>
    )
  }

  // --- Two or more months: the trend --------------------------------------
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
          <BarChart data={data} margin={{ top: 18, right: 16, bottom: 4, left: -24 }}>
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
                maxBarSize={56}
                // A hairline of the card colour separates the segments.
                stroke={palette.card}
                strokeWidth={1.5}
                radius={i === PARAMETERS.length - 1 ? [4, 4, 0, 0] : undefined}
              >
                {i === PARAMETERS.length - 1 && (
                  <LabelList
                    dataKey="total"
                    position="top"
                    style={{
                      fill: chart.axisText,
                      fontSize: 11,
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Bar>
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
