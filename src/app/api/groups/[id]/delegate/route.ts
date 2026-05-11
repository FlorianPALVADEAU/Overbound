import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params
    const { new_captain_id } = await request.json() as { new_captain_id?: string }

    if (!new_captain_id) {
      return NextResponse.json({ error: 'Nouveau capitaine requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: group } = await admin
      .from('groups')
      .select('captain_id')
      .eq('id', id)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
    }

    if (group.captain_id !== user.id) {
      return NextResponse.json({ error: 'Seul le capitaine peut déléguer le rôle' }, { status: 403 })
    }

    const { data: targetMember } = await admin
      .from('group_members')
      .select('id')
      .eq('group_id', id)
      .eq('profile_id', new_captain_id)
      .maybeSingle()

    if (!targetMember) {
      return NextResponse.json({ error: 'Ce membre n\'appartient pas au groupe' }, { status: 400 })
    }

    // Transfer: demote old captain, promote new one
    await admin
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', id)
      .eq('profile_id', user.id)

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
      return NextResponse.json({ error: 'Erreur délégation' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[groups/[id]/delegate] error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
