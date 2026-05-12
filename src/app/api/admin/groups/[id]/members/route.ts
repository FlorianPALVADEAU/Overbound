import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { syncOpenRegistrationsToWave } from '@/lib/groups/syncOpenGroupWave'
import { resolveGroupAnchorFromProfile } from '@/lib/groups/resolveGroupAnchor'

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await assertAdmin()
    if (auth.error) return auth.error

    const { id } = await params
    const { profile_id } = await request.json() as { profile_id?: string }

    if (!profile_id) {
      return NextResponse.json({ error: 'Profil membre requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: group } = await admin
      .from('groups')
      .select('id, anchor_event_id, anchor_wave_index, anchor_start_time')
      .eq('id', id)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
    }

    const { data: existingMembership } = await admin
      .from('group_members')
      .select('group_id')
      .eq('profile_id', profile_id)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json({ error: 'Cet utilisateur appartient déjà à un groupe' }, { status: 409 })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', profile_id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const { error } = await admin
      .from('group_members')
      .insert({ group_id: id, profile_id, role: 'member' })

    if (error) {
      console.error('[admin groups members] add error', error)
      return NextResponse.json({ error: 'Erreur ajout membre' }, { status: 500 })
    }

    let anchorEventId = group.anchor_event_id as string | null
    let anchorWaveIndex = group.anchor_wave_index as number | null
    let anchorStartTime = group.anchor_start_time as string | null

    if (!anchorEventId || anchorWaveIndex === null || !anchorStartTime) {
      const memberAnchor = await resolveGroupAnchorFromProfile(admin, profile_id)
      if (memberAnchor) {
        anchorEventId = memberAnchor.eventId
        anchorWaveIndex = memberAnchor.waveIndex
        anchorStartTime = memberAnchor.startTime
        await admin
          .from('groups')
          .update({
            anchor_event_id: anchorEventId,
            anchor_wave_index: anchorWaveIndex,
            anchor_start_time: anchorStartTime,
            anchor_initialized_by: 'member_join',
            anchor_initialized_from_profile_id: profile_id,
            anchor_initialized_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      }
    }

    let movedToAnchor = 0
    if (anchorEventId && anchorWaveIndex !== null && anchorStartTime) {
      const sync = await syncOpenRegistrationsToWave({
        admin,
        eventId: anchorEventId,
        waveIndex: anchorWaveIndex,
        startTime: anchorStartTime,
        profileIds: [profile_id],
      })
      movedToAnchor = sync.moved
    }

    return NextResponse.json({ ok: true, members_moved_to_group_wave: movedToAnchor }, { status: 201 })
  } catch (error) {
    console.error('[admin groups members] add unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
