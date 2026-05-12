import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { resolveGroupAnchorFromProfile } from '@/lib/groups/resolveGroupAnchor'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { name, captain_profile_id } = await request.json() as {
      name?: string
      captain_profile_id?: string
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom de groupe requis' }, { status: 400 })
    }

    if (!captain_profile_id || typeof captain_profile_id !== 'string') {
      return NextResponse.json({ error: 'Capitaine requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: existingMembership } = await admin
      .from('group_members')
      .select('group_id')
      .eq('profile_id', captain_profile_id)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json({ error: 'Ce capitaine appartient déjà à un groupe' }, { status: 409 })
    }

    const { data: captainProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', captain_profile_id)
      .maybeSingle()

    if (!captainProfile) {
      return NextResponse.json({ error: 'Profil capitaine introuvable' }, { status: 404 })
    }

    const { data: group, error: groupError } = await admin
      .from('groups')
      .insert({ name: name.trim(), captain_id: captain_profile_id })
      .select('id, invite_code, name')
      .single()

    if (groupError || !group) {
      console.error('[admin groups] create error', groupError)
      return NextResponse.json({ error: 'Erreur création groupe' }, { status: 500 })
    }

    const { error: memberError } = await admin
      .from('group_members')
      .insert({ group_id: group.id, profile_id: captain_profile_id, role: 'captain' })

    if (memberError) {
      await admin.from('groups').delete().eq('id', group.id)
      console.error('[admin groups] create captain member error', memberError)
      return NextResponse.json({ error: 'Erreur création groupe' }, { status: 500 })
    }

    const initialAnchor = await resolveGroupAnchorFromProfile(admin, captain_profile_id)
    if (initialAnchor) {
      await admin
        .from('groups')
        .update({
          anchor_event_id: initialAnchor.eventId,
          anchor_wave_index: initialAnchor.waveIndex,
          anchor_start_time: initialAnchor.startTime,
          anchor_initialized_by: 'creator',
          anchor_initialized_from_profile_id: captain_profile_id,
          anchor_initialized_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id)
    }

    return NextResponse.json({ id: group.id, invite_code: group.invite_code, name: group.name }, { status: 201 })
  } catch (error) {
    console.error('[admin groups] create unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()

    const { data: groupsRows, error: groupsError } = await admin
      .from('groups')
      .select('id, name, captain_id, invite_code, anchor_event_id, anchor_wave_index, anchor_start_time, anchor_initialized_by, anchor_initialized_from_profile_id, anchor_initialized_at, created_at')
      .order('created_at', { ascending: false })

    if (groupsError) {
      console.error('[admin groups] groups fetch error', groupsError)
      return NextResponse.json({ error: 'Erreur chargement groupes' }, { status: 500 })
    }

    const groupIds = (groupsRows ?? []).map((group) => group.id)

    const { data: membersRows, error: membersError } = groupIds.length
      ? await admin
          .from('group_members')
          .select('id, group_id, profile_id, role, joined_at')
          .in('group_id', groupIds)
          .order('joined_at', { ascending: true })
      : { data: [], error: null }

    if (membersError) {
      console.error('[admin groups] members fetch error', membersError)
      return NextResponse.json({ error: 'Erreur chargement membres' }, { status: 500 })
    }

    const profileIds = Array.from(new Set((membersRows ?? []).map((row) => row.profile_id)))

    const { data: profilesRows } = profileIds.length
      ? await admin
          .from('profiles')
          .select('id, full_name')
          .in('id', profileIds)
      : { data: [] }

    const profileMap = new Map<string, string | null>()
    for (const row of profilesRows ?? []) {
      profileMap.set(row.id, row.full_name ?? null)
    }

    const { data: usersData } = profileIds.length
      ? await admin.auth.admin.listUsers({ page: 1, perPage: 5000 })
      : { data: { users: [] } }

    const emailMap = new Map<string, string | null>()
    for (const authUser of usersData?.users ?? []) {
      if (profileIds.includes(authUser.id)) {
        emailMap.set(authUser.id, authUser.email ?? null)
      }
    }

    const membersByGroup = new Map<string, any[]>()
    for (const member of membersRows ?? []) {
      const groupList = membersByGroup.get(member.group_id) ?? []
      groupList.push({
        id: member.id,
        profile_id: member.profile_id,
        role: member.role,
        joined_at: member.joined_at,
        full_name: profileMap.get(member.profile_id) ?? null,
        email: emailMap.get(member.profile_id) ?? null,
      })
      membersByGroup.set(member.group_id, groupList)
    }

    const groups = (groupsRows ?? []).map((group) => {
      const sourceProfileId = group.anchor_initialized_from_profile_id as string | null
      return {
        ...group,
        anchor_initialized_from_profile_name: sourceProfileId ? profileMap.get(sourceProfileId) ?? null : null,
        members: membersByGroup.get(group.id) ?? [],
      }
    })

    return NextResponse.json({ groups, total: groups.length })
  } catch (error) {
    console.error('[admin groups] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
