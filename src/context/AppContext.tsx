/**
 * One small shared context holding:
 *  - every report, already scored
 *  - the language filter (All / Hindi / Gujarati) used across the dashboard
 *
 * Dexie's live query keeps the data in sync automatically, so saving a report
 * anywhere updates every page.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { scoreAll } from '../lib/scoring'
import type { Language, ScoredReport } from '../types'

export type LanguageFilter = 'All' | Language

interface AppState {
  /** All reports (unfiltered), oldest first. */
  allReports: ScoredReport[]
  /** Reports after the language filter, oldest first. */
  reports: ScoredReport[]
  languageFilter: LanguageFilter
  setLanguageFilter: (f: LanguageFilter) => void
  /** False only while the very first read from IndexedDB is in flight. */
  loaded: boolean
}

const Ctx = createContext<AppState | null>(null)

const FILTER_KEY = 'sadvidya.languageFilter'

export function AppProvider({ children }: { children: ReactNode }) {
  const [languageFilter, setFilterState] = useState<LanguageFilter>(() => {
    const saved = localStorage.getItem(FILTER_KEY)
    return saved === 'Hindi' || saved === 'Gujarati' ? saved : 'All'
  })

  const setLanguageFilter = (f: LanguageFilter) => {
    setFilterState(f)
    localStorage.setItem(FILTER_KEY, f)
  }

  // undefined while loading, then an array.
  const rows = useLiveQuery(() => db.reports.toArray(), [], undefined)

  const allReports = useMemo(() => scoreAll(rows ?? []), [rows])
  const reports = useMemo(
    () =>
      languageFilter === 'All'
        ? allReports
        : allReports.filter((r) => r.language === languageFilter),
    [allReports, languageFilter],
  )

  return (
    <Ctx.Provider
      value={{
        allReports,
        reports,
        languageFilter,
        setLanguageFilter,
        loaded: rows !== undefined,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
