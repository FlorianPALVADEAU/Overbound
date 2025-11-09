import { Resend } from 'resend'
import TicketEmail from '@/emails/TicketEmail'
import OnboardingEmail from '@/emails/OnboardingEmail'
import ProfileCompletionReminderEmail from '@/emails/ProfileCompletionReminderEmail'
import EventPrepEmail from '@/emails/EventPrepEmail'
import PostEventThankYouEmail from '@/emails/PostEventThankYouEmail'
import DocumentRequiredEmail from '@/emails/DocumentRequiredEmail'
import DocumentApprovedEmail from '@/emails/DocumentApprovedEmail'
import DocumentRejectedEmail from '@/emails/DocumentRejectedEmail'
import NewEventAnnouncementEmail from '@/emails/NewEventAnnouncementEmail'
import PriceChangeReminderEmail from '@/emails/PriceChangeReminderEmail'
import PromoCampaignEmail from '@/emails/PromoCampaignEmail'
import InactiveUserEmail from '@/emails/InactiveUserEmail'
import AbandonedCheckoutEmail from '@/emails/AbandonedCheckoutEmail'
import { EventUpdateEmail } from '@/emails/EventUpdateEmail'
import AdminDigestEmail from '@/emails/AdminDigestEmail'
import VolunteerRecruitmentEmail from '@/emails/VolunteerRecruitmentEmail'
import VolunteerAssignmentEmail from '@/emails/VolunteerAssignmentEmail'
import VolunteerApplicationEmail from '@/emails/VolunteerApplicationEmail'
import VolunteerApplicationConfirmationEmail from '@/emails/VolunteerApplicationConfirmationEmail'
import SupportContactEmail from '@/emails/SupportContactEmail'
import SupportContactConfirmationEmail from '@/emails/SupportContactConfirmationEmail'
import { renderEmail } from '@/lib/email/render'

const resend = new Resend(process.env.RESEND_API_KEY!)

const UNFORMAL_FROM = 'Florian d\'Overbound <no-reply@overbound-race.com>'
const FORMAL_FROM = 'Overbound <no-reply@overbound-race.com>'

export async function sendTicketEmail(params: {
  to: string
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketName: string
  qrUrl: string
  manageUrl: string
}) {
  const html = await renderEmail(TicketEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `Ton billet — ${params.eventTitle}`,
    html,
  })
}

export async function sendOnboardingEmail(params: {
  to: string
  fullName?: string | null
  accountUrl: string
  eventsUrl: string
  blogUrl: string
}) {
  const html = await renderEmail(OnboardingEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: 'Bienvenue !',
    html,
  })
}

export async function sendProfileCompletionReminderEmail(params: {
  to: string
  fullName?: string | null
  accountUrl: string
  missingFields: string[]
}) {
  const html = await renderEmail(ProfileCompletionReminderEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: 'Complète ton profil',
    html,
  })
}

export async function sendEventPrepEmail(params: {
  to: string
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  weeksRemaining: number
  checklist: string[]
  trainingUrl: string
}) {
  const weeksLabel =
    params.weeksRemaining === 0
      ? "C'est presque l'heure !"
      : `${params.weeksRemaining} semaine${params.weeksRemaining > 1 ? 's' : ''} avant ${params.eventTitle}`

  const html = await renderEmail(EventPrepEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `${weeksLabel}`,
    html,
  })
}

export async function sendPostEventThankYouEmail(params: {
  to: string
  participantName: string
  eventTitle: string
  photosUrl?: string | null
  feedbackUrl: string
  nextEventUrl: string
}) {
  const html = await renderEmail(PostEventThankYouEmail(params))

  return resend.emails.send({
    from: FORMAL_FROM,
    to: params.to,
    subject: `Merci pour ${params.eventTitle}`,
    html,
  })
}

export async function sendDocumentRequiredEmail(params: {
  to: string
  participantName?: string | null
  eventTitle: string
  uploadUrl: string
  requiredDocuments: string[]
}) {
  const html = await renderEmail(DocumentRequiredEmail(params))

  return resend.emails.send({
    from: FORMAL_FROM,
    to: params.to,
    subject: `Document requis pour ${params.eventTitle}`,
    html,
  })
}

export async function sendDocumentApprovedEmail(params: {
  to: string
  participantName?: string | null
  eventTitle: string
}) {
  const html = await renderEmail(DocumentApprovedEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `Document validé — ${params.eventTitle}`,
    html,
  })
}

export async function sendDocumentRejectedEmail(params: {
  to: string
  participantName?: string | null
  eventTitle: string
  reason?: string | null
  uploadUrl: string
}) {
  const html = await renderEmail(DocumentRejectedEmail(params))

  return resend.emails.send({
    from: FORMAL_FROM,
    to: params.to,
    subject: `Action requise — document à mettre à jour pour ${params.eventTitle}`,
    html,
  })
}

export async function sendSupportContactEmail(params: {
  to: string
  requesterName: string
  requesterEmail: string
  reason?: string
  message: string
  submittedAt: string
  attachment?: {
    filename: string
    content: string
    contentType: string
  } | null
}) {
  const html = await renderEmail(
    SupportContactEmail({
      fullName: params.requesterName,
      email: params.requesterEmail,
      reason: params.reason,
      message: params.message,
      submittedAt: params.submittedAt,
      hasAttachment: Boolean(params.attachment),
    }),
  )

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    replyTo: params.requesterEmail,
    subject: `Support Overbound — ${params.reason || 'Nouvelle demande'}`,
    html,
    attachments: params.attachment
      ? [
          {
            filename: params.attachment.filename,
            content: params.attachment.content,
            contentType: params.attachment.contentType,
          },
        ]
      : undefined,
  })
}

export async function sendSupportContactConfirmationEmail(params: {
  to: string
  requesterName: string
  reason?: string
  message: string
  submittedAt: string
}) {
  const html = await renderEmail(
    SupportContactConfirmationEmail({
      fullName: params.requesterName,
      reason: params.reason,
      message: params.message,
      submittedAt: params.submittedAt,
    }),
  )

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: 'Nous avons bien reçu ta demande',
    html,
  })
}

export async function sendNewEventAnnouncementEmail(params: {
  to: string
  fullName?: string | null
  userId?: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  highlight?: string | null
}) {
  const { generateUnsubscribeUrl } = await import('@/lib/email/unsubscribe')
  const unsubscribeUrl = params.userId
    ? generateUnsubscribeUrl(params.userId, params.to)
    : undefined

  const html = await renderEmail(
    NewEventAnnouncementEmail({ ...params, unsubscribeUrl })
  )

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `Nouveau : ${params.eventTitle}`,
    html,
    headers: unsubscribeUrl
      ? {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined,
  })
}

export async function sendPriceChangeReminderEmail(params: {
  to: string
  fullName?: string | null
  userId?: string
  eventTitle: string
  eventDate: string
  deadlineLabel: string
  eventUrl: string
  currentPriceLabel: string
  nextPriceLabel?: string | null
}) {
  const { generateUnsubscribeUrl } = await import('@/lib/email/unsubscribe')
  const unsubscribeUrl = params.userId
    ? generateUnsubscribeUrl(params.userId, params.to)
    : undefined

  const html = await renderEmail(
    PriceChangeReminderEmail({ ...params, unsubscribeUrl })
  )

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `Dernier rappel — tarif ${params.eventTitle}`,
    html,
    headers: unsubscribeUrl
      ? {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined,
  })
}

export async function sendPromoCampaignEmail(params: {
  to: string
  fullName?: string | null
  userId?: string
  title: string
  message: string
  ctaLabel: string
  ctaUrl: string
  promoCode?: string | null
  promoDetails?: string | null
}) {
  const { generateUnsubscribeUrl } = await import('@/lib/email/unsubscribe')
  const unsubscribeUrl = params.userId
    ? generateUnsubscribeUrl(params.userId, params.to)
    : undefined

  const html = await renderEmail(
    PromoCampaignEmail({ ...params, unsubscribeUrl })
  )

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: params.title,
    html,
    headers: unsubscribeUrl
      ? {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined,
  })
}

export async function sendInactiveUserEmail(params: {
  to: string
  fullName?: string | null
  lastEventTitle?: string | null
  eventsUrl: string
  highlightEventTitle?: string | null
  highlightEventUrl?: string | null
}) {
  const html = await renderEmail(InactiveUserEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: 'On repart ensemble ? 🏁',
    html,
  })
}

export async function sendAbandonedCheckoutEmail(params: {
  to: string
  fullName?: string | null
  eventTitle: string
  ticketName?: string | null
  resumeUrl: string
  incentive?: string | null
}) {
  const html = await renderEmail(AbandonedCheckoutEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `Ton inscription à ${params.eventTitle} est presque terminée`,
    html,
  })
}

export async function sendEventUpdateEmail(params: {
  to: string
  participantName?: string | null
  eventTitle: string
  previousDate?: string | null
  newDate?: string | null
  previousLocation?: string | null
  newLocation?: string | null
  statusMessage?: string | null
  manageUrl: string
}) {
  const html = await renderEmail(EventUpdateEmail(params))

  return resend.emails.send({
    from: FORMAL_FROM,
    to: params.to,
    subject: `Mise à jour — ${params.eventTitle}`,
    html,
  })
}

export async function sendAdminDigestEmail(params: {
  to: string
  periodLabel: string
  totalActions: number
  totalErrors: number
  items: Array<{
    timestamp: string
    summary: string
    statusCode: number | null
    userEmail?: string | null
    actionType?: string | null
    path: string
    durationMs?: number | null
  }>
  logsUrl: string
}) {
  const html = await renderEmail(AdminDigestEmail(params))

  return resend.emails.send({
    from: FORMAL_FROM,
    to: params.to,
    subject: `Digest admin — ${params.periodLabel}`,
    html,
  })
}

export async function sendVolunteerRecruitmentEmail(params: {
  to: string
  fullName?: string | null
  headlineEvent: {
    id: string
    title: string
    date: string
    location: string
    checkinWindow?: string | null
  }
  otherEvents?: {
    id: string
    title: string
    date: string
    location: string
    checkinWindow?: string | null
  }[]
  callToActionUrl: string
}) {
  const html = await renderEmail(VolunteerRecruitmentEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `Nous avons besoin de toi pour ${params.headlineEvent.title}`,
    html,
  })
}

export async function sendVolunteerAssignmentEmail(params: {
  to: string
  fullName?: string | null
  eventTitle: string
  eventDate: string
  eventLocation: string
  shiftStart: string
  shiftEnd: string
  arrivalInstructions?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  checkinUrl: string
}) {
  const html = await renderEmail(VolunteerAssignmentEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: `Ta mission bénévole — ${params.eventTitle}`,
    html,
  })
}

export async function sendVolunteerApplicationEmail(params: {
  to: string
  applicantName: string
  applicantEmail: string
  phone?: string | null
  preferredMission: string
  availability: string
  experience?: string | null
  motivations?: string | null
  submittedAt: string
  event?: {
    id: string | null
    title: string | null
    date: string | null
    location: string | null
  } | null
}) {
  const html = await renderEmail(VolunteerApplicationEmail(params))

  return resend.emails.send({
    from: FORMAL_FROM,
    to: params.to,
    subject: `Nouvelle candidature bénévole — ${params.applicantName}`,
    html,
    replyTo: params.applicantEmail,
  })
}

export async function sendVolunteerApplicationConfirmationEmail(params: {
  to: string
  applicantName: string
  preferredMission: string
  submittedAt: string
  event?: {
    id: string | null
    title: string | null
    date: string | null
    location: string | null
  } | null
}) {
  const html = await renderEmail(VolunteerApplicationConfirmationEmail(params))

  return resend.emails.send({
    from: UNFORMAL_FROM,
    to: params.to,
    subject: 'On a bien reçu ta candidature bénévole',
    html,
  })
}
