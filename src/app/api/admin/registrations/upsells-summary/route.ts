import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { extractSpecBreakdown } from '@/lib/upsells/meta'

export interface UpsellSummaryRow {
  name: string
  quantity: number
  total_cents: number
  currency: string
  specs_breakdown?: Array<{ label: string; quantity: number }>
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    const admin = supabaseAdmin()

    // Fetch all registration_upsells rows, optionally filtered by event
    let query = admin
      .from('registration_upsells')
      .select('name, price_cents, quantity, currency, meta, registration_id, registrations!inner(event_id)')

    if (eventId) {
      query = query.eq('registrations.event_id', eventId)
    }

    const { data: rows, error } = await query

    if (error) {
      // Environments missing the upsell table should not break admin dashboard.
      if ((error as any)?.code === 'PGRST205') {
        return NextResponse.json({ summary: [] })
      }
      throw error
    }

    // Aggregate in JS: group by (name, currency)
    const map = new Map<string, UpsellSummaryRow>()
    const specsMap = new Map<string, Map<string, number>>()
    for (const row of rows ?? []) {
      const key = `${row.name}|||${row.currency}`
      const quantity = Number(row.quantity ?? 1)
      const existing = map.get(key)
      if (existing) {
        existing.quantity += quantity
        existing.total_cents += (row.price_cents ?? 0) * quantity
      } else {
        map.set(key, {
          name: row.name,
          quantity,
          total_cents: (row.price_cents ?? 0) * quantity,
          currency: row.currency ?? 'eur',
        })
      }

      const specBreakdown = extractSpecBreakdown((row as any).meta, quantity)
      if (specBreakdown.length > 0) {
        if (!specsMap.has(key)) specsMap.set(key, new Map())
        const bucket = specsMap.get(key)!
        for (const item of specBreakdown) {
          bucket.set(item.label, (bucket.get(item.label) ?? 0) + item.quantity)
        }
      }
    }

    const summary = Array.from(map.entries())
      .map(([key, base]) => {
        const breakdownBucket = specsMap.get(key)
        const specsBreakdown = breakdownBucket
          ? Array.from(breakdownBucket.entries())
              .map(([label, quantity]) => ({ label, quantity }))
              .sort((a, b) => b.quantity - a.quantity || a.label.localeCompare(b.label))
          : []
        return {
          ...base,
          ...(specsBreakdown.length > 0 ? { specs_breakdown: specsBreakdown } : {}),
        }
      })
      .sort((a, b) => b.quantity - a.quantity)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('[upsells-summary] error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
