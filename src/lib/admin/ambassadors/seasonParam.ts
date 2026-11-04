/** The `year` query parameter of the admin ambassador API: a season key, or null for the running season. */
export function parseSeasonParam(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 2020 && parsed <= 2100 ? parsed : null
}
