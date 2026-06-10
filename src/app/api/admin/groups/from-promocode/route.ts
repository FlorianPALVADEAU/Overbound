import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { getUserIdsFromPromoRegistrations, resolvePromoCode } from '@/app/api/admin/groups/promoGroupUtils'
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

    const { name, promotional_code, captain_profile_id } = await request.json() as {
      name?: string
      promotional_code?: string
      captain_profile_id?: string
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom de groupe requis' }, { status: 400 })
    }

    if (!promotional_code || typeof promotional_code !== 'string' || promotional_code.trim().length === 0) {
      return NextResponse.json({ error: 'Code promo requis' }, { status: 400 })
    }

    if (!captain_profile_id || typeof captain_profile_id !== 'string') {
      return NextResponse.json({ error: 'Capitaine requis' }, { status: 400 })
    }

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

    const { data: group, error: groupError } = await admin
      .from('groups')
      .insert({ name: name.trim(), captain_id: captain_profile_id })
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
      await admin.from('groups').delete().eq('id', group.id)
      return NextResponse.json({ error: 'Erreur ajout membres au groupe' }, { status: 500 })
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
