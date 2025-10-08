import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

async function ensureAdmin() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { supabase }
}

function validateDiscount(payload: any) {
  const { discount_percent, discount_amount } = payload
  if ((discount_percent && discount_amount) || (!discount_percent && !discount_amount)) {
    return 'Spécifiez soit un pourcentage, soit un montant de réduction.'
  }
  if (discount_percent && (discount_percent < 0 || discount_percent > 100)) {
    return 'Le pourcentage de réduction doit être compris entre 0 et 100.'
  }
  if (discount_amount && discount_amount < 0) {
    return 'Le montant de réduction doit être positif.'
  }
  return null
}

function sanitizePayload(body: any) {
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

export async function GET() {
  try {
    const { error } = await ensureAdmin()
    if (error) return error

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
    const { error } = await ensureAdmin()
    if (error) return error

    const payload = await request.json()
    const validationError = validateDiscount(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (!payload.code || !payload.name || !payload.valid_from || !payload.valid_until) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

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
