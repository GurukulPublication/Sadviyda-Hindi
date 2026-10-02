import { describe, expect, it } from 'vitest'
import {
  flagsResolved,
  openFlags,
  resolvedInReport,
  sortFlagsForReading,
  totalFlags,
} from './stats'
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

describe('sortFlagsForReading', () => {
  function withRef(ref: string | undefined, line: number | null = null): Flag {
    n += 1
    return {
      id: `f${n}`,
      line,
      english: 'en',
      hindi: 'hi',
      parameter: 'meaningDrift',
      status: 'FLAGGED',
      reason: 'r',
      ref,
    }
  }

  it('reads F1, F2, F3 … in order, whatever order they arrived in', () => {
    const sorted = sortFlagsForReading([
      withRef('F3'),
      withRef('F1'),
      withRef('F2'),
    ])
    expect(sorted.map((f) => f.ref)).toEqual(['F1', 'F2', 'F3'])
  })

  it('puts F10 after F9, not after F1', () => {
    const sorted = sortFlagsForReading([
      withRef('F10'),
      withRef('F2'),
      withRef('F9'),
      withRef('F1'),
      withRef('F18'),
    ])
    expect(sorted.map((f) => f.ref)).toEqual(['F1', 'F2', 'F9', 'F10', 'F18'])
  })

  it('keeps the unsure items after the flagged ones', () => {
    const sorted = sortFlagsForReading([
      withRef('U1'),
      withRef('F2'),
      withRef('F1'),
    ])
    expect(sorted.map((f) => f.ref)).toEqual(['F1', 'F2', 'U1'])
  })

  it('falls back to the line number when there is no reference', () => {
    const sorted = sortFlagsForReading([
      withRef(undefined, 21),
      withRef(undefined, 4),
      withRef(undefined, 11),
    ])
    expect(sorted.map((f) => f.line)).toEqual([4, 11, 21])
  })

  it('leaves flags with neither reference nor line in their original order', () => {
    const a = withRef(undefined, null)
    const b = withRef(undefined, null)
    expect(sortFlagsForReading([a, b]).map((f) => f.id)).toEqual([a.id, b.id])
  })

  it('does not drop or duplicate anything', () => {
    const input = [withRef('F2'), withRef(undefined, 7), withRef('U1'), withRef('F1')]
    const sorted = sortFlagsForReading(input)
    expect(sorted).toHaveLength(input.length)
    expect(new Set(sorted.map((f) => f.id)).size).toBe(input.length)
  })
})
