import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { OPEN_SAS_CONFIG } from '@/lib/openSas'

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

    // If the group already has a wave anchor, re-assign the new member's existing
    // registrations for that event to the group wave.
    let waveReassigned = false
    if (
      group.anchor_event_id &&
      group.anchor_wave_index !== null &&
      group.anchor_start_time !== null
    ) {
      const { data: registrations } = await admin
        .from('registrations')
        .select('id, wave_index')
        .eq('user_id', user.id)
        .eq('event_id', group.anchor_event_id)
        // Only reassign paid registrations (via their order status)
        .not('order_id', 'is', null)

      if (registrations && registrations.length > 0) {
        // Count how many are already in the group wave to compute new positions
        const { count: existingInWave } = await admin
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', group.anchor_event_id)
          .eq('wave_index', group.anchor_wave_index)

        const basePosition = (existingInWave ?? 0) + 1

        for (let i = 0; i < registrations.length; i++) {
          const reg = registrations[i] as { id: string; wave_index: number | null }
          const oldWaveIndex = reg.wave_index

          await admin
            .from('registrations')
            .update({
              wave_index: group.anchor_wave_index,
              start_time: group.anchor_start_time,
              wave_capacity: OPEN_SAS_CONFIG.waveCapacity,
              wave_position: basePosition + i,
              auto_assigned: true,
            })
            .eq('id', reg.id)

          // Decrement old wave count
          if (oldWaveIndex !== null && oldWaveIndex !== group.anchor_wave_index) {
            const { data: oldWaveRow } = await admin
              .from('event_waves')
              .select('id, assigned_count')
              .eq('event_id', group.anchor_event_id)
              .eq('wave_index', oldWaveIndex)
              .maybeSingle()

            if (oldWaveRow) {
              await admin
                .from('event_waves')
                .update({
                  assigned_count: Math.max(0, (oldWaveRow.assigned_count ?? 1) - 1),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', oldWaveRow.id)
            }
          }
        }

        // Increment new wave assigned_count
        const { data: newWaveRow } = await admin
          .from('event_waves')
          .select('id, assigned_count')
          .eq('event_id', group.anchor_event_id)
          .eq('wave_index', group.anchor_wave_index)
          .maybeSingle()

        if (newWaveRow) {
          await admin
            .from('event_waves')
            .update({
              assigned_count: (newWaveRow.assigned_count ?? 0) + registrations.length,
              updated_at: new Date().toISOString(),
            })
            .eq('id', newWaveRow.id)
        }

        waveReassigned = true
      }
    }

    return NextResponse.json({ id: group.id, name: group.name, wave_reassigned: waveReassigned }, { status: 201 })
  } catch (error) {
    console.error('[groups/join] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
