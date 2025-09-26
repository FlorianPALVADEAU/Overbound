import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { code, eventId } = await request.json()

    if (!code || !eventId) {
      return NextResponse.json({ error: 'Code promo ou événement manquant.' }, { status: 400 })
    }

    const normalizedCode = String(code).trim().toUpperCase()

    const supabase = await createSupabaseServer()

    const { data: promotionalCode, error } = await supabase
      .from('promotional_codes')
      .select(
        `
        id,
        code,
        description,
        discount_percent,
        discount_amount,
        currency,
        valid_from,
        valid_until,
        is_active,
        usage_limit,
        used_count,
        events:promotional_code_events(event_id)
      `,
      )
      .ilike('code', normalizedCode)
      .maybeSingle()

    if (error || !promotionalCode) {
      return NextResponse.json({ error: 'Code promo introuvable ou expiré.' }, { status: 404 })
    }

    const now = new Date()
    const validFrom = promotionalCode.valid_from ? new Date(promotionalCode.valid_from) : null
    const validUntil = promotionalCode.valid_until ? new Date(promotionalCode.valid_until) : null

    if (!promotionalCode.is_active) {
      return NextResponse.json({ error: 'Ce code promo est inactif.' }, { status: 410 })
    }

    if (validFrom && now < validFrom) {
      return NextResponse.json({ error: 'Ce code promo n’est pas encore valide.' }, { status: 409 })
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json({ error: 'Ce code promo est expiré.' }, { status: 410 })
    }

    if (
      promotionalCode.usage_limit !== null &&
      typeof promotionalCode.usage_limit === 'number' &&
      promotionalCode.used_count >= promotionalCode.usage_limit
    ) {
      return NextResponse.json({ error: 'Ce code promo a atteint sa limite d’utilisation.' }, { status: 409 })
    }

    const allowedEvents = (promotionalCode.events || []).map((event: { event_id: string }) => event.event_id)
    if (allowedEvents.length > 0 && !allowedEvents.includes(eventId)) {
      return NextResponse.json({ error: 'Ce code promo ne s’applique pas à cet événement.' }, { status: 403 })
    }

    return NextResponse.json({
      promotionalCode: {
        id: promotionalCode.id,
        code: promotionalCode.code,
        description: promotionalCode.description,
        discount_percent: promotionalCode.discount_percent,
        discount_amount: promotionalCode.discount_amount,
        currency: promotionalCode.currency,
      },
    })
  } catch (error) {
    console.error('Erreur validation code promo:', error)
    return NextResponse.json({ error: 'Impossible de valider le code promo.' }, { status: 500 })
  }
}
