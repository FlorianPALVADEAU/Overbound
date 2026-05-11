import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { name } = await request.json() as { name?: string }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom de groupe requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // User must not already be in a group
    const { data: existing } = await admin
      .from('group_members')
      .select('group_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Vous appartenez déjà à un groupe' }, { status: 409 })
    }

    const { data: group, error: groupError } = await admin
      .from('groups')
      .insert({ name: name.trim(), captain_id: user.id })
      .select('id, invite_code')
      .single()

    if (groupError || !group) {
      console.error('[groups] create error', groupError)
      return NextResponse.json({ error: 'Erreur création groupe' }, { status: 500 })
    }

    const { error: memberError } = await admin
      .from('group_members')
      .insert({ group_id: group.id, profile_id: user.id, role: 'captain' })

    if (memberError) {
      console.error('[groups] insert captain member error', memberError)
      // Roll back
      await admin.from('groups').delete().eq('id', group.id)
      return NextResponse.json({ error: 'Erreur création groupe' }, { status: 500 })
    }

    return NextResponse.json({ id: group.id, invite_code: group.invite_code }, { status: 201 })
  } catch (error) {
    console.error('[groups] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
