import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params

  // Direct Sanity fetch without SDK to reduce bundle size
  let title = 'OverBound'
  try {
    const query = encodeURIComponent(`*[_type == "post" && slug.current == $slug][0]{ title }`)
    const url = `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${process.env.NEXT_PUBLIC_SANITY_DATASET}?query=${query}&$slug="${slug}"`

    const res = await fetch(url)
    const data = await res.json()
    title = data?.result?.title || 'OverBound'
  } catch (e) {
    // Fallback to default title
  }

  const logo = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'}/images/totem_logo.png`

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'linear-gradient(135deg,#0B1220,#1F2937)',
        }}
      >
        <img src={logo} width={160} height={160} style={{ opacity: 0.9 }} />
        <div style={{ fontSize: 64, color: 'white', fontWeight: 800, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ color: '#9CA3AF' }}>overbound-race.com</div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

