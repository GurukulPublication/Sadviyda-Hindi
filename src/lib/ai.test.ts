import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  buildChatSystem,
  buildFixPrompt,
  describeApiError,
  maskKey,
  parseFixReply,
} from './ai'
import { scoreReport } from './scoring'
import type { Flag, Report } from '../types'

// localStorage does not exist in the test environment; the module must not
// fall over when it is missing.
beforeEach(() => {
  vi.unstubAllGlobals()
})

const flag: Flag = {
  id: 'a1',
  line: 4,
  ref: 'F1',
  english: 'Do not wait for a better time to serve.',
  hindi: 'सेवा के लिए शायद अच्छे समय का इंतज़ार न करें।',
  parameter: 'voiceConviction',
  status: 'FLAGGED',
  reason: '"शायद" (perhaps) was added.',
}

function report(flags: Flag[]): Report {
  return {
    id: 1,
    title: 'How to Transform Your Life',
    date: '2026-10-01',
    language: 'Hindi',
    status: 'FLAGGED',
    flags,
    createdAt: '2026-10-01T00:00:00.000Z',
  }
}

describe('maskKey', () => {
  it('shows enough to recognise a key but not to use it', () => {
    const masked = maskKey('sk-proj-abcdefghijklmnop1234')
    expect(masked).toContain('sk-proj')
    expect(masked).toContain('1234')
    expect(masked).not.toContain('abcdefghijklmnop')
  })

  it('hides a short string completely, and handles an empty one', () => {
    expect(maskKey('short')).toBe('•••••')
    expect(maskKey('')).toBe('')
  })
})

describe('describeApiError', () => {
  it('explains the errors that actually happen, in plain words', () => {
    expect(describeApiError(401)).toMatch(/rejected the key/i)
    expect(describeApiError(429)).toMatch(/too many requests|credit/i)
    expect(describeApiError(404)).toMatch(/model/i)
    expect(describeApiError(503)).toMatch(/their end/i)
  })

  it('falls back to the status for anything unexpected', () => {
    expect(describeApiError(418, 'teapot')).toContain('418')
    expect(describeApiError(418, 'teapot')).toContain('teapot')
  })
})

describe('buildFixPrompt', () => {
  it('gives the model the four parameters and the flagged line', () => {
    const [system, user] = buildFixPrompt(flag, 'Hindi', 'My Article')
    expect(system.role).toBe('system')
    expect(system.content).toContain('Meaning Drift')
    expect(system.content).toContain('Voice & Conviction')
    expect(user.content).toContain('My Article')
    expect(user.content).toContain(flag.english)
    expect(user.content).toContain(flag.hindi)
    expect(user.content).toContain(flag.reason)
    expect(user.content).toContain('SUGGESTION:')
  })

  it('says so when a line was not recorded, rather than sending "undefined"', () => {
    const [, user] = buildFixPrompt(
      { ...flag, english: '', hindi: '' },
      'Hindi',
      'T',
    )
    expect(user.content).not.toMatch(/undefined/)
    expect(user.content).toContain('(not recorded)')
  })
})

describe('parseFixReply', () => {
  it('splits the suggestion from the explanation', () => {
    const { suggestion, why } = parseFixReply(
      'SUGGESTION: सेवा के लिए अच्छे समय का इंतज़ार न करें।\nWHY: The softener "शायद" is gone.',
    )
    expect(suggestion).toBe('सेवा के लिए अच्छे समय का इंतज़ार न करें।')
    expect(why).toBe('The softener "शायद" is gone.')
  })

  it('copes with a multi-line explanation', () => {
    const { why } = parseFixReply('SUGGESTION: क\nWHY: one\ntwo')
    expect(why).toBe('one\ntwo')
  })

  it('shows whatever came back if the model ignored the format', () => {
    const { suggestion, why } = parseFixReply('I would rewrite it as क।')
    expect(suggestion).toBe('I would rewrite it as क।')
    expect(why).toBe('')
  })
})

describe('buildChatSystem', () => {
  it('summarises the articles it can see', () => {
    const scored = [scoreReport(report([flag]))]
    const system = buildChatSystem(scored)
    expect(system.content).toContain('1 article(s) scored')
    expect(system.content).toContain('How to Transform Your Life')
  })

  it('says plainly when there is nothing scored yet', () => {
    expect(buildChatSystem([]).content).toContain('No articles scored yet')
  })

  it('lists the flags of the article being looked at', () => {
    const scored = scoreReport(report([flag]))
    const system = buildChatSystem([scored], scored)
    expect(system.content).toContain('[F1]')
    expect(system.content).toContain('Voice & Conviction')
    expect(system.content).toContain(flag.english)
  })

  it('tells the model not to invent what it was not given', () => {
    expect(buildChatSystem([]).content).toMatch(/rather than inventing/i)
  })
})
