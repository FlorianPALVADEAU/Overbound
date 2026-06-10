import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { getUserIdsFromPromoRegistrations, resolvePromoCode } from '@/app/api/admin/groups/promoGroupUtils'
import { syncOpenRegistrationsToWave } from '@/lib/groups/syncOpenGroupWave'

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await assertAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json() as {
      name?: string
      captain_id?: string
      anchor_event_id?: string | null
      anchor_wave_index?: number | null
      promotional_code?: string
    }

    const admin = supabaseAdmin()

    if (typeof body.promotional_code === 'string' && body.promotional_code.trim().length > 0) {
      const promoCodeRow = await resolvePromoCode(admin, body.promotional_code)
      if (!promoCodeRow) {
        return NextResponse.json({ error: 'Code promo introuvable' }, { status: 404 })
      }

      const userIds = await getUserIdsFromPromoRegistrations(admin, promoCodeRow.id)
      if (userIds.length === 0) {
        return NextResponse.json({ error: 'Aucun inscrit lié à ce code promo' }, { status: 400 })
      }

      const { data: existingMemberships } = await admin
        .from('group_members')
        .select('profile_id, group_id')
        .in('profile_id', userIds)

      const inAnotherGroup = new Set(
        (existingMemberships ?? [])
          .filter((row) => row.group_id !== id)
          .map((row) => row.profile_id)
      )

      const alreadyHere = new Set(
        (existingMemberships ?? [])
          .filter((row) => row.group_id === id)
          .map((row) => row.profile_id)
      )

      const toAdd = userIds.filter((profileId) => !inAnotherGroup.has(profileId) && !alreadyHere.has(profileId))

      if (toAdd.length > 0) {
        const { error: insertMembersError } = await admin
          .from('group_members')
          .insert(toAdd.map((profileId) => ({ group_id: id, profile_id: profileId, role: 'member' })))

        if (insertMembersError) {
          console.error('[admin groups] promo import members error', insertMembersError)
          return NextResponse.json({ error: 'Erreur import des membres depuis le code promo' }, { status: 500 })
        }
      }

      const { data: groupAnchor } = await admin
        .from('groups')
        .select('anchor_event_id, anchor_wave_index, anchor_start_time')
        .eq('id', id)
        .maybeSingle()

      let movedToAnchor = 0
      if (
        toAdd.length > 0 &&
        groupAnchor?.anchor_event_id &&
        groupAnchor.anchor_wave_index !== null &&
        groupAnchor.anchor_start_time
      ) {
        const sync = await syncOpenRegistrationsToWave({
          admin,
          eventId: groupAnchor.anchor_event_id,
          waveIndex: groupAnchor.anchor_wave_index,
          startTime: groupAnchor.anchor_start_time,
          profileIds: toAdd,
        })
        movedToAnchor = sync.moved
      }

      return NextResponse.json({
        ok: true,
        imported_from_promocode: true,
        members_added: toAdd.length,
        members_moved_to_group_wave: movedToAnchor,
        members_skipped_already_in_other_group: Array.from(inAnotherGroup).length,
        members_skipped_already_in_this_group: Array.from(alreadyHere).length,
      })
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.name === 'string') {
      if (body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Nom de groupe requis' }, { status: 400 })
      }
      updates.name = body.name.trim()
    }

    if (typeof body.captain_id === 'string' && body.captain_id.length > 0) {
      const { data: memberRow } = await admin
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('profile_id', body.captain_id)
        .maybeSingle()

      if (!memberRow) {
        return NextResponse.json({ error: 'Le capitaine doit être membre du groupe' }, { status: 400 })
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
        .eq('profile_id', body.captain_id)

      updates.captain_id = body.captain_id
    }

    if (body.anchor_event_id === null) {
      updates.anchor_event_id = null
      updates.anchor_wave_index = null
      updates.anchor_start_time = null
      updates.anchor_initialized_by = null
      updates.anchor_initialized_from_profile_id = null
      updates.anchor_initialized_at = null
    } else if (
      typeof body.anchor_event_id === 'string' &&
      body.anchor_event_id.length > 0 &&
      Number.isFinite(Number(body.anchor_wave_index))
    ) {
      const waveIndex = Number(body.anchor_wave_index)
      const { data: waveRow, error: waveError } = await admin
        .from('event_waves')
        .select('start_time')
        .eq('event_id', body.anchor_event_id)
        .eq('wave_index', waveIndex)
        .maybeSingle()

      if (waveError || !waveRow?.start_time) {
        return NextResponse.json({ error: 'Vague introuvable pour cet événement' }, { status: 400 })
      }

      updates.anchor_event_id = body.anchor_event_id
      updates.anchor_wave_index = waveIndex
      updates.anchor_start_time = waveRow.start_time
      updates.anchor_initialized_by = 'admin_manual'
      updates.anchor_initialized_from_profile_id = null
      updates.anchor_initialized_at = new Date().toISOString()
    }

    const { error } = await admin
      .from('groups')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('[admin groups] update error', error)
      return NextResponse.json({ error: 'Erreur mise à jour groupe' }, { status: 500 })
    }

    let movedToAnchor = 0
    if (
      typeof updates.anchor_event_id === 'string' &&
      typeof updates.anchor_wave_index === 'number' &&
      typeof updates.anchor_start_time === 'string'
    ) {
      const { data: members } = await admin
        .from('group_members')
        .select('profile_id')
        .eq('group_id', id)

      const memberIds = (members ?? []).map((row) => row.profile_id)
      if (memberIds.length > 0) {
        const sync = await syncOpenRegistrationsToWave({
          admin,
          eventId: updates.anchor_event_id,
          waveIndex: updates.anchor_wave_index,
          startTime: updates.anchor_start_time,
          profileIds: memberIds,
        })
        movedToAnchor = sync.moved
      }
    }

    return NextResponse.json({ ok: true, members_moved_to_group_wave: movedToAnchor })
  } catch (error) {
    console.error('[admin groups] patch unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await assertAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const admin = supabaseAdmin()

    const { error } = await admin
      .from('groups')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[admin groups] delete error', error)
      return NextResponse.json({ error: 'Erreur suppression groupe' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin groups] delete unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
