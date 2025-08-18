import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('Erreur auth volunteer:', userError)
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle - accepter volunteer ET admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('Erreur profil volunteer:', profileError)
      return NextResponse.json({ error: 'Erreur profil' }, { status: 500 })
    }

    if (!profile || !['volunteer', 'admin'].includes(profile.role)) {
      console.log('Rôle insuffisant:', profile?.role)
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Pour un admin, retourner tous les événements actifs
    // Pour un volunteer, filtrer par fenêtre temporelle
    let query = supabase
      .from('events')
      .select('id, title, date, location, status')
      .in('status', ['on_sale', 'sold_out'])
      .order('date', { ascending: true })

    if (profile.role === 'volunteer') {
      // Fenêtre de 24h avant et après
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      query = query
        .gte('date', twentyFourHoursAgo.toISOString())
        .lte('date', twentyFourHoursLater.toISOString())
    }

    const { data: events, error: eventsError } = await query

    if (eventsError) {
      console.log('Erreur événements:', eventsError)
      return NextResponse.json({ error: 'Erreur récupération événements' }, { status: 500 })
    }

    console.log(`Événements trouvés pour ${profile.role}:`, events?.length || 0)
    return NextResponse.json({ events: events || [] })

  } catch (error) {
    console.error('Erreur API accessible events:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}