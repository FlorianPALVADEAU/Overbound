import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { user }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; profileId: string }> }) {
  try {
    const auth = await assertAdmin()
    if (auth.error) return auth.error

    const { id, profileId } = await params
    const admin = supabaseAdmin()

    const { data: group } = await admin
      .from('groups')
      .select('captain_id')
      .eq('id', id)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
    }

    if (group.captain_id === profileId) {
      return NextResponse.json({ error: 'Impossible d\'exclure le capitaine. Déléguez d\'abord.' }, { status: 400 })
    }

    const { error } = await admin
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('profile_id', profileId)

    if (error) {
      console.error('[admin groups members] remove error', error)
      return NextResponse.json({ error: 'Erreur exclusion membre' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin groups members] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
