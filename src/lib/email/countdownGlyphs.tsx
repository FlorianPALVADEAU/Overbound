import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import {
  COUNTDOWN_WIDTH,
  DIGIT_CELL,
  LABEL_STRIP,
  type CountdownGlyphs,
  type Mask,
} from '@/lib/email/countdownGif'

const FONT_NAME = 'Barlow Condensed'
const LABELS = ['JOURS', 'HEURES', 'MIN', 'SEC']

const loadFont = () => readFile(path.join(process.cwd(), 'src/assets/fonts/BarlowCondensed-ExtraBold.ttf'))

/** White text on black comes back as PNG; the red channel is the coverage of each pixel. */
async function toMask(png: ArrayBuffer): Promise<Mask> {
  const { data, info } = await sharp(Buffer.from(png)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const alpha = new Uint8Array(info.width * info.height)
  for (let i = 0; i < alpha.length; i += 1) {
    alpha[i] = data[i * info.channels]
  }
  return { width: info.width, height: info.height, alpha }
}

async function cropColumns(mask: Mask, cellWidth: number, count: number): Promise<Mask[]> {
  return Array.from({ length: count }, (_, index) => {
    const alpha = new Uint8Array(cellWidth * mask.height)
    for (let y = 0; y < mask.height; y += 1) {
      for (let x = 0; x < cellWidth; x += 1) {
        alpha[y * cellWidth + x] = mask.alpha[y * mask.width + index * cellWidth + x]
      }
    }
    return { width: cellWidth, height: mask.height, alpha }
  })
}

async function renderGlyphs(): Promise<CountdownGlyphs> {
  const font = await loadFont()
  const fonts = [{ name: FONT_NAME, data: font, weight: 800 as const, style: 'normal' as const }]
  const frame = { display: 'flex', background: '#000000', color: '#ffffff', fontFamily: FONT_NAME, fontWeight: 800 }

  const digitSheet = await new ImageResponse(
    (
      <div style={{ ...frame, width: DIGIT_CELL.width * 10, height: DIGIT_CELL.height }}>
        {Array.from({ length: 10 }, (_, digit) => (
          <div
            key={digit}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: DIGIT_CELL.width,
              height: DIGIT_CELL.height,
              fontSize: 84,
            }}
          >
            {digit}
          </div>
        ))}
      </div>
    ),
    { width: DIGIT_CELL.width * 10, height: DIGIT_CELL.height, fonts },
  ).arrayBuffer()

  const labelStrip = await new ImageResponse(
    (
      <div style={{ ...frame, width: COUNTDOWN_WIDTH, height: LABEL_STRIP.height }}>
        {LABELS.map((label) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: COUNTDOWN_WIDTH / LABELS.length,
              height: LABEL_STRIP.height,
              fontSize: 16,
              letterSpacing: 4,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    ),
    { width: COUNTDOWN_WIDTH, height: LABEL_STRIP.height, fonts },
  ).arrayBuffer()

  return {
    digits: await cropColumns(await toMask(digitSheet), DIGIT_CELL.width, 10),
    labels: await toMask(labelStrip),
  }
}

let cached: Promise<CountdownGlyphs> | null = null

/** Drawn once per server instance: the font does not change between requests. */
export function loadCountdownGlyphs(): Promise<CountdownGlyphs> {
  cached ??= renderGlyphs().catch((error) => {
    cached = null
    throw error
  })
  return cached
}
