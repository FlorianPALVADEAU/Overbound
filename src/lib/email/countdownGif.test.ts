import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import {
  COUNTDOWN_FRAMES,
  COUNTDOWN_HEIGHT,
  COUNTDOWN_WIDTH,
  DIGIT_CELL,
  LABEL_STRIP,
  composeFrame,
  countdownAltText,
  countdownParts,
  frameSchedule,
  renderCountdownGif,
  type CountdownGlyphs,
  type Mask,
} from './countdownGif'

const solid = (width: number, height: number, value: number): Mask => ({
  width,
  height,
  alpha: new Uint8Array(width * height).fill(value),
})

/** Digit d is a flat block of coverage d * 20, so a frame shows which digit went where. */
const fakeGlyphs: CountdownGlyphs = {
  digits: Array.from({ length: 10 }, (_, d) => solid(DIGIT_CELL.width, DIGIT_CELL.height, d * 20 + 20)),
  labels: solid(COUNTDOWN_WIDTH, LABEL_STRIP.height, 0),
}

const SECOND = 1000
const DAY = 86_400 * SECOND

describe('countdownParts', () => {
  it('splits the time left into days, hours, minutes and seconds', () => {
    const remaining = 7 * DAY + 21 * 3600 * SECOND + 59 * 60 * SECOND + 57 * SECOND
    expect(countdownParts(remaining)).toEqual({ days: 7, hours: 21, minutes: 59, seconds: 57 })
  })

  it('reads zero once the target is reached or passed', () => {
    expect(countdownParts(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    expect(countdownParts(-5 * SECOND)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('stays at 99 days 23:59:59 for a target further away than two digits can show', () => {
    expect(countdownParts(400 * DAY)).toEqual({ days: 99, hours: 23, minutes: 59, seconds: 59 })
  })

  it('drops a partial second', () => {
    expect(countdownParts(61_999)).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 1 })
  })
})

describe('frameSchedule', () => {
  it('counts down one second per frame from now', () => {
    const now = Date.UTC(2026, 10, 23, 8, 0, 0)
    const target = Date.UTC(2026, 11, 1, 6, 0, 0)

    const frames = frameSchedule(target, now)

    expect(frames).toHaveLength(COUNTDOWN_FRAMES)
    expect(frames[0]).toEqual({ days: 7, hours: 22, minutes: 0, seconds: 0 })
    expect(frames[1]).toEqual({ days: 7, hours: 21, minutes: 59, seconds: 59 })
  })

  it('holds zero when the target passes during the animation', () => {
    const now = 1_000_000
    const frames = frameSchedule(now + 2 * SECOND, now)

    expect(frames[2]).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    expect(frames[COUNTDOWN_FRAMES - 1]).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('composeFrame', () => {
  const pixel = (frame: Buffer, x: number, y: number) => {
    const offset = (y * COUNTDOWN_WIDTH + x) * 4
    return [frame[offset], frame[offset + 1], frame[offset + 2]]
  }

  it('fills the frame with the dark background and draws the digits of each column', () => {
    const frame = composeFrame(fakeGlyphs, { days: 7, hours: 21, minutes: 59, seconds: 57 })

    expect(frame).toHaveLength(COUNTDOWN_WIDTH * COUNTDOWN_HEIGHT * 4)
    expect(pixel(frame, 2, COUNTDOWN_HEIGHT - 2)).toEqual([20, 20, 20])

    // Column 0 is centered on x=75: tens digit in [31, 75), units digit in [75, 119).
    const tens = pixel(frame, 50, 40)[0]
    const units = pixel(frame, 100, 40)[0]
    const [, tensZeroCheck] = [tens, pixel(composeFrame(fakeGlyphs, { days: 17, hours: 0, minutes: 0, seconds: 0 }), 50, 40)[0]]
    expect(units).not.toBe(tens)
    expect(tensZeroCheck).not.toBe(tens)
  })

  it('draws seconds in green and the other columns in white', () => {
    const frame = composeFrame(fakeGlyphs, { days: 99, hours: 99, minutes: 99, seconds: 99 })

    const [r1, g1, b1] = pixel(frame, 100, 40)
    const [r4, g4, b4] = pixel(frame, 550, 40)
    expect(r1).toBe(g1)
    expect(g1).toBe(b1)
    expect(g4).toBeGreaterThan(r4)
    expect(g4).toBeGreaterThan(b4)
  })
})

describe('renderCountdownGif', () => {
  it('produces one animated GIF lasting one second per frame, played once', async () => {
    const gif = await renderCountdownGif(fakeGlyphs, Date.UTC(2026, 11, 1, 6), Date.UTC(2026, 10, 23, 8))
    const meta = await sharp(gif, { animated: true }).metadata()

    expect(meta.format).toBe('gif')
    expect(meta.pages).toBeGreaterThan(1)
    expect(meta.width).toBe(COUNTDOWN_WIDTH)
    expect(meta.pageHeight).toBe(COUNTDOWN_HEIGHT)
    // The encoder may merge two frames that look the same, so the length is checked in time, not in frames.
    expect(meta.delay?.reduce((sum, delay) => sum + delay, 0)).toBe(COUNTDOWN_FRAMES * SECOND)
    expect(gif.length).toBeLessThan(300_000)
  })
})

describe('countdownAltText', () => {
  it('says the opening in words for clients that do not load the image', () => {
    expect(countdownAltText('mardi 1er décembre à 7h00')).toBe('Ouverture de la billetterie mardi 1er décembre à 7h00')
  })
})
