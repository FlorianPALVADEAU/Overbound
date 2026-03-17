import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { sendAmbassadorRewardStatusEmail } from '@/lib/ambassadors/email'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export const runtime = 'nodejs'

const resolveRewardStatus = (value: string | null | undefined): AmbassadorRewardStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'claimed') return 'claimed'
  if (normalized === 'fulfilled') return 'fulfilled'
  return 'earned'
}

async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const payload = (await request.json().catch(() => null)) as { status?: string } | null
    const status = String(payload?.status || '').toLowerCase()

    if (!['earned', 'claimed', 'fulfilled'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const { id } = await params
    const admin = supabaseAdmin()

    const updatePayload: Record<string, string | null> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'claimed') {
      updatePayload.claimed_at = new Date().toISOString()
    }
    if (status === 'fulfilled') {
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
              ? 'Complétée'
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
