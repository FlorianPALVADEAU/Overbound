import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export async function GET(request: NextRequest) {
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

    // Récupérer le ticket_id depuis les query params
    const searchParams = request.nextUrl.searchParams
    const ticketId = searchParams.get('ticket_id')

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ticket_id requis' },
        { status: 400 }
      )
    }

    // Récupérer tous les paliers de prix pour ce ticket
    const { data: priceTiers, error } = await supabase
      .from('ticket_price_tiers')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('display_order', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ priceTiers })

  } catch (error) {
    console.error('Erreur GET ticket price tiers:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
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

    const body = await request.json()
    const {
      ticket_id,
      price_cents,
      available_from,
      available_until,
      display_order
    } = body

    // Validation
    if (!ticket_id || price_cents === undefined) {
      return NextResponse.json(
        { error: 'ticket_id et price_cents sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier que le ticket existe
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      )
    }

    // Validation des dates
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

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: priceTier, error } = await admin
      .from('ticket_price_tiers')
      .insert({
        ticket_id,
        price_cents: parseInt(price_cents),
        available_from: available_from || null,
        available_until: available_until || null,
        display_order: display_order !== undefined ? parseInt(display_order) : 0
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ priceTier }, { status: 201 })

  } catch (error) {
    console.error('Erreur POST ticket price tier:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création palier de prix',
})
