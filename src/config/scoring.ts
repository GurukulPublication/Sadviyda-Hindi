/**
 * THE ONE FILE TO EDIT IF YOU WANT TO CHANGE THE SCORING.
 *
 * Every deduction, weight and grade label lives here. Change a number here
 * and the whole dashboard (scores, charts, badges) follows automatically.
 */

import type { ParameterKey } from '../types'
import { series } from './theme'

export interface ParameterKeyCopy {
  /** The small glyph shown in the parameter-key card. */
  icon: string
  /** Short name used where space is tight (charts, radar). */
  short: string
  /** The question this parameter asks, in quotes. */
  question: string
  /** What it checks, in one plain sentence. */
  checks: string
  /** A worked example: the English line, the weak Hindi line, and why. */
  example: { en: string; hi: string; why: string }
}

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
  /** Colour used in charts for this parameter (from src/config/theme.ts). */
  color: string
  /** The copy shown in the "Parameter key" section on the Home page. */
  guide: ParameterKeyCopy
}

/**
 * The four fixed parameters, in the order they are shown on screen.
 * Re-ordering this array changes the display order only — never the scoring.
 */
export const PARAMETERS: ParameterConfig[] = [
  {
    key: 'meaningDrift',
    label: 'Meaning Drift',
    meaning:
      'The Hindi says a nearby, softened, or sharpened idea instead of the English one.',
    deduction: 2.0,
    weight: 0.35,
    tip: 'Read the English line, close your eyes, then say the Hindi. If the picture in your head changed even slightly, rewrite it.',
    color: series.meaningDrift,
    guide: {
      icon: '\u25CE',
      short: 'Meaning',
      question: 'Does the Hindi say exactly what the English says?',
      checks:
        'Checks that the idea isn\u2019t lost, softened, or exaggerated in translation.',
      example: {
        en: 'Dehbhav is the root of every sorrow.',
        hi: '\u0926\u0947\u0939\u092D\u093E\u0935 \u0915\u0908 \u0926\u0941\u0916\u094B\u0902 \u0915\u093E \u0915\u093E\u0930\u0923 \u0939\u0948\u0964',
        why: '\u201Cevery\u201D became \u201Cmany\u201D',
      },
    },
  },
  {
    key: 'naturalPhrasing',
    label: 'Natural Phrasing',
    meaning: 'The Hindi sounds stiff or copies English sentence structure.',
    deduction: 1.0,
    weight: 0.25,
    tip: 'Cover the English and rewrite the line from memory. Hindi word order will usually fix itself.',
    color: series.naturalPhrasing,
    guide: {
      icon: '\u223F',
      short: 'Phrasing',
      question: 'Does it sound written in Hindi, or copied from English?',
      checks:
        'Checks that sentences flow naturally for a Hindi reader instead of following English word order.',
      example: {
        en: 'Swami\u2019s words land softly, but they do not leave.',
        hi: '\u0938\u094D\u0935\u093E\u092E\u0940 \u0915\u0947 \u0936\u092C\u094D\u0926 \u0927\u0940\u0930\u0947 \u0938\u0947 \u0909\u0924\u0930\u0924\u0947 \u0939\u0948\u0902, \u092A\u0930 \u091C\u093E\u0924\u0947 \u0928\u0939\u0940\u0902\u0964',
        why: '\u201Cland\u201D was copied word for word; \u201C\u092E\u0928 \u092E\u0947\u0902 \u092C\u0948\u0920 \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u201D sounds natural',
      },
    },
  },
  {
    key: 'termConsistency',
    label: 'Term Consistency',
    meaning:
      'Names, scripture titles, and Sanskrit-rooted words are handled inconsistently.',
    deduction: 1.0,
    weight: 0.15,
    tip: 'Keep a small list of your key terms (Akshardham, Vachanamrut, dehbhav) and spell each one the same way every time.',
    color: series.termConsistency,
    guide: {
      icon: '\u2261',
      short: 'Terms',
      question: 'Is every key term written the same way throughout?',
      checks:
        'Checks that spiritual and Sanskrit terms keep one spelling and one meaning from start to finish.',
      example: {
        en: 'This is what the shastras call dehbhav.',
        hi: '\u0907\u0938\u0940 \u0915\u094B \u0936\u093E\u0938\u094D\u0924\u094D\u0930 \u0926\u0947\u0939-\u092D\u093E\u0935\u0928\u093E \u0915\u0939\u0924\u0947 \u0939\u0948\u0902\u0964',
        why: '\u201C\u0926\u0947\u0939\u092D\u093E\u0935\u201D became \u201C\u0926\u0947\u0939-\u092D\u093E\u0935\u0928\u093E\u201D',
      },
    },
  },
  {
    key: 'voiceConviction',
    label: 'Voice & Conviction',
    meaning: 'The tone has gone flat, generic, or overly formal.',
    deduction: 1.5,
    weight: 0.25,
    tip: 'Read the Hindi out loud. If it sounds like a notice board rather than you speaking, put the conviction back.',
    color: series.voiceConviction,
    guide: {
      icon: '!',
      short: 'Voice',
      question: 'Does it carry the same conviction as the original?',
      checks:
        'Checks that firm, certain lines stay firm and are not turned into polite suggestions.',
      example: {
        en: 'Do not wait for a better time to serve.',
        hi: '\u0938\u0947\u0935\u093E \u0915\u0947 \u0932\u093F\u090F \u0936\u093E\u092F\u0926 \u0905\u091A\u094D\u091B\u0947 \u0938\u092E\u092F \u0915\u093E \u0907\u0902\u0924\u091C\u093C\u093E\u0930 \u0928 \u0915\u0930\u0947\u0902\u0964',
        why: '\u201C\u0936\u093E\u092F\u0926\u201D (perhaps) was added',
      },
    },
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

/**
 * Grade labels, checked from the top down.
 *
 * These follow the flame scale used in the design. The original wording from
 * the project brief was: 9+ "Written in Hindi", 7.5+ "Almost there",
 * 6+ "Needs polish", below 6 "Reads like a translation" — swap the labels back
 * here if you prefer those.
 */
export const GRADES: { min: number; label: string }[] = [
  { min: 9, label: 'Radiant flame' },
  { min: 7.5, label: 'Bright and steady' },
  { min: 6, label: 'Burning low' },
  { min: 0, label: 'Needs more oil' },
]

/**
 * Words used by the parser and the review table to match a parameter name.
 *
 * The first list is the proper name of each parameter. The rest are the words
 * real reviews use for the same idea — designed reports often label a flag
 * "TONE LOSS" or "OMISSION" rather than naming the parameter outright.
 * Longer aliases win over shorter ones, so "meaning drift / addition" matches
 * Meaning Drift rather than anything else.
 */
export const PARAMETER_ALIASES: Record<ParameterKey, string[]> = {
  meaningDrift: [
    'meaning drift',
    'meaning',
    'drift',
    'meaningdrift',
    // Something dropped from, or invented in, the translation: the idea moved.
    'omission',
    'omitted',
    'addition',
    'added',
    'accuracy',
    'mistranslation',
  ],
  naturalPhrasing: [
    'natural phrasing',
    'phrasing',
    'natural',
    'naturalphrasing',
    'naturalness',
    'stiff phrasing',
    'stiff',
    'awkward',
    'readability',
    'flow',
    'structure',
    'word order',
  ],
  termConsistency: [
    'term consistency',
    'terminology',
    'term',
    'consistency',
    'termconsistency',
    'terms',
    'inconsistent term',
  ],
  voiceConviction: [
    'voice conviction',
    'voice and conviction',
    'voice & conviction',
    'voice',
    'conviction',
    'tone',
    'voiceconviction',
    'tone loss',
    'tone shift',
    'register',
    'emphasis',
  ],
}
