import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { promotionalCodeInputSchema, toPromotionalCodeRow } from '@/lib/admin/promotionalCodeInput'

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

const handlePut = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const body: unknown = await request.json().catch(() => null)
    const parsed = promotionalCodeInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }
    const payload = parsed.data

    const admin = supabaseAdmin()
    const { data: promotionalCode, error: updateError } = await admin
      .from('promotional_codes')
      .update({ ...toPromotionalCodeRow(payload), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'Ce code promotionnel existe déjà' }, { status: 409 })
      }
      throw updateError
    }
    if (!promotionalCode) return NextResponse.json({ error: 'Code promo introuvable' }, { status: 404 })

    const eventIds = payload.event_ids ?? []
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

const activationSchema = z.object({ is_active: z.boolean() }).strict()

const handlePatch = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const body: unknown = await request.json().catch(() => null)
    const parsed = activationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { data, error } = await admin
      .from('promotional_codes')
      .update({ is_active: parsed.data.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Code promo introuvable' }, { status: 404 })

    const promotionalCode = await fetchPromotionalCode(id)
    return NextResponse.json({ promotionalCode })
  } catch (error) {
    console.error('Erreur PATCH promotional code:', error)
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

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour code promo admin',
})

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Activation code promo admin',
})

export const DELETE =withRequestLogging(handleDelete, {
  actionType: 'Suppression code promo admin',
})
