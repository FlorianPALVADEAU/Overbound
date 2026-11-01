import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAmbassadorRewardEarnedEmail } from '@/lib/ambassadors/email'
import { nudgeAmbassadorNearGoal } from '@/lib/ambassadors/pointsNudge'

type NotificationClient = Pick<SupabaseClient, 'from' | 'auth'>

/** Returns true when a reward email was sent. */
async function notifyAmbassador(admin: NotificationClient, ambassadorId: string): Promise<boolean> {
  const { data: ambassador } = await admin
    .from('ambassadors')
    .select('id, profile_id')
    .eq('id', ambassadorId)
    .eq('is_active', true)
    .maybeSingle()
  if (!ambassador?.profile_id) return false

  const { data: rewards } = await admin
    .from('ambassador_rewards')
    .select('id, reward_level, reward_name')
    .eq('ambassador_id', ambassador.id)
    .eq('status', 'earned')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .is('notified_at', null)
    .order('reward_level', { ascending: true })
  if (!rewards || rewards.length === 0) return false

  const [{ data: profile }, { data: authUser }, { data: codeRow }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', ambassador.profile_id).maybeSingle(),
    admin.auth.admin.getUserById(ambassador.profile_id),
    admin
      .from('ambassador_promotional_codes')
      .select('promotional_code:promotional_codes(code)')
      .eq('ambassador_id', ambassador.id)
      .eq('is_current', true)
      .maybeSingle(),
  ])
  const email = authUser?.user?.email
  if (!email) return false

  const promotionalCode = Array.isArray(codeRow?.promotional_code) ? codeRow?.promotional_code[0] : codeRow?.promotional_code

  await sendAmbassadorRewardEarnedEmail({
    to: email,
    fullName: profile?.full_name ?? null,
    ambassadorCode: promotionalCode?.code ?? null,
    rewards: rewards.map(({ reward_level, reward_name }) => ({ reward_level, reward_name })),
  })

  await admin
    .from('ambassador_rewards')
    .update({ notified_at: new Date().toISOString() })
    .in(
      'id',
      rewards.map((reward) => reward.id),
    )
  return true
}

/**
 * Emails every ambassador credited by this order about rewards they have not been told about yet.
 * The ledger tells who was credited, so a retired code or a multi-code ambassador is still reached.
 */
export async function notifyAmbassadorRewardsForOrder(admin: NotificationClient, orderId: string) {
  const { data: events } = await admin
    .from('ambassador_points_events')
    .select('ambassador_id')
    .eq('order_id', orderId)
    .is('revoked_at', null)

  const ambassadorIds = Array.from(new Set((events ?? []).map((event) => event.ambassador_id as string)))
  for (const ambassadorId of ambassadorIds) {
    const rewardEmailSent = await notifyAmbassador(admin, ambassadorId)
    // One email per order: a reward email already says where the ambassador stands.
    // A failed nudge must never hide the credit or the reward email that already went out.
    if (!rewardEmailSent) {
      await nudgeAmbassadorNearGoal(admin, ambassadorId).catch((error) =>
        console.error('[ambassador nudge] failed', ambassadorId, error),
      )
    }
  }
}
