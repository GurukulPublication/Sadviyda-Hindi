/**
 * THE ONE FILE TO EDIT IF YOU WANT TO CHANGE THE SCORING.
 *
 * Every deduction, weight and grade label lives here. Change a number here
 * and the whole dashboard (scores, charts, badges) follows automatically.
 */

import type { ParameterKey } from '../types'

export interface ParameterConfig {
  key: ParameterKey
  /** Name shown on screen. */
  label: string
  /** One plain-English line explaining what the parameter means. */
  meaning: string
  /** Points removed from 10 for each FLAGGED item in this parameter. */
  deduction: number
  /** Share of the overall score (all weights must add up to 1). */
  weight: number
  /** A practical tip shown under "What to work on". */
  tip: string
  /** Colour used in charts for this parameter. */
  color: string
}

/** The four fixed parameters, in the order they are shown. */
export const PARAMETERS: ParameterConfig[] = [
  {
    key: 'meaningDrift',
    label: 'Meaning Drift',
    meaning:
      'The Hindi says a nearby, softened, or sharpened idea instead of the English one.',
    deduction: 2.0,
    weight: 0.35,
    tip: 'Read the English line, close your eyes, then say the Hindi. If the picture in your head changed even slightly, rewrite it.',
    color: '#C4623F',
  },
  {
    key: 'voiceConviction',
    label: 'Voice & Conviction',
    meaning: 'The tone has gone flat, generic, or overly formal.',
    deduction: 1.5,
    weight: 0.25,
    tip: 'Read the Hindi out loud. If it sounds like a notice board rather than you speaking, put the conviction back.',
    color: '#6B6B52',
  },
  {
    key: 'naturalPhrasing',
    label: 'Natural Phrasing',
    meaning: 'The Hindi sounds stiff or copies English sentence structure.',
    deduction: 1.0,
    weight: 0.25,
    tip: 'Cover the English and rewrite the line from memory. Hindi word order will usually fix itself.',
    color: '#C98B6B',
  },
  {
    key: 'termConsistency',
    label: 'Term Consistency',
    meaning:
      'Names, scripture titles, and Sanskrit-rooted words are handled inconsistently.',
    deduction: 1.0,
    weight: 0.15,
    tip: 'Keep a small list of your key terms (Akshardham, Vachanamrut, dehbhav) and spell each one the same way every time.',
    color: '#8C9A72',
  },
]

/** Quick lookup by key. */
export const PARAM_BY_KEY: Record<ParameterKey, ParameterConfig> =
  Object.fromEntries(PARAMETERS.map((p) => [p.key, p])) as Record<
    ParameterKey,
    ParameterConfig
  >

/** Every parameter starts here before deductions. */
export const MAX_SCORE = 10

/** The dotted "target" line on the score journey chart. */
export const TARGET_SCORE = 8.0

/** Grade labels, checked from the top down. */
export const GRADES: { min: number; label: string }[] = [
  { min: 9, label: 'Written in Hindi' },
  { min: 7.5, label: 'Almost there' },
  { min: 6, label: 'Needs polish' },
  { min: 0, label: 'Reads like a translation' },
]

/** Words used by the parser and the review table to match a parameter name. */
export const PARAMETER_ALIASES: Record<ParameterKey, string[]> = {
  meaningDrift: ['meaning drift', 'meaning', 'drift', 'meaningdrift'],
  naturalPhrasing: [
    'natural phrasing',
    'phrasing',
    'natural',
    'naturalphrasing',
    'naturalness',
  ],
  termConsistency: [
    'term consistency',
    'terminology',
    'term',
    'consistency',
    'termconsistency',
  ],
  voiceConviction: [
    'voice conviction',
    'voice and conviction',
    'voice & conviction',
    'voice',
    'conviction',
    'tone',
    'voiceconviction',
  ],
}
