import { Resend } from 'resend'
import { wrapHtmlWithLayout } from '@/lib/email/wrapWithLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

const resend = new Resend(process.env.RESEND_API_KEY!)
const EMAIL_FROM = process.env.SEND_FROM_EMAIL || 'no-reply@overbound-race.com'

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
