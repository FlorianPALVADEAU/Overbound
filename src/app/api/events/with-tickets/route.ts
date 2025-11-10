import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      tickets:tickets(
        id,
        event_id,
        name,
        distance_km,
        final_price_cents,
        sales_start,
        sales_end,
        external_ticket_id,
        external_price_name,
        race_id,
        max_participants,
        requires_document,
        document_types,
        created_at,
        updated_at,
        description,
        currency
      ),
      price_tiers:event_price_tiers(*)
    `)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
