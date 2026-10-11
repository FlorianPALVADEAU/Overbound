import { Resend } from 'resend'
import { COMPANY_INFO } from '@/constants/companyInfo'

const FROM = 'Overbound <no-reply@overbound-race.com>'

/** Plain-text on purpose: an internal alert and a legal acknowledgement, not marketing. */
export async function sendDeletionRequestEmails(user: { id: string; email: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY!)

  await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: COMPANY_INFO.emails.privacy,
      subject: `Demande de suppression de compte — ${user.email}`,
      text: `Demande d'effacement (RGPD art. 17) reçue.\n\nCompte : ${user.email}\nIdentifiant : ${user.id}\n\nDélai légal de réponse : un mois. La demande est listée dans la table account_deletion_requests (statut pending).`,
    }),
    resend.emails.send({
      from: FROM,
      to: user.email,
      subject: 'Overbound — ta demande de suppression est bien reçue',
      text: `Bonjour,\n\nNous avons bien reçu ta demande de suppression de compte et de données personnelles. Nous la traitons sous un mois maximum.\n\nCertaines données liées à un paiement (factures, preuve de commande) doivent être conservées pour nos obligations comptables légales : elles sont alors anonymisées ou isolées. Le détail est dans notre politique de confidentialité : https://overbound-race.com/privacy-policies#droits\n\nTu as changé d'avis ? Réponds à ce message avant le traitement de ta demande.\n\nUne question : ${COMPANY_INFO.emails.privacy}`,
    }),
  ])
}
