import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'
import { wrapHtmlWithLayout } from '@/lib/email/wrapWithLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import type { AmbassadorReward, AmbassadorRewardStatus } from '@/types/Ambassador'

export const runtime = 'nodejs'
const resend = new Resend(process.env.RESEND_API_KEY!)
const SUPPORT_EMAIL = 'contact@overbound-race.com'
const EMAIL_FROM = process.env.SEND_FROM_EMAIL || 'no-reply@overbound-race.com'

const resolveRewardStatus = (value: string | null | undefined): AmbassadorRewardStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'claimed') return 'claimed'
  if (normalized === 'fulfilled') return 'fulfilled'
  return 'earned'
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as { reward_level?: number } | null
    const rewardLevel = Number(payload?.reward_level)

    if (!Number.isInteger(rewardLevel) || rewardLevel <= 0) {
      return NextResponse.json({ error: 'reward_level invalide.' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[ambassador rewards] profile error', profileError)
      return NextResponse.json({ error: 'Erreur profil' }, { status: 500 })
    }

    if (!hasAmbassadorAccess({ role: profileData?.role ?? null, email: user.email ?? null })) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()

    const { data: ambassadorData, error: ambassadorError } = await admin
      .from('ambassadors')
      .select('id, promotional_codes ( code )')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (ambassadorError) {
      console.error('[ambassador rewards] ambassador error', ambassadorError)
      return NextResponse.json({ error: 'Erreur ambassadeur' }, { status: 500 })
    }

    if (!ambassadorData) {
      return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })
    }

    const { data: rewardData, error: rewardError } = await admin
      .from('ambassador_rewards')
      .select('id, reward_level, reward_name, status, earned_at, claimed_at, fulfilled_at')
      .eq('ambassador_id', ambassadorData.id)
      .eq('reward_level', rewardLevel)
      .maybeSingle()

    if (rewardError) {
      console.error('[ambassador rewards] reward lookup error', rewardError)
      return NextResponse.json({ error: 'Erreur récompense' }, { status: 500 })
    }

    if (!rewardData) {
      return NextResponse.json({ error: 'Ce palier n\'est pas encore débloqué.' }, { status: 404 })
    }

    const currentStatus = resolveRewardStatus(rewardData.status)
    if (currentStatus !== 'earned') {
      return NextResponse.json({ error: 'Cette récompense ne peut pas être réclamée.' }, { status: 409 })
    }

    const { data: updatedReward, error: updateError } = await admin
      .from('ambassador_rewards')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rewardData.id)
      .select('id, reward_level, reward_name, status, earned_at, claimed_at, fulfilled_at')
      .single()

    if (updateError || !updatedReward) {
      console.error('[ambassador rewards] reward update error', updateError)
      return NextResponse.json({ error: 'Impossible de réclamer la récompense.' }, { status: 500 })
    }

    const ambassadorName = profileData?.full_name?.trim() || user.user_metadata?.full_name || user.email || user.id
    const ambassadorEmail = user.email ?? 'email_inconnu'
    const promoValue = Array.isArray((ambassadorData as any)?.promotional_codes)
      ? (ambassadorData as any)?.promotional_codes?.[0]
      : (ambassadorData as any)?.promotional_codes
    const ambassadorCode = promoValue?.code ?? null
    const siteUrl = getEmailAssetsBaseUrl()
    const adminUsersUrl = `${siteUrl}/dashboard?tab=users&search=${encodeURIComponent(ambassadorEmail)}`
    const adminAmbassadorsUrl = `${siteUrl}/dashboard?tab=ambassadors&search=${encodeURIComponent(ambassadorEmail)}`

    try {
      const emailHtml = wrapHtmlWithLayout({
        preview: 'Demande de récompense ambassadeur',
        htmlContent: `
          <h2 style="margin: 0 0 12px; font-size: 20px;">Un ambassadeur réclame sa récompense</h2>
          <p style="margin: 0 0 12px;">Nom: <strong>${ambassadorName}</strong></p>
          <p style="margin: 0 0 12px;">Email: <strong>${ambassadorEmail}</strong></p>
          <p style="margin: 0 0 12px;">User ID: <strong>${user.id}</strong></p>
          ${ambassadorCode ? `<p style="margin: 0 0 12px;">Code ambassadeur: <strong>${ambassadorCode}</strong></p>` : ''}
          <p style="margin: 0 0 12px;">Récompense: <strong>Palier ${updatedReward.reward_level} — ${updatedReward.reward_name}</strong></p>
          <p style="margin: 0 0 12px;">Réclamée le: <strong>${new Date(updatedReward.claimed_at ?? new Date().toISOString()).toLocaleString('fr-FR')}</strong></p>
          <p style="margin: 16px 0 0;">
            <a href="${adminAmbassadorsUrl}" style="color: #2563eb; text-decoration: none;">Ouvrir la gestion des ambassadeurs</a>
          </p>
          <p style="margin: 8px 0 0;">
            <a href="${adminUsersUrl}" style="color: #2563eb; text-decoration: none;">Ouvrir le profil utilisateur</a>
          </p>
        `,
      })

      await resend.emails.send({
        from: EMAIL_FROM,
        to: SUPPORT_EMAIL,
        subject: 'un ambassadeur réclame sa récompense',
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('[ambassador rewards] email error', emailError)
      await admin
        .from('ambassador_rewards')
        .update({
          status: 'earned',
          claimed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedReward.id)
      return NextResponse.json({ error: 'Impossible d\'envoyer le mail de reclamation.' }, { status: 502 })
    }

    const response: AmbassadorReward = {
      id: updatedReward.id,
      reward_level: updatedReward.reward_level,
      reward_name: updatedReward.reward_name,
      status: resolveRewardStatus(updatedReward.status),
      earned_at: updatedReward.earned_at,
      claimed_at: updatedReward.claimed_at,
      fulfilled_at: updatedReward.fulfilled_at,
    }

    return NextResponse.json({ reward: response })
  } catch (error) {
    console.error('[ambassador rewards] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
