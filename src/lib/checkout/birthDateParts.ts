export interface BirthDateParts {
  day: string
  month: string
  year: string
}

const pad = (value: string) => (value.length === 1 ? `0${value}` : value)

/** Splits a stored "YYYY-MM-DD" into the three typed parts; anything else gives empty parts. */
export const splitBirthDate = (iso: string): BirthDateParts => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  return match ? { year: match[1], month: match[2], day: match[3] } : { day: '', month: '', year: '' }
}

/** "YYYY-MM-DD" once the three parts form a real calendar date, otherwise '' (nothing stored yet). */
export const joinBirthDate = ({ day, month, year }: BirthDateParts): string => {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return ''
  const [d, m, y] = [Number(day), Number(month), Number(year)]
  const date = new Date(Date.UTC(y, m - 1, d))
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  return real ? `${year}-${pad(month)}-${pad(day)}` : ''
}
