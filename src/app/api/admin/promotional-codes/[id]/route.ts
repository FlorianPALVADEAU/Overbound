import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

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
    updated_at: new Date().toISOString(),
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await ensureAdmin()
    if (error) return error

    const { id } = await params
    const payload = await request.json()
    const validationError = validateDiscount(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const updatePayload = sanitizePayload(payload)

    const { data: promotionalCode, error: updateError } = await admin
      .from('promotional_codes')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const eventIds: string[] = payload.event_ids || []
    const { error: deleteRelationsError } = await admin
      .from('promotional_code_events')
      .delete()
      .eq('promotional_code_id', id)

    if (deleteRelationsError) throw deleteRelationsError

    if (eventIds.length > 0) {
      const { error: insertRelationsError } = await admin.from('promotional_code_events').insert(
        eventIds.map((eventId) => ({ promotional_code_id: promotionalCode.id, event_id: eventId }))
      )
      if (insertRelationsError) throw insertRelationsError
    }

    const data = await fetchPromotionalCode(promotionalCode.id)

    return NextResponse.json({ promotionalCode: data })
  } catch (error) {
    console.error('Erreur PUT promotional code:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await ensureAdmin()
    if (error) return error

    const { id } = await params
    const admin = supabaseAdmin()

    const { error: deleteError } = await admin
      .from('promotional_codes')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE promotional code:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
