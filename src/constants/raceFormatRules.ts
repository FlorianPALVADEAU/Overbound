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
  failedObstacleBurpees: 10,
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
  obstaclesPerLoopMin: 10,
  /** Age of majority: the minimum age of every event, unless its page says it is open to minors. */
  minAge: 18,
  /** Youngest age of an event open to minors (`events.minimum_age = 16`), OPEN format only. */
  minorMinAge: 16,
} as const

/**
 * Site-wide wording of the age rule, true whether or not an event is open to minors: the event page
 * and the checkout state the exact rule of their event from `events.minimum_age`.
 */
export const AGE_RULE_SHORT =
  `${SHARED_FORMAT_RULES.minAge} ans révolus (dès ${SHARED_FORMAT_RULES.minorMinAge} ans au format OPEN sur les événements ouverts aux mineurs)`

export const AGE_RULE_ANSWER =
  `${SHARED_FORMAT_RULES.minAge} ans révolus. Quand un événement est ouvert aux mineurs, les ${SHARED_FORMAT_RULES.minorMinAge} et 17 ans peuvent y participer au format OPEN uniquement, avec une autorisation parentale signée et un adulte référent présent sur le site. La page de chaque événement précise sa règle.`
