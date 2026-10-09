import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { purgeSafetyDataAfterEvents } from '@/lib/legal/purgeSafetyData'

export const runtime = 'nodejs'

/** Daily: deletes health notes and emergency contacts once an event is long over (GDPR minimisation). */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await purgeSafetyDataAfterEvents(supabaseAdmin(), new Date())
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[safety-data-purge-cron] failed', error)
    return NextResponse.json({ ok: false, error: 'purge_failed' }, { status: 500 })
  }
}
