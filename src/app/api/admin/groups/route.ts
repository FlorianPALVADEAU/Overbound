import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { resolveGroupAnchorFromProfile } from '@/lib/groups/resolveGroupAnchor'
import { hydrateAdminGroups } from '@/lib/admin/groups'

const createAdminGroupBodySchema = z.object({
  name: z.string().trim().min(1, 'Nom de groupe requis'),
  captain_profile_id: z.string().uuid('Capitaine requis'),
})

const groupsQuerySchema = z.object({
  paginated: z.enum(['true', '1']).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().max(100).optional(),
})

const decodeOffset = (cursor: string | undefined) => {
  if (!cursor) return 0
  try {
    const offset = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (!Number.isInteger(offset) || offset < 0) throw new Error()
    return offset
  } catch {
    throw new Error('Cursor de pagination invalide')
  }
}

const encodeOffset = (offset: number) => Buffer.from(String(offset)).toString('base64url')

export async function POST(request: Request) {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const parsed = createAdminGroupBodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }
    const { name, captain_profile_id } = parsed.data

    const admin = supabaseAdmin()

    const { data: existingMembership } = await admin
      .from('group_members')
      .select('group_id')
      .eq('profile_id', captain_profile_id)
      .eq('organization_id', auth.organizationId)
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
      .insert({ name: name.trim(), captain_id: captain_profile_id, organization_id: auth.organizationId })
      .select('id, invite_code, name')
      .single()

    if (groupError || !group) {
      console.error('[admin groups] create error', groupError)
      return NextResponse.json({ error: 'Erreur création groupe' }, { status: 500 })
    }

    const { error: memberError } = await admin
      .from('group_members')
      .insert({ group_id: group.id, profile_id: captain_profile_id, role: 'captain', organization_id: auth.organizationId })

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

export async function GET(request: Request) {
  try {
    const parsedQuery = groupsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
    if (!parsedQuery.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
    const isPaginated = Boolean(parsedQuery.data.paginated || parsedQuery.data.cursor)
    let offset = 0
    if (isPaginated) {
      try { offset = decodeOffset(parsedQuery.data.cursor) } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 })
      }
    }
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()

    let groupsQuery = admin
      .from('groups')
      .select('id, name, captain_id, invite_code, anchor_event_id, anchor_wave_index, anchor_start_time, anchor_initialized_by, anchor_initialized_from_profile_id, anchor_initialized_at, created_at', isPaginated ? { count: 'exact' } : undefined)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
    const safeQuery = parsedQuery.data.query?.replace(/[%_,()]/g, ' ').trim()
    if (isPaginated && safeQuery) {
      groupsQuery = groupsQuery.or(`name.ilike.%${safeQuery}%,invite_code.ilike.%${safeQuery}%`)
    }
    if (isPaginated) groupsQuery = groupsQuery.range(offset, offset + parsedQuery.data.limit - 1)
    const { data: groupsRows, error: groupsError, count: groupsCount } = await groupsQuery

    if (groupsError) {
      console.error('[admin groups] groups fetch error', groupsError)
      return NextResponse.json({ error: 'Erreur chargement groupes' }, { status: 500 })
    }

    const groupIds = (groupsRows ?? []).map((group) => group.id)

    const globalMemberIdsResult = isPaginated
      ? await admin.from('group_members').select('profile_id').eq('organization_id', auth.organizationId)
      : { data: [], error: null }
    if (globalMemberIdsResult.error) throw globalMemberIdsResult.error

    const { data: membersRows, error: membersError } = groupIds.length
      ? await admin
          .from('group_members')
          .select('id, group_id, profile_id, role, joined_at')
          .in('group_id', groupIds)
          .eq('organization_id', auth.organizationId)
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
          .select('id, full_name, avatar_url')
          .in('id', profileIds)
      : { data: [] }

    const { data: usersData } = profileIds.length
      ? await admin.auth.admin.listUsers({ page: 1, perPage: 5000 })
      : { data: { users: [] } }

    const { groups } = hydrateAdminGroups(
      groupsRows ?? [],
      membersRows ?? [],
      profilesRows ?? [],
      usersData?.users ?? [],
    )

    if (!isPaginated) return NextResponse.json({ groups, total: groups.length })
    const total = groupsCount ?? 0
    const nextCursor = offset + groups.length < total ? encodeOffset(offset + groups.length) : null
    return NextResponse.json({
      groups,
      total,
      memberProfileIds: [...new Set((globalMemberIdsResult.data ?? []).map((row) => row.profile_id))],
      page: { limit: parsedQuery.data.limit, totalCount: total, nextCursor },
    })
  } catch (error) {
    console.error('[admin groups] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
