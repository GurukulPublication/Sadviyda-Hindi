import { describe, expect, it } from 'vitest'
import { flagsResolved, openFlags, resolvedInReport, totalFlags } from './stats'
import { scoreAll, scoreReport } from './scoring'
import type { Flag, ParameterKey, Report } from '../types'

let n = 0
function flag(
  parameter: ParameterKey,
  status: 'FLAGGED' | 'UNSURE' = 'FLAGGED',
  resolved = false,
): Flag {
  n += 1
  return {
    id: `f${n}`,
    line: 1,
    english: 'en',
    hindi: 'hi',
    parameter,
    status,
    reason: 'r',
    resolved,
  }
}

function report(flags: Flag[], date = '2026-01-01'): Report {
  return {
    title: 'Test',
    date,
    language: 'Hindi',
    status: flags.length ? 'FLAGGED' : 'CLEAN',
    flags,
    createdAt: `${date}T00:00:00.000Z`,
  }
}

describe('flagsResolved', () => {
  it('counts only the flags actually ticked off', () => {
    const reports = scoreAll([
      report([flag('meaningDrift', 'FLAGGED', true), flag('naturalPhrasing')]),
      report([flag('voiceConviction', 'FLAGGED', true)], '2026-02-01'),
    ])
    expect(flagsResolved(reports)).toBe(2)
    expect(totalFlags(reports)).toBe(3)
    expect(openFlags(reports)).toBe(1)
  })

  it('is zero when nothing has been fixed', () => {
    const reports = scoreAll([report([flag('meaningDrift')])])
    expect(flagsResolved(reports)).toBe(0)
    expect(openFlags(reports)).toBe(1)
  })

  it('ignores unsure items, which were never counted against you', () => {
    const reports = scoreAll([
      report([flag('meaningDrift', 'UNSURE', true), flag('naturalPhrasing')]),
    ])
    expect(flagsResolved(reports)).toBe(0)
    expect(openFlags(reports)).toBe(1)
  })
})

describe('resolvedInReport', () => {
  it('reports progress for a single article', () => {
    const scored = scoreReport(
      report([
        flag('meaningDrift', 'FLAGGED', true),
        flag('naturalPhrasing'),
        flag('termConsistency', 'UNSURE'),
      ]),
    )
    expect(resolvedInReport(scored)).toEqual({ resolved: 1, total: 2 })
  })
})
