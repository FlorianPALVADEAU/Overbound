import { Resend } from 'resend'
import TicketEmail from '@/emails/TicketEmail'
import OnboardingEmail from '@/emails/OnboardingEmail'
import ProfileCompletionReminderEmail from '@/emails/ProfileCompletionReminderEmail'
import EventPrepEmail from '@/emails/EventPrepEmail'
import PostEventThankYouEmail from '@/emails/PostEventThankYouEmail'
import { renderEmail } from '@/lib/email/render'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = 'OverBound <no-reply@overbound-race.com>'

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
    from: FROM,
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
    from: FROM,
    to: params.to,
    subject: 'Bienvenue sur OverBound',
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
    from: FROM,
    to: params.to,
    subject: 'Complète ton profil OverBound',
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
    from: FROM,
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
    from: FROM,
    to: params.to,
    subject: `Merci pour ${params.eventTitle}`,
    html,
  })
}
