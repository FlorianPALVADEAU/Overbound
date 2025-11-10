import React from 'react'
import { ImageResponse } from 'next/og'
import { client } from '@/sanity/lib/client'
import { postBySlugQuery } from '@/sanity/lib/queries'

export const runtime = 'edge'

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const post = await client.fetch(postBySlugQuery, { slug })
  const title: string = post?.title || 'OverBound'

  const logo = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'}/images/totem_logo.png`

  const element = React.createElement(
    'div',
    {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        background: 'linear-gradient(135deg,#0B1220,#1F2937)'
      }
    },
    React.createElement('img', { src: logo, width: 160, height: 160, style: { opacity: 0.9 } }),
    React.createElement(
      'div',
      { style: { fontSize: 64, color: 'white', fontWeight: 800, lineHeight: 1.1 } },
      title
    ),
    React.createElement('div', { style: { color: '#9CA3AF' } }, 'overbound-race.com')
  )

  return new ImageResponse(element, { width: 1200, height: 630 })
}

