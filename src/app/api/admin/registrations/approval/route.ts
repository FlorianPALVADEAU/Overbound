import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(request: Request) {
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

    const { registration_id, status, reason } = await request.json()

    if (!registration_id || !status) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Utiliser la fonction RPC
    const { data, error } = await supabase.rpc('update_registration_approval', {
      registration_uuid: registration_id,
      new_status: status,
      reason: reason || null
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ result: data })

  } catch (error) {
    console.error('Erreur approval:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}