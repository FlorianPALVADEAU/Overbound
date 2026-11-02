import { Resend } from 'resend'
import { wrapHtmlWithLayout } from '@/lib/email/wrapWithLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import { buildReferralUrl } from '@/lib/attribution/referral'

const resend = new Resend(process.env.RESEND_API_KEY!)
const EMAIL_FROM = process.env.SEND_FROM_EMAIL || 'no-reply@overbound-race.com'
const SUPPORT_EMAIL = 'contact@overbound-race.com'

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Tells the team an ambassador claimed a reward. Names come from user profiles, so they are escaped. */
export async function sendAmbassadorRewardClaimRequestEmail(params: {
  ambassadorName: string
  ambassadorEmail: string
  userId: string
  ambassadorCode: string | null
  reward: { reward_level: number; reward_name: string; claimed_at: string | null }
}) {
  const { ambassadorName, ambassadorEmail, userId, ambassadorCode, reward } = params
  const siteUrl = getEmailAssetsBaseUrl()
  const adminAmbassadorsUrl = `${siteUrl}/dashboard/ambassadors?search=${encodeURIComponent(ambassadorEmail)}`
  const adminUsersUrl = `${siteUrl}/dashboard/users?search=${encodeURIComponent(ambassadorEmail)}`
  const claimedAt = new Date(reward.claimed_at ?? Date.now()).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })

  const html = wrapHtmlWithLayout({
    preview: 'Demande de récompense ambassadeur',
    htmlContent: `
      <h2 style="margin: 0 0 12px; font-size: 20px;">Un ambassadeur réclame sa récompense</h2>
      <p style="margin: 0 0 12px;">Nom: <strong>${escapeHtml(ambassadorName)}</strong></p>
      <p style="margin: 0 0 12px;">Email: <strong>${escapeHtml(ambassadorEmail)}</strong></p>
      <p style="margin: 0 0 12px;">User ID: <strong>${escapeHtml(userId)}</strong></p>
      ${ambassadorCode ? `<p style="margin: 0 0 12px;">Code ambassadeur: <strong>${escapeHtml(ambassadorCode)}</strong></p>` : ''}
      <p style="margin: 0 0 12px;">Récompense: <strong>Palier ${reward.reward_level} : ${escapeHtml(reward.reward_name)}</strong></p>
      <p style="margin: 0 0 12px;">Réclamée le: <strong>${claimedAt}</strong></p>
      <p style="margin: 16px 0 0;"><a href="${adminAmbassadorsUrl}" style="color: #2563eb; text-decoration: none;">Ouvrir la gestion des ambassadeurs</a></p>
      <p style="margin: 8px 0 0;"><a href="${adminUsersUrl}" style="color: #2563eb; text-decoration: none;">Ouvrir le profil utilisateur</a></p>
    `,
  })

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: SUPPORT_EMAIL,
    subject: 'Un ambassadeur réclame sa récompense',
    html,
  })
  if (error) throw new Error(`Resend: ${error.message}`)
}

export async function sendAmbassadorRewardEarnedEmail(params: {
  to: string
  fullName?: string | null
  ambassadorCode?: string | null
  rewards: Array<{ reward_level: number; reward_name: string }>
}) {
  const { to, fullName, ambassadorCode, rewards } = params
  const siteUrl = getEmailAssetsBaseUrl()

  const rewardsList = rewards
    .map(
      (reward) =>
        `<li>Palier ${reward.reward_level} — ${reward.reward_name}</li>`,
    )
    .join('')

  const html = wrapHtmlWithLayout({
    preview: 'Nouveau palier ambassadeur débloqué',
    htmlContent: `
      <h2 style="margin: 0 0 12px; font-size: 20px;">Nouveau palier débloqué</h2>
      <p style="margin: 0 0 12px;">Bravo ${fullName || 'ambassadeur'} ! Tu as atteint un nouveau palier.</p>
      ${ambassadorCode ? `<p style="margin: 0 0 12px;">Code ambassadeur: <strong>${ambassadorCode}</strong></p>` : ''}
      <ul style="margin: 0 0 12px; padding-left: 18px;">
        ${rewardsList}
      </ul>
      <p style="margin: 12px 0 0;">
        Suis tes récompenses sur ton tableau de bord:
        <a href="${siteUrl}/ambassadors/dashboard" style="color: #2563eb; text-decoration: none;">Espace ambassadeur</a>
      </p>
    `,
  })

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Nouveau palier ambassadeur débloqué',
    html,
  })
}

/** One email when an ambassador is a few points away from their next goal. Names are escaped. */
export async function sendAmbassadorPointsNudgeEmail(params: {
  to: string
  fullName?: string | null
  ambassadorCode?: string | null
  goalName: string
  pointsRemaining: number
}) {
  const { to, fullName, ambassadorCode, goalName, pointsRemaining } = params
  const siteUrl = getEmailAssetsBaseUrl()
  const points = `${pointsRemaining} point${pointsRemaining > 1 ? 's' : ''}`
  const shareLink = ambassadorCode ? buildReferralUrl(siteUrl, ambassadorCode) : null

  const html = wrapHtmlWithLayout({
    preview: `Plus que ${points} avant ta prochaine récompense`,
    htmlContent: `
      <h2 style="margin: 0 0 12px; font-size: 20px;">Plus que ${points}</h2>
      <p style="margin: 0 0 12px;">Salut ${escapeHtml(fullName?.trim().split(/\s+/)[0] || 'ambassadeur')}, il te reste ${points} pour débloquer <strong>${escapeHtml(goalName)}</strong>.</p>
      ${shareLink ? `<p style="margin: 0 0 12px;">Ton lien à partager, le code ${escapeHtml(ambassadorCode ?? '')} s'applique tout seul : <a href="${shareLink}" style="color: #2563eb; text-decoration: none;">${shareLink}</a></p>` : ''}
      <p style="margin: 12px 0 0;">
        Suis ta progression sur ton
        <a href="${siteUrl}/ambassadors/dashboard" style="color: #2563eb; text-decoration: none;">espace ambassadeur</a>.
      </p>
    `,
  })

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Plus que ${points} avant ${goalName}`,
    html,
  })
  if (error) throw new Error(`Resend: ${error.message}`)
}

export async function sendAmbassadorRewardStatusEmail(params: {
  to: string
  fullName?: string | null
  ambassadorCode?: string | null
  reward: { reward_level: number; reward_name: string }
  statusLabel: string
}) {
  const { to, fullName, ambassadorCode, reward, statusLabel } = params
  const siteUrl = getEmailAssetsBaseUrl()

  const html = wrapHtmlWithLayout({
    preview: 'Mise à jour de ta récompense ambassadeur',
    htmlContent: `
      <h2 style="margin: 0 0 12px; font-size: 20px;">Récompense mise à jour</h2>
      <p style="margin: 0 0 12px;">Bonjour ${fullName || 'ambassadeur'},</p>
      <p style="margin: 0 0 12px;">Le statut de ta récompense a été mis à jour.</p>
      ${ambassadorCode ? `<p style="margin: 0 0 12px;">Code ambassadeur: <strong>${ambassadorCode}</strong></p>` : ''}
      <p style="margin: 0 0 12px;">Récompense: <strong>Palier ${reward.reward_level} — ${reward.reward_name}</strong></p>
      <p style="margin: 0 0 12px;">Statut: <strong>${statusLabel}</strong></p>
      <p style="margin: 12px 0 0;">
        Tu peux consulter le détail sur ton tableau de bord:
        <a href="${siteUrl}/ambassadors/dashboard" style="color: #2563eb; text-decoration: none;">Espace ambassadeur</a>
      </p>
    `,
  })

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Mise à jour de ta récompense',
    html,
  })
}

export async function sendAmbassadorWelcomeEmail(params: {
  to: string
  fullName?: string | null
}) {
  const { to, fullName } = params
  const siteUrl = getEmailAssetsBaseUrl()

  const html = wrapHtmlWithLayout({
    preview: 'Bienvenue dans l’équipe ambassadeur',
    htmlContent: `
      <h2 style="margin: 0 0 12px; font-size: 20px;">Bienvenue dans l’équipe ambassadeur Overbound</h2>
      <p style="margin: 0 0 12px;">Hello ${fullName || 'ambassadeur'} 👋</p>
      <p style="margin: 0 0 12px;">
        Tu viens d’entrer dans l’équipe qui fait bouger la communauté Overbound. Ton rôle : inspirer,
        motiver et donner envie de se dépasser.
      </p>
      <p style="margin: 0 0 12px;">
        Ton tableau de bord est prêt. C’est ici que tu suivras tes points, tes paliers et tes récompenses.
      </p>
      <p style="margin: 16px 0 0;">
        <a href="${siteUrl}/ambassadors/dashboard" style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;">
          Accéder à mon espace ambassadeur
        </a>
      </p>
      <p style="margin: 12px 0 0; font-size: 13px; color: #6b7280;">
        Besoin d’un coup de main ? Réponds simplement à ce mail.
      </p>
    `,
  })

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Bienvenue dans l’équipe ambassadeur',
    html,
  })
}

export async function sendAmbassadorCodeAssignedEmail(params: {
  to: string
  fullName?: string | null
  ambassadorCode: string
}) {
  const { to, fullName, ambassadorCode } = params
  const siteUrl = getEmailAssetsBaseUrl()

  const html = wrapHtmlWithLayout({
    preview: 'Ton code ambassadeur est prêt',
    htmlContent: `
      <h2 style="margin: 0 0 12px; font-size: 20px;">Ton code ambassadeur est prêt</h2>
      <p style="margin: 0 0 12px;">Hello ${fullName || 'ambassadeur'} 👋</p>
      <p style="margin: 0 0 12px;">
        Voici ton code unique à partager pour faire entrer de nouveaux athlètes dans l’aventure :
      </p>
      <div style="margin: 0 0 16px; padding: 12px 16px; border-radius: 10px; background: #f3f4f6; display: inline-block;">
        <strong style="font-size: 18px; letter-spacing: 1px;">${ambassadorCode}</strong>
      </div>
      <p style="margin: 0 0 12px;">
        Chaque inscription validée avec ton code te fait grimper de palier et débloquer des récompenses.
      </p>
      <p style="margin: 16px 0 0;">
        <a href="${siteUrl}/ambassadors/dashboard" style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;">
          Suivre mes points
        </a>
      </p>
      <p style="margin: 12px 0 0; font-size: 13px; color: #6b7280;">
        Tu peux aussi partager ton lien directement depuis l’espace ambassadeur.
      </p>
    `,
  })

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: 'Ton code ambassadeur est prêt',
    html,
  })
}
