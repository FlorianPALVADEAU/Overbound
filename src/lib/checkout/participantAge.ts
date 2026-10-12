export const MINIMUM_AGE = 18

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

/** True when the participant is at least 18 on the day of the event. */
export const isAdultOnEventDate = (birthDate: string, eventDate: string | Date): boolean => {
  const day = typeof eventDate === 'string' ? new Date(eventDate) : eventDate
  if (Number.isNaN(day.getTime())) return false
  const age = ageOn(birthDate, day)
  return age !== null && age >= MINIMUM_AGE
}
