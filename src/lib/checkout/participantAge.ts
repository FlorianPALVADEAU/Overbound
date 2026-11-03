/** Age of majority: below it, a participant needs the minor's papers (see `classifyParticipantAge`). */
export const ADULT_AGE = 18

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Calendar parts of a "YYYY-MM-DD" birth date, or null when it is not a real date. */
const parseBirthDate = (value: string) => {
  const match = DATE_ONLY.exec(value.trim())
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { year, month, day } : null
}

/** Age in full years on a given day, by calendar date (a birthday counts from its first minute). */
export const ageOn = (birthDate: string, day: Date): number | null => {
  const birth = parseBirthDate(birthDate)
  if (!birth) return null
  const hadBirthday =
    day.getUTCMonth() + 1 > birth.month || (day.getUTCMonth() + 1 === birth.month && day.getUTCDate() >= birth.day)
  return day.getUTCFullYear() - birth.year - (hadBirthday ? 0 : 1)
}

/** True when the date is valid and the person is under 18 on the event day (drives the minor's fields). */
export const isMinorOnEventDate = (birthDate: string, eventDate: string): boolean => {
  const day = new Date(eventDate)
  const age = Number.isNaN(day.getTime()) ? null : ageOn(birthDate, day)
  return age !== null && age < ADULT_AGE
}

export type AgeRefusal = 'invalid_birth_date' | 'too_young' | 'minor_open_only'

export type AgeVerdict = { status: 'adult' } | { status: 'minor' } | { status: 'refused'; reason: AgeRefusal }

interface AgeRuleInput {
  birthDate?: string | null
  eventDate: string | Date
  /** `events.minimum_age`: 18 for an edition limited to adults, 16 once it admits 16 to 17 year olds. */
  minimumAge: number
  isOpenFormat: boolean
}

/**
 * Whether someone may register, from their age on the event day. Under 18 they are a minor: allowed
 * only once the event's minimum age admits them, and only on the OPEN format (non-competitive).
 */
export const classifyParticipantAge = ({ birthDate, eventDate, minimumAge, isOpenFormat }: AgeRuleInput): AgeVerdict => {
  const day = typeof eventDate === 'string' ? new Date(eventDate) : eventDate
  const age = birthDate && !Number.isNaN(day.getTime()) ? ageOn(birthDate, day) : null
  if (age === null) return { status: 'refused', reason: 'invalid_birth_date' }
  if (age >= ADULT_AGE) return { status: 'adult' }
  if (age < minimumAge) return { status: 'refused', reason: 'too_young' }
  return isOpenFormat ? { status: 'minor' } : { status: 'refused', reason: 'minor_open_only' }
}

export const ageRefusalMessage = (reason: AgeRefusal, minimumAge: number): string => {
  switch (reason) {
    case 'invalid_birth_date':
      return 'Date de naissance invalide.'
    case 'too_young':
      return `Il faut avoir ${minimumAge} ans le jour de l'événement.`
    case 'minor_open_only':
      return `Avant ${ADULT_AGE} ans, l'inscription est possible uniquement au format OPEN.`
  }
}
