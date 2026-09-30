import { describe, expect, it } from 'vitest'
import {
  countFlags,
  gradeFor,
  matchParameter,
  matchStatus,
  overallScore,
  parameterScore,
  scoreReport,
} from './scoring'
import type { Flag, ParameterKey, Report } from '../types'

/** Small helper so the tests stay readable. */
function flag(
  parameter: ParameterKey,
  status: 'FLAGGED' | 'UNSURE' = 'FLAGGED',
): Flag {
  return {
    id: Math.random().toString(36).slice(2),
    line: 1,
    english: 'en',
    hindi: 'hi',
    parameter,
    status,
    reason: 'r',
  }
}

function report(flags: Flag[]): Report {
  return {
    title: 'Test',
    date: '2026-01-01',
    language: 'Hindi',
    status: flags.length ? 'FLAGGED' : 'CLEAN',
    flags,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('parameterScore', () => {
  it('starts every parameter at 10', () => {
    expect(parameterScore('meaningDrift', 0)).toBe(10)
    expect(parameterScore('naturalPhrasing', 0)).toBe(10)
  })

  it('applies the configured deduction per flag', () => {
    expect(parameterScore('meaningDrift', 1)).toBe(8) // -2.0
    expect(parameterScore('voiceConviction', 2)).toBe(7) // -1.5 x 2
    expect(parameterScore('naturalPhrasing', 3)).toBe(7) // -1.0 x 3
    expect(parameterScore('termConsistency', 4)).toBe(6) // -1.0 x 4
  })

  it('never goes below zero', () => {
    expect(parameterScore('meaningDrift', 99)).toBe(0)
  })
})

describe('overallScore', () => {
  it('is 10 when everything is perfect', () => {
    expect(
      overallScore({
        meaningDrift: 10,
        naturalPhrasing: 10,
        termConsistency: 10,
        voiceConviction: 10,
      }),
    ).toBe(10)
  })

  it('uses the configured weights', () => {
    // 8 x 0.35 + 10 x 0.25 + 10 x 0.15 + 10 x 0.25 = 9.3
    expect(
      overallScore({
        meaningDrift: 8,
        naturalPhrasing: 10,
        termConsistency: 10,
        voiceConviction: 10,
      }),
    ).toBe(9.3)
  })

  it('rounds to one decimal place', () => {
    const s = overallScore({
      meaningDrift: 6,
      naturalPhrasing: 9,
      termConsistency: 9,
      voiceConviction: 8.5,
    })
    // 2.1 + 2.25 + 1.35 + 2.125 = 7.825 -> 7.8
    expect(s).toBe(7.8)
  })
})

describe('scoreReport', () => {
  it('gives a clean report 10.0 everywhere', () => {
    const scored = scoreReport(report([]))
    expect(scored.overall).toBe(10)
    expect(scored.scores.meaningDrift).toBe(10)
    expect(scored.grade).toBe('Written in Hindi')
  })

  it('ignores UNSURE items when scoring but still counts them', () => {
    const scored = scoreReport(
      report([flag('meaningDrift', 'UNSURE'), flag('meaningDrift', 'UNSURE')]),
    )
    expect(scored.overall).toBe(10)
    expect(scored.unsureCounts.meaningDrift).toBe(2)
    expect(scored.flagCounts.meaningDrift).toBe(0)
  })

  it('scores a mixed report the way the table says', () => {
    // 1 meaning drift, 2 natural phrasing, 1 voice, 1 unsure
    const scored = scoreReport(
      report([
        flag('meaningDrift'),
        flag('naturalPhrasing'),
        flag('naturalPhrasing'),
        flag('voiceConviction'),
        flag('termConsistency', 'UNSURE'),
      ]),
    )
    expect(scored.scores.meaningDrift).toBe(8) // 10 - 2
    expect(scored.scores.naturalPhrasing).toBe(8) // 10 - 2x1
    expect(scored.scores.voiceConviction).toBe(8.5) // 10 - 1.5
    expect(scored.scores.termConsistency).toBe(10) // unsure only
    // 8x.35 + 8.5x.25 + 8x.25 + 10x.15 = 2.8 + 2.125 + 2 + 1.5 = 8.425 -> 8.4
    expect(scored.overall).toBe(8.4)
    expect(scored.grade).toBe('Almost there')
  })
})

describe('countFlags', () => {
  it('counts per parameter', () => {
    const counts = countFlags([
      flag('meaningDrift'),
      flag('meaningDrift'),
      flag('termConsistency', 'UNSURE'),
    ])
    expect(counts.meaningDrift).toBe(2)
    expect(counts.termConsistency).toBe(0)
  })
})

describe('gradeFor', () => {
  it('uses the configured bands', () => {
    expect(gradeFor(10)).toBe('Written in Hindi')
    expect(gradeFor(9)).toBe('Written in Hindi')
    expect(gradeFor(8.9)).toBe('Almost there')
    expect(gradeFor(7.5)).toBe('Almost there')
    expect(gradeFor(7.4)).toBe('Needs polish')
    expect(gradeFor(6)).toBe('Needs polish')
    expect(gradeFor(5.9)).toBe('Reads like a translation')
    expect(gradeFor(0)).toBe('Reads like a translation')
  })
})

describe('matchParameter', () => {
  it('matches the exact names', () => {
    expect(matchParameter('Meaning Drift')).toBe('meaningDrift')
    expect(matchParameter('Natural Phrasing')).toBe('naturalPhrasing')
    expect(matchParameter('Term Consistency')).toBe('termConsistency')
    expect(matchParameter('Voice & Conviction')).toBe('voiceConviction')
  })

  it('ignores case, spacing and punctuation', () => {
    expect(matchParameter('meaning-drift')).toBe('meaningDrift')
    expect(matchParameter('  Term consistency ')).toBe('termConsistency')
    expect(matchParameter('VOICE AND CONVICTION')).toBe('voiceConviction')
    expect(matchParameter('naturalphrasing')).toBe('naturalPhrasing')
  })

  it('matches short forms', () => {
    expect(matchParameter('drift')).toBe('meaningDrift')
    expect(matchParameter('tone')).toBe('voiceConviction')
    expect(matchParameter('phrasing')).toBe('naturalPhrasing')
  })

  it('returns null for nonsense', () => {
    expect(matchParameter('')).toBeNull()
    expect(matchParameter('zzzz')).toBeNull()
  })
})

describe('matchStatus', () => {
  it('reads unsure leniently and defaults to flagged', () => {
    expect(matchStatus('UNSURE')).toBe('UNSURE')
    expect(matchStatus('unsure - your call')).toBe('UNSURE')
    expect(matchStatus('FLAGGED')).toBe('FLAGGED')
    expect(matchStatus('')).toBe('FLAGGED')
  })
})
