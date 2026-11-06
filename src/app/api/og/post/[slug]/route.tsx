/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'
import { loadPostBySlug } from '@/lib/blog/loadPosts'

// Blog posts are now filesystem content (MDX), read with Node's fs module:
// the edge runtime cannot access the filesystem, so this route runs on Node.

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params

  const post = loadPostBySlug(slug)
  const title = post?.title || 'OverBound'

  const logo = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'}/images/brand/totem_logo.png`

  return new ImageResponse(
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
      <img src={logo} width={160} height={160} style={{ opacity: 0.9 }} alt="OverBound" />
      <div style={{ fontSize: 64, color: 'white', fontWeight: 800, lineHeight: 1.1 }}>
        {title}
      </div>
      <div style={{ color: '#9CA3AF' }}>overbound-race.com</div>
    </div>,
    { width: 1200, height: 630 }
  )
}

