import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { syncOpenRegistrationsToWave } from '@/lib/groups/syncOpenGroupWave'
import { resolveGroupAnchorFromProfile } from '@/lib/groups/resolveGroupAnchor'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { invite_code } = await request.json() as { invite_code?: string }

    if (!invite_code || typeof invite_code !== 'string') {
      return NextResponse.json({ error: 'Code d\'invitation requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: existing } = await admin
      .from('group_members')
      .select('group_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Vous appartenez déjà à un groupe' }, { status: 409 })
    }

    const { data: group, error: groupError } = await admin
      .from('groups')
      .select('id, name, anchor_event_id, anchor_wave_index, anchor_start_time')
      .eq('invite_code', invite_code.trim().toUpperCase())
      .maybeSingle()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Code d\'invitation invalide' }, { status: 404 })
    }

    const { error: memberError } = await admin
      .from('group_members')
      .insert({ group_id: group.id, profile_id: user.id, role: 'member' })

    if (memberError) {
      console.error('[groups/join] insert error', memberError)
      return NextResponse.json({ error: 'Erreur lors de l\'adhésion' }, { status: 500 })
    }

    let anchorEventId = group.anchor_event_id as string | null
    let anchorWaveIndex = group.anchor_wave_index as number | null
    let anchorStartTime = group.anchor_start_time as string | null

    // If group has no anchor yet, try to initialize it from this new member's existing OPEN registration.
    if (!anchorEventId || anchorWaveIndex === null || !anchorStartTime) {
      const memberAnchor = await resolveGroupAnchorFromProfile(admin, user.id)
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
            anchor_initialized_from_profile_id: user.id,
            anchor_initialized_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', group.id)
      }
    }

    let waveReassigned = false
    if (anchorEventId && anchorWaveIndex !== null && anchorStartTime) {
      const syncResult = await syncOpenRegistrationsToWave({
        admin,
        eventId: anchorEventId,
        waveIndex: anchorWaveIndex,
        startTime: anchorStartTime,
        profileIds: [user.id],
      })
      waveReassigned = syncResult.moved > 0
    }

    return NextResponse.json({ id: group.id, name: group.name, wave_reassigned: waveReassigned }, { status: 201 })
  } catch (error) {
    console.error('[groups/join] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
