import * as React from 'react'
import { Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { EMAIL_COLORS, Eyebrow, FactList, Paragraph, SectionTitle, SmallPrint, Steps, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'

interface VolunteerEventSnapshot {
  id: string | null
  title: string | null
  date: string | null
  location: string | null
}

export interface VolunteerApplicationConfirmationEmailProps {
  applicantName: string
  preferredMission: string
  submittedAt: string
  event?: VolunteerEventSnapshot | null
}

export function VolunteerApplicationConfirmationEmail({
  applicantName,
  preferredMission,
  submittedAt,
  event = null,
}: VolunteerApplicationConfirmationEmailProps) {
  const formattedEventDate =
    event?.date && !Number.isNaN(Date.parse(event.date))
      ? new Date(event.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Paris',
        })
      : null
  const firstName = getFirstName(applicantName)

  return (
    <EmailLayout
      preview="On a bien reçu ta candidature bénévole. Réponse sous 48 h."
      hero={{ photo: 'P1090801', alt: 'Des bénévoles Overbound sur le parcours' }}
    >
      <Eyebrow>Candidature reçue</Eyebrow>
      <Title>{firstName ? `Merci ${firstName}` : 'Merci pour ta candidature'}</Title>
      <Paragraph>
        On a bien reçu ta candidature pour rejoindre les bénévoles Overbound. On revient vers toi sous 48 heures.
      </Paragraph>

      <FactList
        title="Ta candidature"
        rows={[
          { label: 'Mission souhaitée', value: preferredMission },
          { label: 'Événement', value: event?.title },
          { label: 'Date', value: formattedEventDate },
          { label: 'Lieu', value: event?.location },
          { label: 'Reçue le', value: submittedAt },
        ]}
      />

      <SectionTitle>La suite</SectionTitle>
      <Steps
        items={[
          { title: 'On vérifie les besoins', text: 'On regarde ce qu’il faut sur l’événement, mission par mission.' },
          { title: 'On te confirme ton créneau', text: 'Tu reçois un email avec ta mission, tes horaires et les consignes d’arrivée.' },
        ]}
      />

      <SmallPrint>
        Un empêchement ou une précision à ajouter ? Réponds simplement à cet email. En attendant, tu peux suivre les coulisses
        sur{' '}
        <Link href="https://www.instagram.com/overbound.race" style={{ color: EMAIL_COLORS.eyebrow }}>
          Instagram
        </Link>
        .
      </SmallPrint>
    </EmailLayout>
  )
}

export default VolunteerApplicationConfirmationEmail
