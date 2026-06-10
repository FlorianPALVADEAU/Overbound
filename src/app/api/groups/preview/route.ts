import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inviteCode = searchParams.get('invite_code')?.trim().toUpperCase()

    if (!inviteCode) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: group } = await admin
      .from('groups')
      .select('id, name, captain_id, invite_code')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 404 })
    }

    const { count: membersCount } = await admin
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id)

    const { data: captainProfile } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('id', group.captain_id)
      .maybeSingle()

    const { data: captainUser } = await admin.auth.admin.getUserById(group.captain_id)

    return NextResponse.json({
      id: group.id,
      name: group.name,
      invite_code: group.invite_code,
      captain: {
        id: group.captain_id,
        full_name: captainProfile?.full_name ?? null,
        email: captainUser?.user?.email ?? null,
      },
      members_count: membersCount ?? 0,
    })
  } catch (error) {
    console.error('[groups/preview] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
