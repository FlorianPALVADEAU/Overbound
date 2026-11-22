/**
 * One conversion for every `<input type="datetime-local">` of the admin.
 *
 * The input has no zone: it holds the wall clock the admin reads, which is always Paris time. The
 * helpers below read and write that wall clock in Europe/Paris, whatever the browser or the server
 * zone is. Reading with `toISOString().slice(0, 16)` (UTC digits) and writing with `new Date(input)`
 * (browser digits) shifts the value by the zone offset on each save, which is how 07:00 became 05:00.
 */

const PARIS_TIME_ZONE = 'Europe/Paris'
const INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

const parisParts = new Intl.DateTimeFormat('en-US', {
  timeZone: PARIS_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

type Parts = { year: number; month: number; day: number; hour: number; minute: number }

function readParisParts(instantMs: number): Parts {
  const values = Object.fromEntries(parisParts.formatToParts(new Date(instantMs)).map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  }
}

/** Paris offset in milliseconds at this instant: +3600000 in winter, +7200000 in summer. */
function parisOffsetMs(instantMs: number): number {
  const p = readParisParts(instantMs)
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  return wallClockAsUtc - Math.floor(instantMs / 60_000) * 60_000
}

/**
 * Input value (Paris wall clock) to an ISO instant in UTC. Null when the text is not a complete
 * `YYYY-MM-DDTHH:mm` or names a day that does not exist (e.g. 30 février).
 */
export function parisInputToIso(value: string | null | undefined): string | null {
  const match = INPUT_PATTERN.exec(value?.trim() ?? '')
  if (!match) return null

  const [year, month, day, hour, minute] = match.slice(1).map(Number)
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const check = readParisParts(wallClockAsUtc - parisOffsetMs(wallClockAsUtc))
  if (check.year !== year || check.month !== month || check.day !== day) return null

  // Two passes: the first guess can sit on the wrong side of a DST change.
  const firstGuess = wallClockAsUtc - parisOffsetMs(wallClockAsUtc)
  const instant = wallClockAsUtc - parisOffsetMs(firstGuess)
  return new Date(instant).toISOString()
}

/** ISO instant (or Date) to the `YYYY-MM-DDTHH:mm` text the input shows, read in Paris. Empty when missing. */
export function isoToParisInput(value: string | Date | null | undefined): string {
  if (!value) return ''
  const instantMs = value instanceof Date ? value.getTime() : Date.parse(value)
  if (Number.isNaN(instantMs)) return ''

  const p = readParisParts(instantMs)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}
