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

function sanitizePayload(body: any) {
  return {
    name: body.name,
    description: body.description || null,
    price_cents: body.price_cents,
    currency: body.currency || 'eur',
    type: body.type,
    event_id: body.event_id || null,
    is_active: body.is_active ?? true,
    stock_quantity: body.stock_quantity ?? null,
    image_url: body.image_url || null,
    updated_at: new Date().toISOString(),
  }
}

async function fetchUpsell(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('upsells')
    .select(
      `*,
      event:events(id, title, date)`
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
    if (!payload.name || payload.price_cents === undefined || !payload.type) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const updatePayload = sanitizePayload(payload)

    const { data: upsell, error: updateError } = await admin
      .from('upsells')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const data = await fetchUpsell(upsell.id)
    return NextResponse.json({ upsell: data })
  } catch (error) {
    console.error('Erreur PUT upsell:', error)
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
      .from('upsells')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE upsell:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
