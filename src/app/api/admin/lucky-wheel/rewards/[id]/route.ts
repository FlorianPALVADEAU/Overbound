import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  assertTargetUpsellReachableForCampaign,
  requiresTargetUpsell,
  TargetUpsellNotReachableError,
} from '@/lib/luckyWheel/rewardTargeting'

// PRODUCT_DISCOUNT/PHOTO_DISCOUNT kept in the enum so a legacy row can
// still be PUT (e.g. to correct it into a *_PERCENT_/*_FIXED_ variant --
// exactly the fix path a misconfigured reward needs, see redemption.ts
// header, 2026-09-27). Saving a reward that STAYS on one of these two
// unsuffixed types is rejected below.
const REWARD_TYPES = [
  'TICKET_PERCENT_DISCOUNT',
  'TICKET_FIXED_DISCOUNT',
  'FREE_TICKET',
  'FREE_PRODUCT',
  'PRODUCT_DISCOUNT',
  'PHOTO_DISCOUNT',
  'FREE_PHOTO_PACK',
  'CUSTOM',
  'PRODUCT_PERCENT_DISCOUNT',
  'PRODUCT_FIXED_DISCOUNT',
  'PHOTO_PERCENT_DISCOUNT',
  'PHOTO_FIXED_DISCOUNT',
] as const

const LEGACY_AMBIGUOUS_REWARD_TYPES = new Set(['PRODUCT_DISCOUNT', 'PHOTO_DISCOUNT'])

const COMMERCIAL_PHASES = ['LAUNCH', 'STANDARD', 'HIGH_DEMAND'] as const

const rewardSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(REWARD_TYPES),
  weight: z.number().nonnegative().nullable().optional(),
  probability: z.number().min(0).max(1).nullable().optional(),
  stock: z.number().int().nonnegative().nullable().optional(),
  max_wins: z.number().int().nonnegative().nullable().optional(),
  public_value: z.number().nullable().optional(),
  estimated_cost: z.number().nullable().optional(),
  minimum_basket: z.number().nullable().optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  commercial_phases: z.array(z.enum(COMMERCIAL_PHASES)).min(1).optional(),
  enabled: z.boolean().optional(),
  image_url: z.string().url().nullable().optional(),
  // FDR-0014 addendum §3.1: required for PRODUCT_DISCOUNT/PHOTO_DISCOUNT
  // (enforced below, campaign_id comes from the existing row since PUT
  // never carries it), null/absent for every other reward type.
  target_upsell_id: z.string().uuid().nullable().optional(),
})

function sanitizePayload(body: z.infer<typeof rewardSchema>) {
  return {
    name: body.name,
    type: body.type,
    weight: body.weight ?? null,
    probability: body.probability ?? null,
    stock: body.stock ?? null,
    max_wins: body.max_wins ?? null,
    public_value: body.public_value ?? null,
    estimated_cost: body.estimated_cost ?? null,
    minimum_basket: body.minimum_basket ?? null,
    valid_from: body.valid_from ?? null,
    valid_until: body.valid_until ?? null,
    commercial_phases: body.commercial_phases ?? ['LAUNCH', 'STANDARD', 'HIGH_DEMAND'],
    enabled: body.enabled ?? true,
    image_url: body.image_url ?? null,
    target_upsell_id: body.target_upsell_id ?? null,
    updated_at: new Date().toISOString(),
  }
}

const handlePut = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const parsed = rewardSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // A reward may not be *saved* on an ambiguous unsuffixed type -- but
    // this is the exact PUT that corrects one into a *_PERCENT_/*_FIXED_
    // variant, so this only rejects staying on the old type, not editing
    // away from it.
    if (LEGACY_AMBIGUOUS_REWARD_TYPES.has(parsed.data.type)) {
      return NextResponse.json(
        {
          error:
            "Ce type de récompense est ambigu (pourcentage ou montant fixe ?). Choisissez la variante % ou montant avant d'enregistrer.",
        },
        { status: 400 },
      )
    }

    if (requiresTargetUpsell(parsed.data.type)) {
      if (!parsed.data.target_upsell_id) {
        return NextResponse.json(
          { error: 'target_upsell_id est requis pour ce type de récompense.' },
          { status: 400 },
        )
      }

      const { data: existingReward, error: existingRewardError } = await admin
        .from('lucky_wheel_rewards')
        .select('campaign_id')
        .eq('id', id)
        .maybeSingle()

      if (existingRewardError) throw existingRewardError
      if (!existingReward) {
        return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 })
      }

      try {
        await assertTargetUpsellReachableForCampaign({
          admin,
          rewardType: parsed.data.type,
          campaignId: existingReward.campaign_id,
          targetUpsellId: parsed.data.target_upsell_id,
        })
      } catch (validationError) {
        if (validationError instanceof TargetUpsellNotReachableError) {
          return NextResponse.json(
            { error: "Ce produit n'est vendu sur aucun événement lié à la campagne." },
            { status: 422 },
          )
        }
        throw validationError
      }
    }

    const { data: reward, error } = await admin
      .from('lucky_wheel_rewards')
      .update(sanitizePayload(parsed.data))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ reward })
  } catch (error) {
    console.error('Erreur PUT lucky wheel reward:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handleDelete = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const admin = supabaseAdmin()

    const { error } = await admin.from('lucky_wheel_rewards').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE lucky wheel reward:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour récompense Lucky Wheel',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression récompense Lucky Wheel',
})
