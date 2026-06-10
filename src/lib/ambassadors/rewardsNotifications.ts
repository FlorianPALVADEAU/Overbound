import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAmbassadorRewardEarnedEmail } from '@/lib/ambassadors/email'

export async function notifyAmbassadorRewardsForOrder(
  admin: SupabaseClient,
  orderId: string,
) {
  const { data: registration } = await admin
    .from('registrations')
    .select('promotional_code_id')
    .eq('order_id', orderId)
    .not('promotional_code_id', 'is', null)
    .limit(1)
    .maybeSingle()

  const promotionalCodeId = registration?.promotional_code_id
  if (!promotionalCodeId) return

  const { data: ambassador } = await admin
    .from('ambassadors')
    .select('id, profile_id, promo:promotional_codes(code)')
    .eq('promotional_code_id', promotionalCodeId)
    .eq('is_active', true)
    .maybeSingle()

  if (!ambassador?.id || !ambassador.profile_id) return

  const { data: rewards } = await admin
    .from('ambassador_rewards')
    .select('id, reward_level, reward_name')
    .eq('ambassador_id', ambassador.id)
    .eq('status', 'earned')
    .is('notified_at', null)

  if (!rewards || rewards.length === 0) return

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', ambassador.profile_id)
    .maybeSingle()

  const { data: authUser } = await admin.auth.admin.getUserById(ambassador.profile_id)
  const email = authUser?.user?.email
  if (!email) return

  const promoValue = Array.isArray((ambassador as any)?.promo) ? (ambassador as any)?.promo?.[0] : (ambassador as any)?.promo

  await sendAmbassadorRewardEarnedEmail({
    to: email,
    fullName: profile?.full_name ?? null,
    ambassadorCode: promoValue?.code ?? null,
    rewards: rewards.map((reward) => ({
      reward_level: reward.reward_level,
      reward_name: reward.reward_name,
    })),
  })

  await admin
    .from('ambassador_rewards')
    .update({ notified_at: new Date().toISOString() })
    .in(
      'id',
      rewards.map((reward) => reward.id),
    )
}
