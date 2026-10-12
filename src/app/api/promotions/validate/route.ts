import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { checkPromoQuota, hasAmbassadorLink, isTierExclusiveCode, promoRejectionMessage } from '@/lib/orderPricing'


const validateBodySchema = z.object({
  code: z.string().min(1),
  eventId: z.string().uuid(),
  existingCodes: z.array(z.unknown()).optional(),
})


export async function POST(request: NextRequest) {
  try {
    const parsed = validateBodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Code promo ou événement manquant.' }, { status: 400 })
    }
    const { code, eventId, existingCodes } = parsed.data

    const normalizedCode = String(code).trim().toUpperCase()

    const normalizedExistingCodes = Array.isArray(existingCodes)
      ? existingCodes
          .map((value) => String(value ?? '').trim().toUpperCase())
          .filter((value) => value.length > 0)
      : []

    const uniqueExistingCodes = [...new Set(normalizedExistingCodes)]
    if (uniqueExistingCodes.includes(normalizedCode)) {
      return NextResponse.json({ error: 'Ce code promo est déjà appliqué.' }, { status: 409 })
    }
    // FDR-0014 addendum §6: the old flat "2 codes max" cap is replaced by a
    // per-target cap enforced below (max 1 ticket-scoped + max 1
    // product-scoped standard code) -- a code never targets both, so the
    // effective ceiling stays 2 standard codes total, just never 2 of the
    // same target. No blanket count check needed here anymore.

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
        target_upsell_id,
        events:promotional_code_events(event_id),
        ambassadors:ambassadors(id)
      `,
      )
      .ilike('code', normalizedCode)
      .maybeSingle()

    if (error || !promotionalCode) {
      return NextResponse.json({ error: 'Code promo introuvable ou expiré.' }, { status: 404 })
    }

    // FDR-0014 addendum §6: a product-scoped code (target_upsell_id set) is
    // rejected here, explicitly, if the targeted upsell isn't even sold on
    // this event -- distinct from "upsell sold but not selected in the
    // cart", which is a silent 0-discount at pricing time
    // (the order pricing engine), not an error here. An upsell that IS sold
    // on the event but simply not added to the cart yet must still pass
    // this check (the participant may add it after applying the code).
    if (promotionalCode.target_upsell_id) {
      const { data: targetUpsell, error: targetUpsellError } = await admin
        .from('upsells')
        .select('id')
        .eq('id', promotionalCode.target_upsell_id)
        .eq('is_active', true)
        .or(`event_id.eq.${eventId},event_id.is.null`)
        .maybeSingle()

      if (targetUpsellError) {
        return NextResponse.json({ error: 'Impossible de vérifier le produit associé au code.' }, { status: 500 })
      }
      if (!targetUpsell) {
        return NextResponse.json(
          { error: "Ce code n'est pas applicable pour cet événement, aucun produit éligible." },
          { status: 422 },
        )
      }
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

    if (isTierExclusiveCode(normalizedCode)) {
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
        .select('code, target_upsell_id, ambassadors:ambassadors(id)')
        .in('code', uniqueExistingCodes)

      if (existingPromoError) {
        return NextResponse.json({ error: 'Impossible de vérifier les codes déjà appliqués.' }, { status: 500 })
      }

      // Same combination rules as the payment API: the incoming code comes last, so only it can be refused.
      const toQuotaPromo = (row: { code: string; target_upsell_id?: string | null; ambassadors?: unknown }) => ({
        code: row.code,
        targetUpsellId: row.target_upsell_id ?? null,
        isAmbassador: hasAmbassadorLink(row.ambassadors),
      })
      const { rejections } = checkPromoQuota([
        ...(existingPromoRows ?? []).map(toQuotaPromo),
        toQuotaPromo(promotionalCode),
      ])
      const refused = rejections.find((rejection) => rejection.code === promotionalCode.code)
      if (refused) return NextResponse.json({ error: promoRejectionMessage(refused) }, { status: 409 })
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
        target_upsell_id: promotionalCode.target_upsell_id,
      },
    })
  } catch (error) {
    console.error('Erreur validation code promo:', error)
    return NextResponse.json({ error: 'Impossible de valider le code promo.' }, { status: 500 })
  }
}
