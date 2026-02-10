import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notifyEventOpening } from '@/lib/email/eventOpenings'

export const runtime = 'nodejs'

export async function GET() {
  const admin = supabaseAdmin()
  const now = new Date()

  const { data, error } = await admin
    .from('events')
    .update({
      status: 'on_sale',
      updated_at: now.toISOString(),
    })
    .eq('status', 'announced')
    .not('sales_start', 'is', null)
    .lte('sales_start', now.toISOString())
    .gte('date', now.toISOString())
    .select('id')

  if (error) {
    console.error('[event-status-cron] update error', error)
    return NextResponse.json({ ok: false, error: 'update_failed' }, { status: 500 })
  }

  if (data && data.length > 0) {
    await Promise.all(data.map((event) => notifyEventOpening(event.id)))
  }

  return NextResponse.json({ ok: true, updated: data?.length ?? 0 })
}
