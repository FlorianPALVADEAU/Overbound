// src/app/api/checkin/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token QR manquant' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est admin ou volunteer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'volunteer'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // Utiliser supabaseAdmin pour modifier les données
    const admin = supabaseAdmin()
    
    // Vérifier d'abord si l'inscription existe et récupérer ses infos
    const { data: registration } = await admin
      .from('registrations')
      .select(`
        id,
        email,
        checked_in,
        tickets (
          name,
          events (
            title,
            date,
            location
          )
        )
      `)
      .eq('qr_code_token', token)
      .single()

    if (!registration) {
      return NextResponse.json(
        { error: 'QR code invalide ou inscription introuvable' },
        { status: 404 }
      )
    }

    if (registration.checked_in) {
      return NextResponse.json(
        { 
          error: 'Cette personne est déjà enregistrée comme présente',
          registration: {
            email: registration.email,
            ticket_name: registration.tickets?.[0]?.name,
            event_title: registration.tickets?.[0]?.events?.[0]?.title
          }
        },
        { status: 409 }
      )
    }

    // Effectuer le check-in
    const { data: updatedRegistration, error } = await admin
      .from('registrations')
      .update({ checked_in: true })
      .eq('qr_code_token', token)
      .select(`
        id,
        email,
        checked_in,
        tickets (
          name,
          events (
            title,
            date,
            location
          )
        )
      `)
      .single()

    if (error) {
      console.error('Erreur lors du check-in:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${updatedRegistration.email} enregistré avec succès !`,
      registration: {
        id: updatedRegistration.id,
        email: updatedRegistration.email,
        ticket_name: updatedRegistration.tickets?.[0]?.name,
        event_title: updatedRegistration.tickets?.[0]?.events?.[0]?.title,
        checked_in: updatedRegistration.checked_in
      }
    })

  } catch (error) {
    console.error('Erreur API check-in:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('event_id')
    
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier les permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'volunteer'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // Récupérer les inscriptions
    let query = supabase
      .from('registrations')
      .select(`
        id,
        email,
        checked_in,
        qr_code_token,
        created_at,
        tickets (
          name,
          events (
            title,
            date,
            location
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: registrations, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des données' },
        { status: 500 }
      )
    }

    // Calculer les statistiques
    const total = registrations?.length || 0
    const checkedIn = registrations?.filter(r => r.checked_in).length || 0
    const pending = total - checkedIn

    return NextResponse.json({
      registrations: registrations || [],
      stats: {
        total,
        checkedIn,
        pending
      }
    })

  } catch (error) {
    console.error('Erreur API GET registrations:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}