import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendAmbassadorRewardStatusEmail } from '@/lib/ambassadors/email'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { z } from 'zod'

export const runtime = 'nodejs'

const resolveRewardStatus = (value: string | null | undefined): AmbassadorRewardStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'claimed') return 'claimed'
  if (normalized === 'fulfilled') return 'fulfilled'
  if (normalized === 'cancelled') return 'cancelled'
  return 'earned'
}

const lifecycleCommandSchema = z.object({
  action: z.enum(['cancelled', 'reopened']),
  reason: z.string().trim().min(3).max(1000),
  idempotency_key: z.string().uuid(),
})

async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = (await request.json().catch(() => null)) as { status?: string; action?: string; reason?: string; idempotency_key?: string } | null
    const lifecycleCommand = lifecycleCommandSchema.safeParse(payload)
    const { id } = await params
    const admin = supabaseAdmin()

    if (lifecycleCommand.success) {
      const { data: reward, error } = await admin.rpc('transition_ambassador_reward', {
        p_reward_id: id,
        p_action: lifecycleCommand.data.action,
        p_reason: lifecycleCommand.data.reason,
        p_actor_profile_id: auth.user.id,
        p_idempotency_key: lifecycleCommand.data.idempotency_key,
      }).single()
      if (error || !reward) {
        console.error('[admin ambassadors] lifecycle transition error', error)
        return NextResponse.json({ error: 'Impossible de modifier cette récompense.' }, { status: 409 })
      }
      return NextResponse.json({ reward })
    }

    const status = String(payload?.status || '').toLowerCase()

    if (!['earned', 'claimed', 'fulfilled'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const updatePayload: Record<string, string | null> = {
      status,
      updated_at: new Date().toISOString(),
      claimed_at: null,
      fulfilled_at: null,
    }

    if (status === 'claimed') {
      updatePayload.claimed_at = new Date().toISOString()
    }
    if (status === 'fulfilled') {
      updatePayload.claimed_at = new Date().toISOString()
      updatePayload.fulfilled_at = new Date().toISOString()
    }

    const { data: reward, error } = await admin
      .from('ambassador_rewards')
      .update(updatePayload)
      .eq('id', id)
      .select('id, ambassador_id, reward_level, reward_name, status, earned_at, claimed_at, fulfilled_at')
      .single()

    if (error || !reward) {
      console.error('[admin ambassadors] reward update error', error)
      return NextResponse.json({ error: 'Impossible de mettre à jour la récompense.' }, { status: 500 })
    }

    try {
      const { data: ambassadorRow } = await admin
        .from('ambassadors')
        .select('id, profile_id, promo:promotional_codes(code)')
        .eq('id', reward.ambassador_id)
        .maybeSingle()

      if (ambassadorRow?.profile_id) {
        const { data: profile } = await admin
          .from('profiles')
          .select('full_name')
          .eq('id', ambassadorRow.profile_id)
          .maybeSingle()

        const { data: authUser } = await admin.auth.admin.getUserById(ambassadorRow.profile_id)
        const email = authUser?.user?.email

        if (email) {
          const statusLabel =
            reward.status === 'fulfilled'
              ? 'Envoyée'
              : reward.status === 'claimed'
                ? 'Réclamée'
                : 'Débloquée'

          const promoValue = Array.isArray((ambassadorRow as any)?.promo)
            ? (ambassadorRow as any)?.promo?.[0]
            : (ambassadorRow as any)?.promo

          await sendAmbassadorRewardStatusEmail({
            to: email,
            fullName: profile?.full_name ?? null,
            ambassadorCode: promoValue?.code ?? null,
            reward: {
              reward_level: reward.reward_level,
              reward_name: reward.reward_name,
            },
            statusLabel,
          })
        }
      }
    } catch (emailError) {
      console.error('[admin ambassadors] status email error', emailError)
    }

    return NextResponse.json({
      reward: {
        id: reward.id,
        reward_level: reward.reward_level,
        reward_name: reward.reward_name,
        status: resolveRewardStatus(reward.status),
        earned_at: reward.earned_at,
        claimed_at: reward.claimed_at,
        fulfilled_at: reward.fulfilled_at,
      },
    })
  } catch (error) {
    console.error('[admin ambassadors] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Mise à jour récompense ambassadeur admin',
})
