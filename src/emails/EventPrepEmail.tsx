import * as React from 'react'
import EmailLayout from './EmailLayout'
import { Checklist, CtaButton, Eyebrow, FactList, Paragraph, SectionTitle, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'

interface EventPrepEmailProps {
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  weeksRemaining: number
  checklist: string[]
  trainingUrl: string
}

export function EventPrepEmail({
  participantName,
  eventTitle,
  eventDate,
  eventLocation,
  weeksRemaining,
  checklist,
  trainingUrl,
}: EventPrepEmailProps) {
  const firstName = getFirstName(participantName)
  const countdown =
    weeksRemaining === 0
      ? 'C’est presque l’heure'
      : `Plus que ${weeksRemaining} semaine${weeksRemaining > 1 ? 's' : ''}`

  return (
    <EmailLayout
      preview={`${countdown} avant ${eventTitle}. Ta checklist du moment.`}
      hero={{ photo: 'log-carry1', alt: 'Deux participants portent un tronc ensemble' }}
    >
      <Eyebrow>Préparation</Eyebrow>
      <Title>{countdown} avant {eventTitle}</Title>
      <Paragraph>
        {firstName ? `${firstName}, la` : 'La'} course approche. Voici ce qu’il te reste à faire pour arriver prêt·e.
      </Paragraph>

      <FactList
        rows={[
          { label: 'Date', value: eventDate },
          { label: 'Lieu', value: eventLocation },
        ]}
      />

      <SectionTitle>Ta checklist</SectionTitle>
      <Checklist items={checklist} />

      <Paragraph muted>Pour t’entraîner, on a rassemblé des programmes adaptés au format de la course.</Paragraph>
      <CtaButton href={trainingUrl}>Voir les programmes d’entraînement</CtaButton>
    </EmailLayout>
  )
}

export default EventPrepEmail
