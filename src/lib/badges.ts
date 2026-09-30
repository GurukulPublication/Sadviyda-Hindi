/**
 * Milestone badges, as shown in the design. Each badge knows how to check
 * itself against the list of scored reports, so adding a new one is a single
 * entry in this array.
 */

import type { ScoredReport } from '../types'
import { currentStreak } from './stats'

export interface Badge {
  id: string
  label: string
  /** Shown under the badge — what it is, or how to unlock it. */
  hint: string
  earned: boolean
}

export function computeBadges(reports: ScoredReport[]): Badge[] {
  const count = reports.length
  const clean = reports.filter((r) => r.flags.every((f) => f.status !== 'FLAGGED'))
  const streak8 = currentStreak(reports, 8)
  const best = count ? Math.max(...reports.map((r) => r.overall)) : 0

  return [
    {
      id: 'first-report',
      label: 'First Report',
      hint: 'Your first report',
      earned: count >= 1,
    },
    {
      id: 'five-reports',
      label: 'Five Reports',
      hint: '5 articles reviewed',
      earned: count >= 5,
    },
    {
      id: 'steady-climb',
      label: 'Steady Climb',
      hint: '3 in a row at 8+',
      earned: streak8 >= 3,
    },
    {
      id: 'golden-score',
      label: 'Golden Score',
      hint: 'First score of 9+',
      earned: best >= 9,
    },
    {
      id: 'full-row',
      label: 'Full Row',
      hint: '12 articles reviewed',
      earned: count >= 12,
    },
    {
      id: 'clean-report',
      label: 'Clean Report',
      hint: 'An article with no flags',
      earned: clean.length >= 1,
    },
    {
      id: 'perfect-ten',
      label: 'Perfect Ten',
      hint: 'A score of 10',
      earned: best >= 10,
    },
    {
      id: 'unbroken',
      label: 'Unbroken',
      hint: '10 in a row at 8+',
      earned: streak8 >= 10,
    },
  ]
}
