import { NextResponse } from 'next/server'
import { loadFeaturedEvent } from '@/lib/events/loadFeaturedEvent'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const featured = await loadFeaturedEvent()
    // Same data for every visitor: shared CDN cache, refreshed every minute.
    return NextResponse.json(featured, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
