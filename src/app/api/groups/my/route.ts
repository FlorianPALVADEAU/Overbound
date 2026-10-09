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
      ? await admin.from('profiles').select('id, full_name, avatar_url').in('id', profileIds)
      : { data: [] }

    const profileMap = new Map<string, string | null>()
    const avatarMap = new Map<string, string | null>()
    for (const p of (profilesRows || []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>) {
      profileMap.set(p.id, p.full_name)
      avatarMap.set(p.id, p.avatar_url)
    }

    // Emails are only a display fallback for members without a name. Looking them up one by
    // one avoids listing every user of the platform (and its 50-user default page, which
    // silently dropped members of larger groups).
    const emailMap = new Map<string, string | null>()
    const unnamedIds = profileIds.filter((profileId) => !profileMap.get(profileId))
    await Promise.all(
      unnamedIds.map(async (profileId) => {
        const { data } = await admin.auth.admin.getUserById(profileId)
        emailMap.set(profileId, data.user?.email ?? null)
      }),
    )

    const members: GroupMember[] = (membersRows || []).map((m: any) => ({
      id: m.id,
      profile_id: m.profile_id,
      role: m.role,
      joined_at: m.joined_at,
      full_name: profileMap.get(m.profile_id) ?? null,
      email: emailMap.get(m.profile_id) ?? null,
      avatar_url: avatarMap.get(m.profile_id) ?? null,
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
