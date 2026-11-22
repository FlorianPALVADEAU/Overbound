import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { renderCountdownGif } from '@/lib/email/countdownGif'
import { loadCountdownGlyphs } from '@/lib/email/countdownGlyphs'

export const runtime = 'nodejs'
export const maxDuration = 15

const querySchema = z.object({ event: z.string().regex(/^[a-z0-9-]{1,80}$/) })

/**
 * Countdown banner of the "ticket sales open" mail: GIF counting down to the event's `sales_start`.
 * The target comes from the event row, not from the URL, so the only URLs that render are real events
 * and the CDN copy (20 s) absorbs the opens. Mail clients that pre-load images (Apple Mail privacy
 * protection) show the time left at delivery.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({ event: request.nextUrl.searchParams.get('event') })
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_event' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin()
    .from('events')
    .select('sales_start')
    .eq('slug', parsed.data.event)
    .maybeSingle()

  if (error) {
    console.error('[countdown gif] event read failed', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
  if (!data?.sales_start) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const target = new Date(data.sales_start).getTime()
  if (Number.isNaN(target)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  try {
    const gif = await renderCountdownGif(await loadCountdownGlyphs(), target, Date.now())
    return new Response(new Uint8Array(gif), {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=0, s-maxage=20',
      },
    })
  } catch (renderError) {
    console.error('[countdown gif] render failed', renderError)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
