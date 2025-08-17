import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      slug,
      title,
      subtitle,
      date,
      location,
      capacity,
      status,
      external_provider,
      external_event_id,
      external_url
    } = body

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()
    const { data: event, error } = await admin
      .from('events')
      .update({
        slug,
        title,
        subtitle: subtitle || null,
        date: new Date(date).toISOString(),
        location,
        capacity: parseInt(capacity) || 0,
        status: status || 'draft',
        external_provider: external_provider || null,
        external_event_id: external_event_id || null,
        external_url: external_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ event })

  } catch (error) {
    console.error('Erreur PUT event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Vérifier s'il y a des inscriptions
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', params.id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un événement avec des inscriptions' },
        { status: 409 }
      )
    }

    // Utiliser supabaseAdmin pour supprimer
    const admin = supabaseAdmin()
    const { error } = await admin
      .from('events')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur DELETE event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}