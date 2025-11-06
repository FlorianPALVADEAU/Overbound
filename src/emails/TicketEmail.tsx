import * as React from 'react'
import { Preview, Section, Text, Hr, Link, Img } from '@react-email/components'
import EmailLayout from './EmailLayout'

export default function TicketEmail({
  participantName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketName,
  qrUrl,
  manageUrl,
}: {
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketName: string
  qrUrl: string
  manageUrl: string
}) {
  return (
    <EmailLayout preview={`Ton billet OverBound — ${eventTitle}`}>
      <Section>
        <Img src="https://cdn.overbound.app/public/images/LOGO_FULL.webp" alt="OverBound" width="120" />
        <Text>Salut {participantName},</Text>
        <Text>Merci pour ton inscription à <b>{eventTitle}</b>.</Text>
        <Text>
          <b>Date</b> : {eventDate}<br />
          <b>Lieu</b> : {eventLocation}<br />
          <b>Format</b> : {ticketName}
        </Text>
        <Hr />
        <Img src={qrUrl} alt="QR Code" width="180" height="180" />
        <Text>Garde ce QR — on le scannera au check-in.</Text>
        <Text>
          Gérer mon inscription : <Link href={manageUrl}>{manageUrl}</Link>
        </Text>
        <Hr />
        <Text style={{ fontSize: 12, color: '#666' }}>
          Email transactionnel. Pour l'assistance : contact@overbound-race.com
        </Text>
      </Section>
    </EmailLayout>
  )
}