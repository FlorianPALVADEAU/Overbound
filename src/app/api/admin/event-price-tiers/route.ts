import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const createEventPriceTierSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1),
  discount_percentage: z.number().int().min(0).max(100),
  available_from: z.string().nullable(),
  available_until: z.string().nullable(),
  display_order: z.number().int().min(0),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createEventPriceTierSchema.parse(body)

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: tier, error } = await admin
      .from('event_price_tiers')
      .insert({
        event_id: validated.event_id,
        name: validated.name,
        discount_percentage: validated.discount_percentage,
        available_from: validated.available_from,
        available_until: validated.available_until,
        display_order: validated.display_order,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ tier })
  } catch (error) {
    console.error('Erreur POST event_price_tier:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
