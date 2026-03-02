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

export const isOpenFormatTicket = (ticketName?: string | null, raceName?: string | null) => {
  const name = `${ticketName ?? ''} ${raceName ?? ''}`.toLowerCase()
  return name.includes('open')
}

export const isRankedFormatTicket = (ticketName?: string | null, raceName?: string | null) => {
  const name = `${ticketName ?? ''} ${raceName ?? ''}`.toLowerCase()
  return name.includes('ranked')
}

export const getRankedStartTime = (eventDateIso: string) => {
  const start = new Date(eventDateIso)
  start.setHours(RANKED_START_CONFIG.hour, RANKED_START_CONFIG.minute, 0, 0)
  return start
}

export const buildOpenWaveSchedule = (eventDateIso: string): OpenWaveSchedule => {
  const base = new Date(eventDateIso)
  const firstDeparture = new Date(base)
  firstDeparture.setHours(OPEN_SAS_CONFIG.firstDeparture.hour, OPEN_SAS_CONFIG.firstDeparture.minute, 0, 0)

  const lastDeparture = new Date(base)
  lastDeparture.setHours(OPEN_SAS_CONFIG.lastDeparture.hour, OPEN_SAS_CONFIG.lastDeparture.minute, 0, 0)

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

const getPreferredWindow = (base: Date, distanceIdeal: number) => {
  const start = new Date(base)
  const end = new Date(base)

  if (distanceIdeal >= 20) {
    start.setHours(8, 0, 0, 0)
    end.setHours(9, 30, 0, 0)
  } else if (distanceIdeal >= 10) {
    start.setHours(9, 0, 0, 0)
    end.setHours(10, 30, 0, 0)
  } else {
    start.setHours(10, 0, 0, 0)
    end.setHours(11, 50, 0, 0)
  }

  return { start, end }
}

const getLatestAllowed = (base: Date, distanceMin: number) => {
  const latest = new Date(base)
  if (distanceMin >= 20) {
    latest.setHours(9, 30, 0, 0)
  } else if (distanceMin >= 10) {
    latest.setHours(10, 30, 0, 0)
  } else {
    latest.setHours(11, 50, 0, 0)
  }
  return latest
}

export const formatWaveStartTime = (startTime: string | null | undefined) => {
  if (!startTime) return null
  const date = new Date(startTime)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export const formatWaveStartDateTime = (startTime: string | null | undefined) => {
  if (!startTime) return null
  const date = new Date(startTime)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
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

  const baseDate = new Date(eventDateIso)
  const normalizedIdeal = normalizeDistanceValue(distanceIdealKm)
  const normalizedMin = normalizeDistanceValue(distanceMinKm)

  const preferred = normalizedIdeal !== null
    ? getPreferredWindow(baseDate, normalizedIdeal)
    : (() => {
        const start = new Date(eventDateIso)
        start.setHours(8, 0, 0, 0)
        const end = new Date(eventDateIso)
        end.setHours(11, 50, 0, 0)
        return { start, end }
      })()

  const latestAllowed = normalizedMin !== null
    ? getLatestAllowed(new Date(eventDateIso), normalizedMin)
    : (() => {
        const latest = new Date(eventDateIso)
        latest.setHours(11, 50, 0, 0)
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
