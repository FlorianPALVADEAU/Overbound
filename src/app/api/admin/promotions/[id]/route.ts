'use server'

import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { promotionUpdateSchema } from '@/lib/admin/promotionInput'

function sanitizePayload(body: any) {
  const linkText = typeof body.link_text === 'string' && body.link_text.trim().length > 0
    ? body.link_text.trim()
    : "Découvrir l'offre";
  return {
    type: body.type || 'banner',
    title: body.title,
    description: body.description,
    link_url: body.link_url,
    link_text: linkText,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    is_active: body.is_active ?? true,
    popup_config: body.popup_config || null,
    updated_at: new Date().toISOString(),
  }
}

async function fetchPromotion(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('site_promotions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

const handlePut = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const parsed = promotionUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const admin = supabaseAdmin()
    const updatePayload = parsed.data

    const { data: promotion, error: updateError } = await admin
      .from('site_promotions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    const data = await fetchPromotion(promotion.id)
    // The banner is rendered into every page by the root layout.
    revalidatePath('/', 'layout')

    return NextResponse.json({ promotion: data })
  } catch (error) {
    console.error('Erreur PUT promotion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handleDelete = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const admin = supabaseAdmin()

    const { error: deleteError } = await admin.from('site_promotions').delete().eq('id', id)

    if (deleteError) throw deleteError
    // The banner is rendered into every page by the root layout.
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE promotion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour promotion admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression promotion admin',
})
