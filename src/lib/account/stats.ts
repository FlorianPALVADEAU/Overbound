export type StatsFormat = 'open' | 'ranked'

/** One bib, reduced to what the statistics need. */
export interface StatsRegistration {
  userId: string | null
  email: string | null
  eventId: string | null
  eventTitle: string | null
  eventDate: string | null
  format: StatsFormat | null
  startTime: string | null
  checkedIn: boolean
}

export type FormatCounts = Record<StatsFormat | 'other', number>

export interface TimelineEntry {
  eventId: string
  title: string
  date: string | null
  bibs: number
}

export interface RunnerStats {
  editions: number
  bibs: number
  ownBibs: number
  bibsForOthers: number
  checkedIn: number
  byFormat: FormatCounts
  timeline: TimelineEntry[]
}

export interface DepartureSlot {
  slot: string
  count: number
}

export interface GroupStats {
  event: { id: string; title: string; date: string | null } | null
  memberCount: number
  registeredMembers: number
  bibs: number
  checkedIn: number
  byFormat: FormatCounts
  departures: DepartureSlot[]
}

export interface AccountStats {
  runner: RunnerStats
  group: (GroupStats & { name: string }) | null
}

const emptyFormats = (): FormatCounts => ({ open: 0, ranked: 0, other: 0 })

const count = (rows: StatsRegistration[]) => {
  const byFormat = emptyFormats()
  for (const row of rows) {
    byFormat[row.format ?? 'other'] += 1
  }
  return { byFormat }
}

const normalizeEmail = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

export const buildRunnerStats = (rows: StatsRegistration[], userEmail: string | null | undefined): RunnerStats => {
  const own = normalizeEmail(userEmail)
  const ownBibs = rows.filter((row) => !row.email || normalizeEmail(row.email) === own).length

  const events = new Map<string, TimelineEntry>()
  for (const row of rows) {
    const key = row.eventId ?? row.eventTitle ?? 'unknown'
    const entry = events.get(key)
    if (entry) entry.bibs += 1
    else events.set(key, { eventId: key, title: row.eventTitle ?? 'Événement', date: row.eventDate, bibs: 1 })
  }

  return {
    editions: events.size,
    bibs: rows.length,
    ownBibs,
    bibsForOthers: rows.length - ownBibs,
    checkedIn: rows.filter((row) => row.checkedIn).length,
    ...count(rows),
    timeline: Array.from(events.values()).sort((a, b) => Date.parse(a.date ?? '') - Date.parse(b.date ?? '')),
  }
}

const SLOT_MINUTES = 30
const PARIS_TIME_ZONE = 'Europe/Paris'

/** « 12:30 » : half-hour bucket of an instant, in Paris time. */
export const departureSlot = (value: string): string | null => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  const bucket = Math.floor(minute / SLOT_MINUTES) * SLOT_MINUTES
  return `${hour}:${String(bucket).padStart(2, '0')}`
}

export const bucketDepartures = (startTimes: Array<string | null>): DepartureSlot[] => {
  const slots = new Map<string, number>()
  for (const value of startTimes) {
    const slot = value ? departureSlot(value) : null
    if (slot) slots.set(slot, (slots.get(slot) ?? 0) + 1)
  }
  return Array.from(slots, ([slot, total]) => ({ slot, count: total })).sort((a, b) => a.slot.localeCompare(b.slot))
}

/**
 * Group figures for one event: the anchor event when set, otherwise the most
 * recent event any member is registered to.
 */
export const buildGroupStats = (
  rows: StatsRegistration[],
  memberIds: string[],
  anchorEventId: string | null,
): GroupStats => {
  const memberSet = new Set(memberIds)
  const memberRows = rows.filter((row) => row.userId && memberSet.has(row.userId))

  const latestEventId = [...memberRows]
    .filter((row) => row.eventId)
    .sort((a, b) => Date.parse(b.eventDate ?? '') - Date.parse(a.eventDate ?? ''))[0]?.eventId
  const eventId = anchorEventId ?? latestEventId ?? null
  const eventRows = eventId ? memberRows.filter((row) => row.eventId === eventId) : []
  const first = eventRows[0]

  return {
    event: eventId && first ? { id: eventId, title: first.eventTitle ?? 'Événement', date: first.eventDate } : null,
    memberCount: memberIds.length,
    registeredMembers: new Set(eventRows.map((row) => row.userId)).size,
    bibs: eventRows.length,
    checkedIn: eventRows.filter((row) => row.checkedIn).length,
    ...count(eventRows),
    departures: bucketDepartures(eventRows.map((row) => row.startTime)),
  }
}
