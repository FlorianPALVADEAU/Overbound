// src/app/api/volunteer/accessible-events/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'volunteer') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les événements dans la fenêtre d'accès (24h avant/après)
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: events } = await supabase
      .from('events')
      .select('id, title, date, location, status')
      .gte('date', twentyFourHoursAgo.toISOString())
      .lte('date', twentyFourHoursLater.toISOString())
      .in('status', ['on_sale', 'sold_out'])
      .order('date', { ascending: true })

    return NextResponse.json({ events: events || [] })

  } catch (error) {
    console.error('Erreur API accessible events:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
