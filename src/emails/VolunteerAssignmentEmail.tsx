import * as React from 'react'
import { Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { Callout, CtaButton, EMAIL_COLORS, Eyebrow, FactList, Paragraph, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'

interface VolunteerAssignmentEmailProps {
  // older callers provide volunteerName & role
  volunteerName?: string
  role?: string

  // lib/email.sendVolunteerAssignmentEmail provides these fields
  fullName?: string | null
  eventTitle: string
  eventDate?: string
  eventLocation?: string
  shiftStart?: string
  shiftEnd?: string
  arrivalInstructions?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  checkinUrl?: string
}

export default function VolunteerAssignmentEmail({
  volunteerName,
  role,
  fullName,
  eventTitle,
  eventDate,
  eventLocation,
  shiftStart,
  shiftEnd,
  arrivalInstructions,
  contactEmail,
  contactPhone,
  checkinUrl,
}: VolunteerAssignmentEmailProps) {
  const firstName = getFirstName(volunteerName ?? fullName)

  return (
    <EmailLayout
      preview={`Mission confirmée pour ${eventTitle}${shiftStart ? `, à partir de ${shiftStart}` : ''}.`}
      hero={{ photo: 'P1102314', alt: 'L’équipe Overbound réunie après une édition' }}
    >
      <Eyebrow>Mission confirmée</Eyebrow>
      <Title>{firstName ? `${firstName}, on compte sur toi` : 'On compte sur toi'}</Title>
      <Paragraph>
        Ta mission pour <strong>{eventTitle}</strong> est confirmée.
        {role ? (
          <>
            {' '}
            Tu es affecté·e à : <strong>{role}</strong>.
          </>
        ) : null}
      </Paragraph>

      <FactList
        title="Ta mission"
        rows={[
          { label: 'Date', value: eventDate },
          { label: 'Lieu', value: eventLocation },
          { label: 'Horaires', value: shiftStart || shiftEnd ? `${shiftStart ?? ''} à ${shiftEnd ?? ''}` : null },
          { label: 'Rôle', value: role },
        ]}
      />

      <Callout tone="warning" title="Arrive 15 minutes avant le début de ton shift">
        Un briefing a lieu avant la prise de poste. Merci pour ton engagement auprès de la communauté Overbound.
      </Callout>

      {arrivalInstructions ? (
        <Callout title="Consignes d’arrivée">{arrivalInstructions}</Callout>
      ) : null}

      {contactEmail || contactPhone ? (
        <FactList
          title="Ton contact sur place"
          rows={[
            {
              label: 'Email',
              value: contactEmail ? (
                <Link href={`mailto:${contactEmail}`} style={{ color: EMAIL_COLORS.eyebrow }}>
                  {contactEmail}
                </Link>
              ) : null,
            },
            { label: 'Téléphone', value: contactPhone },
          ]}
        />
      ) : null}

      {checkinUrl ? <CtaButton href={checkinUrl}>Ouvrir l’outil de check-in</CtaButton> : null}
    </EmailLayout>
  )
}
