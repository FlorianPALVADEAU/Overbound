import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

const handlePut = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      price_cents,
      available_from,
      available_until,
      display_order
    } = body

    // Vérifier que le palier existe
    const { data: existingTier, error: checkError } = await supabase
      .from('ticket_price_tiers')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingTier) {
      return NextResponse.json(
        { error: 'Palier de prix non trouvé' },
        { status: 404 }
      )
    }

    // Validation des dates si fournies
    if (available_from && available_until) {
      const start = new Date(available_from)
      const end = new Date(available_until)
      if (start >= end) {
        return NextResponse.json(
          { error: 'La date de début doit être avant la date de fin' },
          { status: 400 }
        )
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}
    if (price_cents !== undefined) updateData.price_cents = parseInt(price_cents)
    if (available_from !== undefined) updateData.available_from = available_from || null
    if (available_until !== undefined) updateData.available_until = available_until || null
    if (display_order !== undefined) updateData.display_order = parseInt(display_order)

    // Utiliser supabaseAdmin pour mettre à jour
    const admin = supabaseAdmin()
    const { data: priceTier, error } = await admin
      .from('ticket_price_tiers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ priceTier })

  } catch (error) {
    console.error('Erreur PUT ticket price tier:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handleDelete = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier que le palier existe
    const { data: existingTier, error: checkError } = await supabase
      .from('ticket_price_tiers')
      .select('ticket_id')
      .eq('id', id)
      .single()

    if (checkError || !existingTier) {
      return NextResponse.json(
        { error: 'Palier de prix non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier qu'il reste au moins un autre palier pour ce ticket
    const { data: remainingTiers, error: countError } = await supabase
      .from('ticket_price_tiers')
      .select('id')
      .eq('ticket_id', existingTier.ticket_id)

    if (countError) {
      throw countError
    }

    if (remainingTiers && remainingTiers.length <= 1) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le dernier palier de prix. Il doit en rester au moins un.' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour supprimer
    const admin = supabaseAdmin()
    const { error } = await admin
      .from('ticket_price_tiers')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur DELETE ticket price tier:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour palier de prix',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression palier de prix',
})
