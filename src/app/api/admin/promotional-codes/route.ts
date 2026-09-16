import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const createPromotionalCodeSchema = z
  .object({
    code: z.string().min(1, 'Champs obligatoires manquants'),
    name: z.string().min(1, 'Champs obligatoires manquants'),
    description: z.string().nullable().optional(),
    discount_percent: z.number().nullable().optional(),
    discount_amount: z.number().nullable().optional(),
    currency: z.string().optional(),
    valid_from: z.string().min(1, 'Champs obligatoires manquants'),
    valid_until: z.string().min(1, 'Champs obligatoires manquants'),
    usage_limit: z.number().nullable().optional(),
    is_active: z.boolean().optional(),
    tier_order: z.number().nullable().optional(),
    auto_activate: z.boolean().optional(),
    event_ids: z.array(z.string()).optional(),
  })
  .superRefine((payload, ctx) => {
    const { discount_percent, discount_amount } = payload
    if ((discount_percent && discount_amount) || (!discount_percent && !discount_amount)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Spécifiez soit un pourcentage, soit un montant de réduction.',
      })
    }
    if (discount_percent && (discount_percent < 0 || discount_percent > 100)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Le pourcentage de réduction doit être compris entre 0 et 100.',
      })
    }
    if (discount_amount && discount_amount < 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Le montant de réduction doit être positif.',
      })
    }
  })

function sanitizePayload(body: z.infer<typeof createPromotionalCodeSchema>) {
  return {
    code: body.code,
    name: body.name,
    description: body.description || null,
    discount_percent: body.discount_percent ?? null,
    discount_amount: body.discount_amount ?? null,
    currency: body.currency || 'eur',
    valid_from: body.valid_from,
    valid_until: body.valid_until,
    usage_limit: body.usage_limit ?? null,
    is_active: body.is_active ?? true,
    tier_order: body.tier_order ?? null,
    auto_activate: body.auto_activate ?? false,
  }
}

async function fetchPromotionalCode(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('promotional_codes')
    .select(
      `*,
      events:promotional_code_events(event_id)`
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = await createSupabaseServer()
    const { data: promotionalCodes, error: fetchError } = await supabase
      .from('promotional_codes')
      .select(
        `*,
        events:promotional_code_events(event_id)`
      )
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    return NextResponse.json({ promotionalCodes })
  } catch (error) {
    console.error('Erreur GET promotional codes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const parsed = createPromotionalCodeSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }
    const payload = parsed.data

    const admin = supabaseAdmin()
    const insertPayload = sanitizePayload(payload)

    const { data: promotionalCode, error: insertError } = await admin
      .from('promotional_codes')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Ce code promotionnel existe déjà' }, { status: 409 })
      }
      throw insertError
    }

    const eventIds: string[] = payload.event_ids || []
    if (eventIds.length > 0) {
      const { error: linkError } = await admin.from('promotional_code_events').insert(
        eventIds.map((eventId) => ({ promotional_code_id: promotionalCode.id, event_id: eventId }))
      )
      if (linkError) throw linkError
    }

    const data = await fetchPromotionalCode(promotionalCode.id)

    return NextResponse.json({ promotionalCode: data })
  } catch (error) {
    console.error('Erreur POST promotional code:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création code promo admin',
})
