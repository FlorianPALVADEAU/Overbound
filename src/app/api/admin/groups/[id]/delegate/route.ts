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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await assertAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const { new_captain_id } = await request.json() as { new_captain_id?: string }

    if (!new_captain_id) {
      return NextResponse.json({ error: 'Nouveau capitaine requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: targetMember } = await admin
      .from('group_members')
      .select('id')
      .eq('group_id', id)
      .eq('profile_id', new_captain_id)
      .maybeSingle()

    if (!targetMember) {
      return NextResponse.json({ error: 'Ce membre n\'appartient pas au groupe' }, { status: 400 })
    }

    await admin
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', id)
      .eq('role', 'captain')

    await admin
      .from('group_members')
      .update({ role: 'captain' })
      .eq('group_id', id)
      .eq('profile_id', new_captain_id)

    const { error } = await admin
      .from('groups')
      .update({ captain_id: new_captain_id, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[admin groups delegate] update error', error)
      return NextResponse.json({ error: 'Erreur délégation' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin groups delegate] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
