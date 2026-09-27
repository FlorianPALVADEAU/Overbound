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
