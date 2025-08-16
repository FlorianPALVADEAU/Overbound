import { Resend } from 'resend'
import TicketEmail from '@/emails/TicketEmail'

const resend = new Resend(process.env.RESEND_API_KEY!)

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
  return resend.emails.send({
    from: 'OverBound <noreply@mail.overbound.com>',
    to: params.to,
    subject: `Ton billet — ${params.eventTitle}`,
    react: TicketEmail(params),
  })
}