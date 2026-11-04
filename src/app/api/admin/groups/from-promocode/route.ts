import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { groupFromPromocodeSchema } from '@/lib/admin/groupInput'
import { getUserIdsFromPromoRegistrations, resolvePromoCode } from '@/app/api/admin/groups/promoGroupUtils'
import { resolveGroupAnchorFromProfile } from '@/lib/groups/resolveGroupAnchor'

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const parsed = groupFromPromocodeSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }
    const { name, promotional_code, captain_profile_id } = parsed.data

    const admin = supabaseAdmin()

    const promoCodeRow = await resolvePromoCode(admin, promotional_code)
    if (!promoCodeRow) {
      return NextResponse.json({ error: 'Code promo introuvable' }, { status: 404 })
    }

    const distinctUserIds = await getUserIdsFromPromoRegistrations(admin, promoCodeRow.id)

    if (distinctUserIds.length === 0) {
      return NextResponse.json({ error: 'Aucun inscrit lié à ce code promo' }, { status: 400 })
    }

    const { data: existingMemberships } = await admin
      .from('group_members')
      .select('profile_id')
      .in('profile_id', distinctUserIds)

    const existingSet = new Set((existingMemberships ?? []).map((row) => row.profile_id))
    const eligibleUserIds = distinctUserIds.filter((id) => !existingSet.has(id))

    if (eligibleUserIds.length === 0) {
      return NextResponse.json({ error: 'Tous les inscrits de ce code sont déjà dans des groupes' }, { status: 409 })
    }

    if (!eligibleUserIds.includes(captain_profile_id)) {
      return NextResponse.json({ error: 'Le capitaine sélectionné doit faire partie des inscrits éligibles du code promo' }, { status: 400 })
    }

    // L'ancre est lue avant la création : elle entre dans le même insert que le groupe.
    // Plus de fenêtre où un groupe existe sans ancre alors que le capitaine en a une.
    const initialAnchor = await resolveGroupAnchorFromProfile(admin, captain_profile_id)
    const now = new Date().toISOString()

    const { data: group, error: groupError } = await admin
      .from('groups')
      .insert({
        name: name.trim(),
        captain_id: captain_profile_id,
        ...(initialAnchor
          ? {
              anchor_event_id: initialAnchor.eventId,
              anchor_wave_index: initialAnchor.waveIndex,
              anchor_start_time: initialAnchor.startTime,
              anchor_initialized_by: 'creator',
              anchor_initialized_from_profile_id: captain_profile_id,
              anchor_initialized_at: now,
            }
          : {}),
      })
      .select('id, invite_code')
      .single()

    if (groupError || !group) {
      console.error('[admin groups from-promocode] create group error', groupError)
      return NextResponse.json({ error: 'Erreur création groupe' }, { status: 500 })
    }

    const membersPayload = eligibleUserIds.map((profileId) => ({
      group_id: group.id,
      profile_id: profileId,
      role: profileId === captain_profile_id ? 'captain' : 'member',
    }))

    const { error: insertMembersError } = await admin
      .from('group_members')
      .insert(membersPayload)

    if (insertMembersError) {
      console.error('[admin groups from-promocode] insert members error', insertMembersError)
      const { error: rollbackError } = await admin.from('groups').delete().eq('id', group.id)
      if (rollbackError) {
        // Groupe sans membres laissé en base : à signaler, ne pas répondre comme si tout était propre.
        console.error('[admin groups from-promocode] rollback failed, orphan group', { groupId: group.id, rollbackError })
      }
      return NextResponse.json({ error: 'Erreur ajout membres au groupe' }, { status: 500 })
    }

    return NextResponse.json(
      {
        id: group.id,
        invite_code: group.invite_code,
        members_added: eligibleUserIds.length,
        members_skipped_already_in_group: distinctUserIds.length - eligibleUserIds.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[admin groups from-promocode] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
