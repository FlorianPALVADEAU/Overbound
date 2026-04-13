import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const NON_CUMULABLE_WITH_TIER_CODES = new Set(['JUOFF30'])

const hasAmbassadorLink = (value: unknown) => {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value && typeof value === 'object')
}

export async function POST(request: NextRequest) {
  try {
    const { code, eventId, existingCodes } = await request.json()

    if (!code || !eventId) {
      return NextResponse.json({ error: 'Code promo ou événement manquant.' }, { status: 400 })
    }

    const normalizedCode = String(code).trim().toUpperCase()

    const normalizedExistingCodes = Array.isArray(existingCodes)
      ? existingCodes
          .map((value) => String(value ?? '').trim().toUpperCase())
          .filter((value) => value.length > 0)
      : []

    const uniqueExistingCodes = [...new Set(normalizedExistingCodes)]
    if (uniqueExistingCodes.length >= 2) {
      return NextResponse.json({ error: 'Vous avez déjà atteint la limite de 2 codes promo.' }, { status: 409 })
    }
    if (uniqueExistingCodes.includes(normalizedCode)) {
      return NextResponse.json({ error: 'Ce code promo est déjà appliqué.' }, { status: 409 })
    }

    const admin = supabaseAdmin()

    const { data: promotionalCode, error } = await admin
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
        events:promotional_code_events(event_id),
        ambassadors:ambassadors(id)
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

    if (NON_CUMULABLE_WITH_TIER_CODES.has(normalizedCode)) {
      const { data: eventPriceTiers, error: tierError } = await admin
        .from('event_price_tiers')
        .select('discount_percentage, available_from, available_until, display_order')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true })

      if (tierError) {
        return NextResponse.json({ error: 'Impossible de vérifier le palier tarifaire actif.' }, { status: 500 })
      }

      const nowTime = Date.now()
      const activeTier = (eventPriceTiers || []).find((tier) => {
        const startTime = tier.available_from ? new Date(tier.available_from).getTime() : 0
        const endTime = tier.available_until ? new Date(tier.available_until).getTime() : Infinity
        return nowTime >= startTime && nowTime < endTime
      })

      const activeTierDiscount = Number(activeTier?.discount_percentage || 0)
      const promoPercent = Number(promotionalCode.discount_percent || 0)

      if (promoPercent > 0 && activeTierDiscount >= promoPercent) {
        return NextResponse.json(
          { error: 'Ce code promo ne peut pas être cumulé avec le palier actuel, déjà plus avantageux.' },
          { status: 409 },
        )
      }
    }

    if (uniqueExistingCodes.length > 0) {
      const { data: existingPromoRows, error: existingPromoError } = await admin
        .from('promotional_codes')
        .select('code, ambassadors:ambassadors(id)')
        .in('code', uniqueExistingCodes)

      if (existingPromoError) {
        return NextResponse.json({ error: 'Impossible de vérifier les codes déjà appliqués.' }, { status: 500 })
      }

      let ambassadorCount = 0
      let regularCount = 0

      for (const existingPromo of existingPromoRows || []) {
        if (hasAmbassadorLink((existingPromo as { ambassadors?: unknown }).ambassadors)) {
          ambassadorCount += 1
        } else {
          regularCount += 1
        }
      }

      const isIncomingAmbassador = hasAmbassadorLink((promotionalCode as { ambassadors?: unknown }).ambassadors)
      if (isIncomingAmbassador && ambassadorCount >= 1) {
        return NextResponse.json(
          { error: 'Un seul code ambassadeur peut être appliqué par commande.' },
          { status: 409 },
        )
      }
      if (!isIncomingAmbassador && regularCount >= 1) {
        return NextResponse.json(
          { error: 'Un seul code promo standard peut être appliqué par commande.' },
          { status: 409 },
        )
      }
    }

    return NextResponse.json({
      promotionalCode: {
        id: promotionalCode.id,
        code: promotionalCode.code,
        description: promotionalCode.description,
        discount_percent: promotionalCode.discount_percent,
        discount_amount: promotionalCode.discount_amount,
        currency: promotionalCode.currency,
        is_ambassador: hasAmbassadorLink((promotionalCode as { ambassadors?: unknown }).ambassadors),
      },
    })
  } catch (error) {
    console.error('Erreur validation code promo:', error)
    return NextResponse.json({ error: 'Impossible de valider le code promo.' }, { status: 500 })
  }
}
