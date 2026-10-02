/**
 * Talking to OpenAI, straight from the browser.
 *
 * THE KEY NEVER LEAVES THIS MACHINE except to OpenAI itself. It is typed into
 * the settings drawer, kept in this browser's localStorage, and is not in the
 * source code, the build, or the repository — this site is public, so a key
 * committed here would be readable by anyone.
 *
 * Even so, a key held in a browser is only as private as the browser. Use a
 * key with a spend limit set on it, not your main one.
 */

import { PARAMETERS, PARAM_BY_KEY } from '../config/scoring'
import type { Flag, ScoredReport } from '../types'

const KEY_STORAGE = 'sadvidya.openai.key'
const MODEL_STORAGE = 'sadvidya.openai.model'

/** A cheap, widely available model. Change it in Settings if you prefer. */
export const DEFAULT_MODEL = 'gpt-4o-mini'

const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

// --- The key -------------------------------------------------------------
// Every read and write is wrapped: localStorage throws in a private window.

export function getKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function setKey(key: string): void {
  try {
    const trimmed = key.trim()
    if (trimmed) localStorage.setItem(KEY_STORAGE, trimmed)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* nothing we can do; the UI reports it as "not saved" */
  }
}

export function hasKey(): boolean {
  return getKey().length > 0
}

export function getModel(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL
  } catch {
    return DEFAULT_MODEL
  }
}

export function setModel(model: string): void {
  try {
    const trimmed = model.trim()
    if (trimmed) localStorage.setItem(MODEL_STORAGE, trimmed)
    else localStorage.removeItem(MODEL_STORAGE)
  } catch {
    /* ignore */
  }
}

/** Show a key as sk-…last four, so it can be recognised but not read off a screen. */
export function maskKey(key: string): string {
  if (!key) return ''
  if (key.length <= 10) return '•'.repeat(key.length)
  return `${key.slice(0, 7)}…${key.slice(-4)}`
}

// --- The call ------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Turn an HTTP status into something worth reading. */
export function describeApiError(status: number, body?: string): string {
  switch (status) {
    case 401:
      return 'OpenAI rejected the key. Check it in Settings — it may have been revoked or mistyped.'
    case 403:
      return 'That key is not allowed to use this model. Try another model in Settings.'
    case 404:
      return 'OpenAI does not know that model name. Check the model in Settings.'
    case 429:
      return 'Too many requests, or your OpenAI account is out of credit. Wait a moment, or check your billing.'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'OpenAI had a problem at their end. Try again in a moment.'
    default:
      return `OpenAI returned an error (${status}).${body ? ` ${body.slice(0, 200)}` : ''}`
  }
}

/**
 * Send a conversation and return the reply.
 * Throws an Error whose message is safe to show on screen.
 */
export async function chat(
  messages: ChatMessage[],
  options: { signal?: AbortSignal; temperature?: number } = {},
): Promise<string> {
  const key = getKey()
  if (!key) {
    throw new Error(
      'No OpenAI key saved yet. Add one in Settings to use the AI features.',
    )
  }

  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: getModel(),
        messages,
        temperature: options.temperature ?? 0.3,
      }),
      signal: options.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new Error(
      'Could not reach OpenAI. Check your internet connection and try again.',
    )
  }

  if (!response.ok) {
    let detail = ''
    try {
      const data = await response.json()
      detail = data?.error?.message ?? ''
    } catch {
      /* body was not JSON */
    }
    throw new Error(describeApiError(response.status, detail))
  }

  const data = await response.json()
  const reply = data?.choices?.[0]?.message?.content
  if (typeof reply !== 'string' || !reply.trim()) {
    throw new Error('OpenAI replied with nothing. Try again.')
  }
  return reply.trim()
}

// --- What we ask it ------------------------------------------------------

/** The four parameters, written out so the model judges by the same rules. */
function parameterBriefing(): string {
  return PARAMETERS.map(
    (p) => `- ${p.label}: ${p.meaning} It asks: "${p.guide.question}"`,
  ).join('\n')
}

const HOUSE_STYLE = `You are helping a writer at Sadvidya Magazine (Shree Swaminarayan Gurukul, Rajkot). He writes articles in English and translates them into Hindi himself.

His translations are reviewed against exactly four parameters:
${parameterBriefing()}

How to help:
- He is the translator. Suggest, never lecture, and never rewrite the whole piece.
- Keep spiritual and Sanskrit-rooted terms (Akshardham, Vachanamrut, dehbhav, satsang) in the form he already uses.
- Hindi must read as Hindi, not as English in Devanagari.
- Be brief and concrete. No preamble, no apologies, no restating the question.`

/** Ask for a corrected Hindi line for one flag. */
export function buildFixPrompt(
  flag: Flag,
  language: string,
  articleTitle: string,
): ChatMessage[] {
  const parameter = PARAM_BY_KEY[flag.parameter]
  return [
    { role: 'system', content: HOUSE_STYLE },
    {
      role: 'user',
      content: `Article: "${articleTitle}"
This line was flagged for ${parameter.label} — ${parameter.meaning}

English: ${flag.english || '(not recorded)'}
${language}: ${flag.hindi || '(not recorded)'}
Reviewer's note: ${flag.reason || '(none)'}

Reply in exactly this shape, nothing else:

SUGGESTION: <one corrected ${language} line>
WHY: <one or two sentences on what changed and why it is closer to the English>`,
    },
  ]
}

/** Split the model's reply back into its two parts. */
export function parseFixReply(reply: string): {
  suggestion: string
  why: string
} {
  const suggestion = reply.match(/SUGGESTION:\s*([\s\S]*?)(?=\n\s*WHY:|$)/i)
  const why = reply.match(/WHY:\s*([\s\S]*)$/i)
  return {
    // If the model ignored the shape, show whatever it said rather than nothing.
    suggestion: (suggestion?.[1] ?? (why ? '' : reply)).trim(),
    why: (why?.[1] ?? '').trim(),
  }
}

/**
 * The system message for the chat, including what the dashboard knows, so
 * questions like "what do I keep getting wrong?" can be answered.
 */
export function buildChatSystem(
  reports: ScoredReport[],
  current?: ScoredReport,
): ChatMessage {
  const lines: string[] = [HOUSE_STYLE, '', 'What his dashboard currently shows:']

  if (reports.length === 0) {
    lines.push('- No articles scored yet.')
  } else {
    const average = (
      reports.reduce((s, r) => s + r.overall, 0) / reports.length
    ).toFixed(1)
    lines.push(
      `- ${reports.length} article(s) scored, average ${average}/10.`,
      ...reports
        .slice(-8)
        .map(
          (r) =>
            `- "${r.title}" (${r.date}, ${r.language}): ${r.overall}/10, ${
              r.flags.filter((f) => f.status === 'FLAGGED').length
            } flags.`,
        ),
    )
  }

  if (current) {
    lines.push(
      '',
      `He is looking at "${current.title}" (${current.overall}/10). Its flags:`,
      ...current.flags.map(
        (f) =>
          `- [${f.ref ?? (f.line !== null ? `L${f.line}` : '?')}] ${
            PARAM_BY_KEY[f.parameter].label
          } (${f.status}${f.resolved ? ', fixed' : ''}): EN "${f.english}" / ${
            current.language
          } "${f.hindi}" — ${f.reason}`,
      ),
    )
  }

  lines.push(
    '',
    'Answer from this when it is relevant. If something is not in the data, say so rather than inventing it.',
  )
  return { role: 'system', content: lines.join('\n') }
}
