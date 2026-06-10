import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import type { Group, GroupMember } from '@/types/Group'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const admin = supabaseAdmin()

    const { data: memberRow, error: memberError } = await admin
      .from('group_members')
      .select('group_id, role')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (memberError) {
      console.error('[groups/my] member lookup error', memberError)
      return NextResponse.json({ error: 'Erreur groupe' }, { status: 500 })
    }

    if (!memberRow) {
      return NextResponse.json(null)
    }

    const groupId = memberRow.group_id as string

    const { data: groupRow, error: groupError } = await admin
      .from('groups')
      .select('id, name, captain_id, invite_code, anchor_event_id, anchor_wave_index, anchor_start_time, created_at')
      .eq('id', groupId)
      .maybeSingle()

    if (groupError || !groupRow) {
      console.error('[groups/my] group fetch error', groupError)
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 500 })
    }

    const { data: membersRows, error: membersError } = await admin
      .from('group_members')
      .select('id, profile_id, role, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('[groups/my] members fetch error', membersError)
      return NextResponse.json({ error: 'Erreur membres' }, { status: 500 })
    }

    const profileIds = (membersRows || []).map((m: any) => m.profile_id as string)
    const { data: profilesRows } = profileIds.length > 0
      ? await admin.from('profiles').select('id, full_name').in('id', profileIds)
      : { data: [] }

    const profileMap = new Map<string, string | null>()
    for (const p of (profilesRows || []) as Array<{ id: string; full_name: string | null }>) {
      profileMap.set(p.id, p.full_name)
    }

    const { data: authUsersRows } = profileIds.length > 0
      ? await admin.auth.admin.listUsers()
      : { data: { users: [] } }

    const emailMap = new Map<string, string | null>()
    for (const u of (authUsersRows as any)?.users ?? []) {
      if (profileIds.includes(u.id)) {
        emailMap.set(u.id, u.email ?? null)
      }
    }

    const members: GroupMember[] = (membersRows || []).map((m: any) => ({
      id: m.id,
      profile_id: m.profile_id,
      role: m.role,
      joined_at: m.joined_at,
      full_name: profileMap.get(m.profile_id) ?? null,
      email: emailMap.get(m.profile_id) ?? null,
    }))

    const group: Group = {
      id: groupRow.id as string,
      name: groupRow.name as string,
      captain_id: groupRow.captain_id as string,
      invite_code: groupRow.invite_code as string,
      anchor_event_id: (groupRow.anchor_event_id as string | null) ?? null,
      anchor_wave_index: (groupRow.anchor_wave_index as number | null) ?? null,
      anchor_start_time: (groupRow.anchor_start_time as string | null) ?? null,
      created_at: groupRow.created_at as string,
      members,
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('[groups/my] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
