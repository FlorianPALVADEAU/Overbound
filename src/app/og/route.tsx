import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'
import sharp from 'sharp'
import { isOgPhotoKey, OG_PHOTOS } from '@/constants/coverImages'
import { OG_SIZE } from '@/lib/seo/ogImage'

export const runtime = 'nodejs'

const MAX_TITLE = 80
const MAX_KICKER = 40

const loadFont = () => readFile(path.join(process.cwd(), 'src/assets/fonts/BarlowCondensed-ExtraBold.ttf'))

const toDataUri = async (file: string, mime: string) => {
  const bytes = await readFile(path.join(process.cwd(), 'public', file))
  return `data:${mime};base64,${bytes.toString('base64')}`
}

/** Share card: photo, dark gradient for contrast, logo, kicker and title. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = (searchParams.get('title') || 'Overbound').slice(0, MAX_TITLE)
  const kicker = (searchParams.get('kicker') || 'Course à obstacles en boucles').slice(0, MAX_KICKER)
  const requestedPhoto = searchParams.get('photo')
  const photoKey = isOgPhotoKey(requestedPhoto) ? requestedPhoto : 'crowd'

  const [photo, logo, font] = await Promise.all([
    toDataUri(OG_PHOTOS[photoKey], 'image/jpeg'),
    toDataUri('images/brand/totem_logo_white.png', 'image/png'),
    loadFont(),
  ])

  const card = new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', background: '#141414', fontFamily: 'Barlow Condensed' }}>
        <img src={photo} alt="" width={OG_SIZE.width} height={OG_SIZE.height} style={{ position: 'absolute', inset: 0, objectFit: 'cover' }} />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: OG_SIZE.width,
            height: OG_SIZE.height,
            display: 'flex',
            backgroundImage: 'linear-gradient(90deg, rgba(20,20,20,0.94) 0%, rgba(20,20,20,0.78) 50%, rgba(20,20,20,0.15) 100%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64, width: 760 }}>
          <img src={logo} alt="" width={96} height={96} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 34, letterSpacing: 5, textTransform: 'uppercase', color: '#26AA26', fontWeight: 700 }}>
              {kicker}
            </div>
            <div style={{ display: 'flex', marginTop: 16, fontSize: 104, lineHeight: 1, textTransform: 'uppercase', color: '#ffffff', fontWeight: 800 }}>
              {title}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: 'Barlow Condensed', data: font, weight: 800, style: 'normal' }] },
  )

  // The renderer only outputs PNG (~1 MB with a photo); messaging apps want a light JPEG.
  const jpeg = await sharp(Buffer.from(await card.arrayBuffer())).jpeg({ quality: 80, progressive: true }).toBuffer()
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400',
    },
  })
}
