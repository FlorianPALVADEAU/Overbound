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

// PRODUCT_DISCOUNT/PHOTO_DISCOUNT kept in the enum for backward
// compatibility with rows already saved under them (2026-09-27: replaced
// by explicit PRODUCT_PERCENT_DISCOUNT/PRODUCT_FIXED_DISCOUNT/
// PHOTO_PERCENT_DISCOUNT/PHOTO_FIXED_DISCOUNT after a real reward's unit
// was misread -- see redemption.ts header). Writing a *new* reward with
// the unsuffixed type is rejected below, not by Zod: the admin form no
// longer offers them, but a legacy row must still parse on GET.
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
const pageQuerySchema = z.object({ paginated: z.coerce.boolean().optional(), cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(25) })
const decodeCursor = (value: string | undefined) => { if (!value) return 0; try { const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { offset?: number }; return Number.isInteger(parsed.offset) && (parsed.offset ?? 0) >= 0 ? parsed.offset ?? 0 : null } catch { return null } }
const encodeCursor = (offset: number) => Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url')

// FDR-0014 §5/§10: reward config, fully admin-editable. weight/probability,
// stock/maxWins are optional -- null/undefined means unlimited (§4).
const rewardSchema = z.object({
  campaign_id: z.string().uuid('campaign_id invalide'),
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
  // (enforced below, not here -- validity depends on `type`, which Zod's
  // per-field validation can't cross-reference cleanly), null/absent for
  // every other reward type.
  target_upsell_id: z.string().uuid().nullable().optional(),
})

function sanitizePayload(body: z.infer<typeof rewardSchema>) {
  return {
    campaign_id: body.campaign_id,
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
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const url = new URL(request.url)
    const campaignId = url.searchParams.get('campaign_id')
    const parsedPage = pageQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
    if (!parsedPage.success) return NextResponse.json({ error: 'Paramètres de pagination invalides' }, { status: 400 })
    const paginated = parsedPage.data.paginated || url.searchParams.has('cursor') || url.searchParams.has('limit')
    const decodedOffset = decodeCursor(parsedPage.data.cursor)
    if (decodedOffset === null) return NextResponse.json({ error: 'Curseur de pagination invalide' }, { status: 400 })
    const offset = decodedOffset

    const admin = supabaseAdmin()
    let query = admin.from('lucky_wheel_rewards').select('*').order('created_at', { ascending: false })
    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }
    if (paginated) query = query.range(offset, offset + parsedPage.data.limit - 1)

    const { data: rewards, error } = await query
    if (error) throw error

    return NextResponse.json(paginated ? { rewards, page: { limit: parsedPage.data.limit, totalCount: rewards?.length ?? 0, nextCursor: rewards?.length === parsedPage.data.limit ? encodeCursor(offset + (rewards?.length ?? 0)) : null } } : { rewards })
  } catch (error) {
    console.error('Erreur GET lucky wheel rewards:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const parsed = rewardSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // FDR-0014 addendum, corrected 2026-09-27: unsuffixed PRODUCT_DISCOUNT/
    // PHOTO_DISCOUNT are ambiguous (percent or fixed amount?) and caused a
    // real misapplied discount -- no new reward may be created with them,
    // even though the enum still parses them for legacy rows.
    if (LEGACY_AMBIGUOUS_REWARD_TYPES.has(parsed.data.type)) {
      return NextResponse.json(
        {
          error:
            "Ce type de récompense est ambigu (pourcentage ou montant fixe ?) et n'est plus utilisable pour une nouvelle récompense. Choisissez la variante % ou montant.",
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
    }

    try {
      await assertTargetUpsellReachableForCampaign({
        admin,
        rewardType: parsed.data.type,
        campaignId: parsed.data.campaign_id,
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

    const { data: reward, error } = await admin
      .from('lucky_wheel_rewards')
      .insert(sanitizePayload(parsed.data))
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ reward }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST lucky wheel reward:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création récompense Lucky Wheel',
})
