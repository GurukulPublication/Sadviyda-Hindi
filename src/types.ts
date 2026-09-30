/**
 * All the shared data shapes of the dashboard.
 * Keeping them in one file makes it easy to see what a "report" actually is.
 */

/** The four fixed review parameters. These never change. */
export type ParameterKey =
  | 'meaningDrift'
  | 'naturalPhrasing'
  | 'termConsistency'
  | 'voiceConviction'

/** A flag is either a real issue (FLAGGED) or a judgment call (UNSURE). */
export type FlagStatus = 'FLAGGED' | 'UNSURE'

/** Which language the article was translated into. */
export type Language = 'Hindi' | 'Gujarati'

/** One flagged line from a Flag Report. */
export interface Flag {
  /** Stable id inside the report, used as a React key while editing. */
  id: string
  /** Line number in the article, as written in the PDF. */
  line: number | null
  /** The English sentence. */
  english: string
  /** The Hindi (or Gujarati) sentence. */
  hindi: string
  /** Which of the four parameters this flag belongs to. */
  parameter: ParameterKey
  /** FLAGGED counts against the score; UNSURE does not. */
  status: FlagStatus
  /** Why it was flagged, in one or two sentences. */
  reason: string
  /** The key term involved, if the report named one (e.g. "dehbhav"). */
  term?: string
}

/** One uploaded Flag Report, i.e. one article review. */
export interface Report {
  /** Auto-incremented by Dexie. */
  id?: number
  title: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  language: Language
  /** Overall status written in the PDF header. */
  status: 'CLEAN' | 'FLAGGED'
  flags: Flag[]
  /** True for the sample articles added by "Load demo data". */
  isDemo?: boolean
  /** When the report was saved into the dashboard. */
  createdAt: string
}

/** A report plus everything the scoring engine worked out about it. */
export interface ScoredReport extends Report {
  scores: Record<ParameterKey, number>
  /** Number of FLAGGED items per parameter. */
  flagCounts: Record<ParameterKey, number>
  /** Number of UNSURE items per parameter. */
  unsureCounts: Record<ParameterKey, number>
  overall: number
  grade: string
}
