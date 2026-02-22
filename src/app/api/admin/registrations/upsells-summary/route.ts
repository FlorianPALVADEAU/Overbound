import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export interface UpsellSummaryRow {
  name: string
  quantity: number
  total_cents: number
  currency: string
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    const admin = supabaseAdmin()

    // Fetch all registration_upsells rows, optionally filtered by event
    let query = admin
      .from('registration_upsells')
      .select('name, price_cents, currency, registration_id, registrations!inner(event_id)')

    if (eventId) {
      query = query.eq('registrations.event_id', eventId)
    }

    const { data: rows, error } = await query

    if (error) throw error

    // Aggregate in JS: group by (name, currency)
    const map = new Map<string, UpsellSummaryRow>()
    for (const row of rows ?? []) {
      const key = `${row.name}|||${row.currency}`
      const existing = map.get(key)
      if (existing) {
        existing.quantity += 1
        existing.total_cents += row.price_cents ?? 0
      } else {
        map.set(key, {
          name: row.name,
          quantity: 1,
          total_cents: row.price_cents ?? 0,
          currency: row.currency ?? 'eur',
        })
      }
    }

    const summary = Array.from(map.values()).sort((a, b) => b.quantity - a.quantity)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('[upsells-summary] error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
