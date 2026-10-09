export const RANKED_LAP_TIME_LIMITS = {
  firstLapMinutes: 30,
  midLapsMinutes: 25,
  lateLapMinutes: 20,
  lateLapStartsAt: 6,
} as const

export const RANKED_LAP_TIME_LIMITS_SUMMARY =
  `${RANKED_LAP_TIME_LIMITS.firstLapMinutes} min pour le 1er tour, ` +
  `${RANKED_LAP_TIME_LIMITS.midLapsMinutes} min pour les tours 2 à ${RANKED_LAP_TIME_LIMITS.lateLapStartsAt - 1}, ` +
  `puis ${RANKED_LAP_TIME_LIMITS.lateLapMinutes} min à partir du ${RANKED_LAP_TIME_LIMITS.lateLapStartsAt}e tour`

export const OPEN_FORMAT_RULES = {
  firstSasDeparture: '12h00',
  lastSasDeparture: '15h50',
  sasIntervalMinutes: 10,
  windowHours: 7,
  lastLapStart: '18h45',
  courseClosing: '19h00',
} as const

export const RANKED_FORMAT_RULES = {
  departure: '8h00',
  failedObstacleBurpees: 30,
  finalLapCutoff: '11h30',
  podiumPerGender: 3,
} as const

export const SHARED_FORMAT_RULES = {
  loopKm: 2,
  minAge: 18,
} as const
