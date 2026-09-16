import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const updateEventPriceTierSchema = z.object({
  name: z.string().min(1).optional(),
  discount_percentage: z.number().int().min(0).max(100).optional(),
  available_from: z.string().nullable().optional(),
  available_until: z.string().nullable().optional(),
  display_order: z.number().int().min(0).optional(),
  max_registrations: z.number().int().min(0).nullable().optional(),
})

async function handlePut(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const { id } = await params

    const body = await request.json()
    const validated = updateEventPriceTierSchema.parse(body)

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()
    const { data: tier, error } = await admin
      .from('event_price_tiers')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ tier })
  } catch (error) {
    console.error('Erreur PUT event_price_tier:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const { id } = await params

    // Utiliser supabaseAdmin pour supprimer
    const admin = supabaseAdmin()
    const { error } = await admin.from('event_price_tiers').delete().eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE event_price_tier:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour palier tarifaire événement admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression palier tarifaire événement admin',
})
