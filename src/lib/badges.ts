/**
 * Milestone badges. Each badge knows how to check itself against the list of
 * scored reports, so adding a new one is a single entry in this array.
 */

import type { ScoredReport } from '../types'
import { currentStreak } from './stats'

export interface Badge {
  id: string
  label: string
  /** Shown when the badge is still locked. */
  hint: string
  earned: boolean
  icon: string
}

export function computeBadges(reports: ScoredReport[]): Badge[] {
  const count = reports.length
  const clean = reports.filter((r) => r.status === 'CLEAN' || r.flags.length === 0)
  const streak8 = currentStreak(reports, 8)
  const noDrift = count > 0 && reports.every((r) => r.flagCounts.meaningDrift === 0)
  const best = count ? Math.max(...reports.map((r) => r.overall)) : 0
  const lastThree = reports.slice(-3)
  const improving =
    lastThree.length === 3 &&
    lastThree[0].overall < lastThree[1].overall &&
    lastThree[1].overall < lastThree[2].overall

  return [
    {
      id: 'first-report',
      label: 'First Report',
      hint: 'Upload your first Flag Report.',
      earned: count >= 1,
      icon: '🪔',
    },
    {
      id: 'first-clean',
      label: 'First Clean Report',
      hint: 'Get a report with no flags at all.',
      earned: clean.length >= 1,
      icon: '✨',
    },
    {
      id: 'five-articles',
      label: '5 Articles Done',
      hint: 'Score five articles.',
      earned: count >= 5,
      icon: '📚',
    },
    {
      id: 'ten-articles',
      label: '10 Articles Done',
      hint: 'Score ten articles.',
      earned: count >= 10,
      icon: '🏵️',
    },
    {
      id: 'three-above-8',
      label: '3 in a Row Above 8',
      hint: 'Score 8 or higher three articles running.',
      earned: streak8 >= 3,
      icon: '🔥',
    },
    {
      id: 'zero-drift',
      label: 'Zero Meaning Drift',
      hint: 'Finish every article so far with no Meaning Drift flags.',
      earned: noDrift,
      icon: '🎯',
    },
    {
      id: 'nine-plus',
      label: 'Written in Hindi',
      hint: 'Reach an overall score of 9 or more on one article.',
      earned: best >= 9,
      icon: '🌸',
    },
    {
      id: 'improving',
      label: 'Three Steps Up',
      hint: 'Improve your score three articles in a row.',
      earned: improving,
      icon: '📈',
    },
  ]
}
