import * as React from 'react'
import EmailLayout from './EmailLayout'
import { Checklist, CtaButton, Eyebrow, FactList, Paragraph, SectionTitle, Title } from './blocks'

export interface BootcampRegistrationEmailProps {
  firstName: string | null
  bootcampTitle: string
  startsAt: string
  locationName: string
  locationAddress: string | null
}

export function BootcampRegistrationEmail({
  firstName,
  bootcampTitle,
  startsAt,
  locationName,
  locationAddress,
}: BootcampRegistrationEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'
  const valid = !Number.isNaN(Date.parse(startsAt))
  const formattedDate = valid
    ? new Date(startsAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Paris',
      })
    : startsAt
  const formattedTime = valid
    ? new Date(startsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
    : null

  return (
    <EmailLayout
      preview={`Ta place est confirmée : ${bootcampTitle}, ${formattedDate}.`}
      hero={{ photo: 'tire-drag', alt: 'Une participante tire un pneu pendant un bootcamp Overbound' }}
    >
      <Eyebrow>Inscription confirmée</Eyebrow>
      <Title>{firstName ? `${firstName}, ta place est réservée` : 'Ta place est réservée'}</Title>
      <Paragraph>
        Tu es inscrit·e au <strong>{bootcampTitle}</strong>. Voici ce qu’il faut retenir.
      </Paragraph>

      <FactList
        title="Ton bootcamp"
        rows={[
          { label: 'Date', value: formattedDate },
          { label: 'Heure', value: formattedTime },
          { label: 'Lieu', value: locationName },
          { label: 'Adresse', value: locationAddress },
        ]}
      />

      <SectionTitle>À avoir sur toi</SectionTitle>
      <Checklist
        items={[
          'Une tenue de sport adaptée à l’extérieur',
          'Des chaussures de trail ou de running',
          'Une gourde d’eau (1 L minimum)',
          'Arrive 10 minutes avant le départ',
        ]}
      />

      <Paragraph muted>Un empêchement ? Tu peux modifier ta présence depuis ton inscription.</Paragraph>
      <CtaButton href={`${baseUrl}/bootcamps`}>Gérer mon inscription</CtaButton>
    </EmailLayout>
  )
}

export default BootcampRegistrationEmail
