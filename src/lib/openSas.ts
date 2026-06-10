import { formatClockTimeParis, formatDateTimeParis } from '@/lib/dateTime'

export const OPEN_SAS_CONFIG = {
  firstDeparture: { hour: 8, minute: 0 },
  lastDeparture: { hour: 11, minute: 50 },
  intervalMinutes: 10,
  waveCapacity: 50,
} as const

export const RANKED_START_CONFIG = {
  hour: 15,
  minute: 0,
} as const

const PARIS_TIME_ZONE = 'Europe/Paris'

export type OpenWaveSchedule = {
  firstDeparture: Date
  lastDeparture: Date
  waveCount: number
  intervalMinutes: number
}

export type OpenWaveAssignment = {
  waveIndex: number
  startTime: string
  waveCapacity: number
  wavePosition: number
  assignmentConstraintBreached: boolean
  preferredWindowStart: string
  preferredWindowEnd: string
  latestAllowedTime: string
}

const getParisDateParts = (eventDateIso: string) => {
  const base = new Date(eventDateIso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(base)

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error('Impossible de résoudre la date Europe/Paris pour cet événement')
  }

  return { year, month, day }
}

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
  const timeZoneName = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')
    ?.value

  const match = timeZoneName?.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/)
  if (!match) return 0

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2] || 0)
  const minutes = Number(match[3] || 0)
  return sign * (hours * 60 + minutes)
}

const buildParisDateTime = (eventDateIso: string, hour: number, minute: number) => {
  const { year, month, day } = getParisDateParts(eventDateIso)
  const utcGuessMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcGuessMs), PARIS_TIME_ZONE)
  return new Date(utcGuessMs - offsetMinutes * 60 * 1000)
}

export const isOpenFormatTicket = (ticketName?: string | null, raceName?: string | null) => {
  const name = `${ticketName ?? ''} ${raceName ?? ''}`.toLowerCase()
  return name.includes('open')
}

export const isRankedFormatTicket = (ticketName?: string | null, raceName?: string | null) => {
  const name = `${ticketName ?? ''} ${raceName ?? ''}`.toLowerCase()
  return name.includes('ranked')
}

export const getRankedStartTime = (eventDateIso: string) => {
  return buildParisDateTime(eventDateIso, RANKED_START_CONFIG.hour, RANKED_START_CONFIG.minute)
}

export const buildOpenWaveSchedule = (eventDateIso: string): OpenWaveSchedule => {
  const firstDeparture = buildParisDateTime(
    eventDateIso,
    OPEN_SAS_CONFIG.firstDeparture.hour,
    OPEN_SAS_CONFIG.firstDeparture.minute,
  )

  const lastDeparture = buildParisDateTime(
    eventDateIso,
    OPEN_SAS_CONFIG.lastDeparture.hour,
    OPEN_SAS_CONFIG.lastDeparture.minute,
  )

  const intervalMs = OPEN_SAS_CONFIG.intervalMinutes * 60 * 1000
  const waveCount = Math.floor((lastDeparture.getTime() - firstDeparture.getTime()) / intervalMs) + 1

  return {
    firstDeparture,
    lastDeparture,
    waveCount,
    intervalMinutes: OPEN_SAS_CONFIG.intervalMinutes,
  }
}

const normalizeDistanceValue = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed)
}

const getPreferredWindow = (eventDateIso: string, distanceIdeal: number) => {
  let startHour = 10
  let startMinute = 0
  let endHour = 11
  let endMinute = 50

  if (distanceIdeal >= 20) {
    startHour = 8
    startMinute = 0
    endHour = 9
    endMinute = 30
  } else if (distanceIdeal >= 10) {
    startHour = 9
    startMinute = 0
    endHour = 10
    endMinute = 30
  }

  const start = buildParisDateTime(eventDateIso, startHour, startMinute)
  const end = buildParisDateTime(eventDateIso, endHour, endMinute)

  return { start, end }
}

const getLatestAllowed = (eventDateIso: string, distanceMin: number) => {
  let hour = 11
  let minute = 50
  if (distanceMin >= 20) {
    hour = 9
    minute = 30
  } else if (distanceMin >= 10) {
    hour = 10
    minute = 30
  }
  return buildParisDateTime(eventDateIso, hour, minute)
}

export const formatWaveStartTime = (startTime: string | null | undefined) => {
  return formatClockTimeParis(startTime)
}

export const formatWaveStartDateTime = (startTime: string | null | undefined) => {
  return formatDateTimeParis(startTime)
}

export const buildOpenWaveRows = (eventId: string, eventDateIso: string) => {
  const schedule = buildOpenWaveSchedule(eventDateIso)
  const rows = Array.from({ length: schedule.waveCount }, (_, index) => {
    const startTime = new Date(schedule.firstDeparture)
    startTime.setMinutes(startTime.getMinutes() + index * schedule.intervalMinutes)
    return {
      event_id: eventId,
      wave_index: index + 1,
      start_time: startTime.toISOString(),
      capacity: OPEN_SAS_CONFIG.waveCapacity,
      assigned_count: 0,
      is_closed: false,
    }
  })

  return { schedule, rows }
}

export const assignOpenWaveToRegistration = async ({
  admin,
  eventId,
  registrationId,
  eventDateIso,
  ticketName,
  raceName,
  distanceIdealKm,
  distanceMinKm,
}: {
  admin: any
  eventId: string
  registrationId: string
  eventDateIso: string
  ticketName?: string | null
  raceName?: string | null
  distanceIdealKm?: number | string | null
  distanceMinKm?: number | string | null
}): Promise<OpenWaveAssignment | null> => {
  if (!isOpenFormatTicket(ticketName, raceName)) return null

  const normalizedIdeal = normalizeDistanceValue(distanceIdealKm)
  const normalizedMin = normalizeDistanceValue(distanceMinKm)

  const preferred = normalizedIdeal !== null
    ? getPreferredWindow(eventDateIso, normalizedIdeal)
    : (() => {
        const start = buildParisDateTime(eventDateIso, 8, 0)
        const end = buildParisDateTime(eventDateIso, 11, 50)
        return { start, end }
      })()

  const latestAllowed = normalizedMin !== null
    ? getLatestAllowed(eventDateIso, normalizedMin)
    : (() => {
        const latest = buildParisDateTime(eventDateIso, 11, 50)
        return latest
      })()

  const schedule = buildOpenWaveSchedule(eventDateIso)
  const { data, error } = await admin.rpc('assign_open_wave_to_registration', {
    p_event_id: eventId,
    p_registration_id: registrationId,
    p_first_departure: schedule.firstDeparture.toISOString(),
    p_wave_count: schedule.waveCount,
    p_interval_minutes: schedule.intervalMinutes,
    p_default_capacity: OPEN_SAS_CONFIG.waveCapacity,
    p_preferred_start: preferred.start.toISOString(),
    p_preferred_end: preferred.end.toISOString(),
    p_latest_allowed: latestAllowed.toISOString(),
  })

  if (error) {
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Aucun SAS OPEN disponible')
  }

  return {
    waveIndex: row.wave_index ?? row.waveIndex ?? row.out_wave_index ?? row.outWaveIndex,
    startTime: row.start_time ?? row.startTime ?? row.out_start_time ?? row.outStartTime,
    waveCapacity: row.wave_capacity ?? row.waveCapacity ?? row.out_wave_capacity ?? row.outWaveCapacity ?? OPEN_SAS_CONFIG.waveCapacity,
    wavePosition: row.wave_position ?? row.wavePosition ?? row.out_wave_position ?? row.outWavePosition,
    assignmentConstraintBreached: Boolean(
      row.assignment_constraint_breached ??
      row.assignmentConstraintBreached ??
      row.out_assignment_constraint_breached ??
      row.outAssignmentConstraintBreached,
    ),
    preferredWindowStart:
      row.preferred_window_start ??
      row.preferredWindowStart ??
      row.out_preferred_window_start ??
      row.outPreferredWindowStart ??
      preferred.start.toISOString(),
    preferredWindowEnd:
      row.preferred_window_end ??
      row.preferredWindowEnd ??
      row.out_preferred_window_end ??
      row.outPreferredWindowEnd ??
      preferred.end.toISOString(),
    latestAllowedTime:
      row.latest_allowed_time ??
      row.latestAllowedTime ??
      row.out_latest_allowed_time ??
      row.outLatestAllowedTime ??
      latestAllowed.toISOString(),
  }
}
