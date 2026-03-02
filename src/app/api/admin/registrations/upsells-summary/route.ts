import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export interface UpsellSummaryRow {
  name: string
  quantity: number
  total_cents: number
  currency: string
  specs_breakdown?: Array<{ label: string; quantity: number }>
}

const humanizeMetaKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())

const extractSpecLabels = (meta: unknown): string[] => {
  if (!meta || typeof meta !== 'object') return []
  const entries = Object.entries(meta as Record<string, unknown>)
  const labels: string[] = []
  for (const [key, value] of entries) {
    if (value === null || value === undefined) continue
    if (key === 'sizes' && Array.isArray(value)) {
      for (const size of value) {
        if (typeof size === 'string' && size.trim().length > 0) {
          labels.push(`Taille ${size.trim()}`)
        }
      }
      continue
    }
    if (key === 'size' && typeof value === 'string' && value.trim().length > 0) {
      labels.push(`Taille ${value.trim()}`)
      continue
    }
    if (Array.isArray(value)) {
      const serialized = value.map((entry) => String(entry)).join(', ')
      if (serialized.length > 0) labels.push(`${humanizeMetaKey(key)}: ${serialized}`)
      continue
    }
    if (typeof value === 'object') continue
    labels.push(`${humanizeMetaKey(key)}: ${String(value)}`)
  }
  return labels
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

      const specLabels = extractSpecLabels((row as any).meta)
      if (specLabels.length > 0) {
        if (!specsMap.has(key)) specsMap.set(key, new Map())
        const bucket = specsMap.get(key)!
        for (const label of specLabels) {
          bucket.set(label, (bucket.get(label) ?? 0) + quantity)
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
