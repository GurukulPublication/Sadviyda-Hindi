/**
 * Storage. Everything lives in the browser's IndexedDB through Dexie,
 * so the data survives refreshes and never leaves this machine.
 */

import Dexie, { type Table } from 'dexie'
import type { Report } from '../types'

export class ScorecardDB extends Dexie {
  reports!: Table<Report, number>

  constructor() {
    super('sadvidya-scorecard')
    // "++id" = auto-incrementing primary key. The rest are indexes we sort by.
    this.version(1).stores({
      reports: '++id, date, title, language, isDemo, createdAt',
    })
  }
}

export const db = new ScorecardDB()

/** Save a new report and return its new id. */
export async function addReport(report: Report): Promise<number> {
  return db.reports.add(report)
}

/** Overwrite an existing report. */
export async function updateReport(id: number, report: Report): Promise<void> {
  await db.reports.put({ ...report, id })
}

/** Delete one report. */
export async function deleteReport(id: number): Promise<void> {
  await db.reports.delete(id)
}

/** Every report, oldest first. */
export async function allReports(): Promise<Report[]> {
  const rows = await db.reports.toArray()
  return rows.sort(
    (a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0),
  )
}

/** Remove everything (used by "Clear all data"). */
export async function clearAll(): Promise<void> {
  await db.reports.clear()
}

/** Remove only the demo articles. */
export async function clearDemo(): Promise<void> {
  const demoRows = await db.reports.filter((r) => r.isDemo === true).toArray()
  await db.reports.bulkDelete(demoRows.map((r) => r.id!).filter(Boolean))
}

/** Add several reports at once (demo data and backup import). */
export async function bulkAdd(reports: Report[]): Promise<void> {
  // Strip ids so imported reports never collide with existing ones.
  await db.reports.bulkAdd(reports.map(({ id, ...rest }) => rest as Report))
}
