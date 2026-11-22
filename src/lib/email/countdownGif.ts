import sharp from 'sharp'

/**
 * Countdown banner for marketing mail: an animated GIF drawn at request time, one frame per second,
 * so the numbers are right when the mail is opened. Pure drawing code: the font glyphs come in as data
 * (see countdownGlyphs.tsx), which keeps this testable without a renderer.
 */

export const COUNTDOWN_WIDTH = 600
export const COUNTDOWN_HEIGHT = 108
export const COUNTDOWN_FRAMES = 60

export const DIGIT_CELL = { width: 44, height: 80 }
export const LABEL_STRIP = { top: 84, height: 20 }
const DIGITS_TOP = 2
const COLUMNS = 4
const COLUMN_WIDTH = COUNTDOWN_WIDTH / COLUMNS

type Rgb = readonly [number, number, number]
const BACKGROUND: Rgb = [20, 20, 20]
const WHITE: Rgb = [255, 255, 255]
const GREEN: Rgb = [38, 170, 38]
const QUIET: Rgb = [141, 145, 153]

/** Coverage (0-255) of each pixel, white text on black read as an alpha mask. */
export interface Mask {
  width: number
  height: number
  alpha: Uint8Array
}

export interface CountdownGlyphs {
  /** Ten cells of DIGIT_CELL size, indexed by digit. */
  digits: Mask[]
  /** One strip of COUNTDOWN_WIDTH x LABEL_STRIP.height with the four unit names. */
  labels: Mask
}

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const SECOND_MS = 1000

/** Time left split for display; past the target everything reads zero, beyond 99 days it stays at 99. */
export function countdownParts(remainingMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / SECOND_MS))
  const days = Math.min(99, Math.floor(totalSeconds / 86_400))
  const capped = days === 99 && totalSeconds >= 100 * 86_400
  return {
    days,
    hours: capped ? 23 : Math.floor((totalSeconds % 86_400) / 3600),
    minutes: capped ? 59 : Math.floor((totalSeconds % 3600) / 60),
    seconds: capped ? 59 : totalSeconds % 60,
  }
}

/** The frame k shows the time left k seconds after `nowMs`. */
export function frameSchedule(targetMs: number, nowMs: number, frames = COUNTDOWN_FRAMES): CountdownParts[] {
  return Array.from({ length: frames }, (_, k) => countdownParts(targetMs - (nowMs + k * SECOND_MS)))
}

const two = (value: number) => String(value).padStart(2, '0')

function blend(buffer: Buffer, offset: number, color: Rgb, coverage: number) {
  if (coverage === 0) return
  const a = coverage / 255
  buffer[offset] = Math.round(buffer[offset] * (1 - a) + color[0] * a)
  buffer[offset + 1] = Math.round(buffer[offset + 1] * (1 - a) + color[1] * a)
  buffer[offset + 2] = Math.round(buffer[offset + 2] * (1 - a) + color[2] * a)
}

function paint(buffer: Buffer, mask: Mask, left: number, top: number, color: Rgb) {
  for (let y = 0; y < mask.height; y += 1) {
    const targetY = top + y
    if (targetY < 0 || targetY >= COUNTDOWN_HEIGHT) continue
    for (let x = 0; x < mask.width; x += 1) {
      const targetX = left + x
      if (targetX < 0 || targetX >= COUNTDOWN_WIDTH) continue
      blend(buffer, (targetY * COUNTDOWN_WIDTH + targetX) * 4, color, mask.alpha[y * mask.width + x])
    }
  }
}

function fillSquare(buffer: Buffer, left: number, top: number, size: number, color: Rgb) {
  for (let y = top; y < top + size; y += 1) {
    for (let x = left; x < left + size; x += 1) {
      blend(buffer, (y * COUNTDOWN_WIDTH + x) * 4, color, 255)
    }
  }
}

/** One RGBA frame: four columns (days, hours, minutes, seconds), seconds in green. */
export function composeFrame(glyphs: CountdownGlyphs, parts: CountdownParts): Buffer {
  const buffer = Buffer.alloc(COUNTDOWN_WIDTH * COUNTDOWN_HEIGHT * 4)
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = BACKGROUND[0]
    buffer[i + 1] = BACKGROUND[1]
    buffer[i + 2] = BACKGROUND[2]
    buffer[i + 3] = 255
  }

  const columns = [parts.days, parts.hours, parts.minutes, parts.seconds]
  columns.forEach((value, column) => {
    const center = column * COLUMN_WIDTH + COLUMN_WIDTH / 2
    const color = column === COLUMNS - 1 ? GREEN : WHITE
    const [tens, units] = two(value)
    paint(buffer, glyphs.digits[Number(tens)], Math.round(center - DIGIT_CELL.width), DIGITS_TOP, color)
    paint(buffer, glyphs.digits[Number(units)], Math.round(center), DIGITS_TOP, color)
  })

  paint(buffer, glyphs.labels, 0, LABEL_STRIP.top, QUIET)

  // Two dots between columns, at the height of the digits' middle.
  for (let column = 1; column < COLUMNS; column += 1) {
    const x = column * COLUMN_WIDTH - 2
    fillSquare(buffer, x, 28, 4, QUIET)
    fillSquare(buffer, x, 50, 4, QUIET)
  }
  return buffer
}

/** Animated GIF counting down from `nowMs`: one frame per second, played once, last frame kept. */
export async function renderCountdownGif(glyphs: CountdownGlyphs, targetMs: number, nowMs: number): Promise<Buffer> {
  const frames = frameSchedule(targetMs, nowMs)
  const pngs = await Promise.all(
    frames.map((parts) =>
      sharp(composeFrame(glyphs, parts), { raw: { width: COUNTDOWN_WIDTH, height: COUNTDOWN_HEIGHT, channels: 4 } })
        .png({ compressionLevel: 1 })
        .toBuffer(),
    ),
  )

  return sharp(pngs, { join: { animated: true } })
    .gif({ delay: frames.map(() => SECOND_MS), loop: 1, colours: 32, effort: 4, dither: 0 })
    .toBuffer()
}

/** Accessible text for the image: what a client that does not load it should say. */
export function countdownAltText(salesStartLabel: string) {
  return `Ouverture de la billetterie ${salesStartLabel}`
}
