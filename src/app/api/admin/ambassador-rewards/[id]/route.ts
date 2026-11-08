import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { sendAmbassadorRewardStatusEmail } from '@/lib/ambassadors/email'
import { resolveRewardStatus } from '@/lib/ambassadors/dashboardHelpers'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export const runtime = 'nodejs'

/** Set by hand: the three forward steps. Cancelling and reopening go through a reason. */
const statusCommandSchema = z.object({
  status: z.enum(['earned', 'claimed', 'fulfilled']),
})

const lifecycleCommandSchema = z.object({
  action: z.enum(['cancelled', 'reopened']),
  reason: z.string().trim().min(3).max(1000),
  idempotency_key: z.string().uuid(),
})

const rewardCommandSchema = z.union([lifecycleCommandSchema, statusCommandSchema])

const STATUS_LABELS = { earned: 'Débloquée', claimed: 'Réclamée', fulfilled: 'Envoyée' } as const

async function notifyAmbassador(admin: ReturnType<typeof supabaseAdmin>, reward: { ambassador_id: string; reward_level: number; reward_name: string; status: string }) {
  const { data: ambassadorRow } = await admin
    .from('ambassadors')
    .select('id, profile_id, promo:promotional_codes(code)')
    .eq('id', reward.ambassador_id)
    .maybeSingle()
  if (!ambassadorRow?.profile_id) return

  const { data: profile } = await admin.from('profiles').select('first_name').eq('id', ambassadorRow.profile_id).maybeSingle()
  const { data: authUser } = await admin.auth.admin.getUserById(ambassadorRow.profile_id)
  const email = authUser?.user?.email
  if (!email) return

  const promo = Array.isArray(ambassadorRow.promo) ? ambassadorRow.promo[0] : ambassadorRow.promo
  const statusLabel = STATUS_LABELS[resolveRewardStatus(reward.status) as keyof typeof STATUS_LABELS] ?? STATUS_LABELS.earned

  await sendAmbassadorRewardStatusEmail({
    to: email,
    firstName: profile?.first_name ?? null,
    ambassadorCode: (promo as { code?: string | null } | null)?.code ?? null,
    reward: { reward_level: reward.reward_level, reward_name: reward.reward_name },
    statusLabel,
  })
}

async function handlePatch(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const parsed = rewardCommandSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })
    }

    const { id } = await params
    const admin = supabaseAdmin()
    const command = parsed.data

    if ('action' in command) {
      const { data: reward, error } = await admin.rpc('transition_ambassador_reward', {
        p_reward_id: id,
        p_action: command.action,
        p_reason: command.reason,
        p_actor_profile_id: auth.user.id,
        p_idempotency_key: command.idempotency_key,
      }).single()
      if (error || !reward) {
        console.error('[admin ambassador rewards] lifecycle transition error', error)
        return NextResponse.json({ error: 'Impossible de modifier cette récompense.' }, { status: 409 })
      }
      return NextResponse.json({ reward })
    }

    const now = new Date().toISOString()
    const { data: reward, error } = await admin
      .from('ambassador_rewards')
      .update({
        status: command.status,
        updated_at: now,
        claimed_at: command.status === 'earned' ? null : now,
        fulfilled_at: command.status === 'fulfilled' ? now : null,
      })
      .eq('id', id)
      .select('id, ambassador_id, reward_level, reward_name, status, earned_at, claimed_at, fulfilled_at')
      .single()

    if (error || !reward) {
      console.error('[admin ambassador rewards] status update error', error)
      return NextResponse.json({ error: 'Impossible de mettre à jour la récompense.' }, { status: 500 })
    }

    try {
      await notifyAmbassador(admin, reward)
    } catch (emailError) {
      // The status is already saved: a failed notification must not turn the update into an error.
      console.error('[admin ambassador rewards] status email error', emailError)
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
    console.error('[admin ambassador rewards] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Mise à jour récompense ambassadeur admin',
})
