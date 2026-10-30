import * as React from 'react'
import { Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { Callout, CtaButton, EMAIL_COLORS, Eyebrow, FactList, Paragraph, SmallPrint, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'

interface EventUpdateEmailProps {
  participantName?: string | null
  eventTitle: string
  previousDate?: string | null
  newDate?: string | null
  previousLocation?: string | null
  newLocation?: string | null
  statusMessage?: string | null
  manageUrl: string
}

export function EventUpdateEmail({
  participantName,
  eventTitle,
  previousDate,
  newDate,
  previousLocation,
  newLocation,
  statusMessage,
  manageUrl,
}: EventUpdateEmailProps) {
  const hasDateChange = !!(previousDate && newDate && previousDate !== newDate)
  const hasLocationChange = !!(previousLocation && newLocation && previousLocation !== newLocation)
  const firstName = getFirstName(participantName)

  return (
    <EmailLayout preview={`Important : ${eventTitle} a changé. Regarde ce qui est modifié.`}>
      <Eyebrow>Mise à jour importante</Eyebrow>
      <Title>{eventTitle} a changé</Title>
      <Paragraph>
        {firstName ? `${firstName}, il` : 'Il'} y a une mise à jour sur ton inscription à <strong>{eventTitle}</strong>.
      </Paragraph>

      {hasDateChange || hasLocationChange ? (
        <FactList
          title="Ce qui change"
          rows={[
            { label: 'Nouvelle date', value: hasDateChange ? newDate : null },
            { label: 'Ancienne date', value: hasDateChange ? previousDate : null },
            { label: 'Nouveau lieu', value: hasLocationChange ? newLocation : null },
            { label: 'Ancien lieu', value: hasLocationChange ? previousLocation : null },
          ]}
        />
      ) : null}

      {statusMessage ? (
        <Callout tone="warning" title="Le message de l’équipe">
          {statusMessage}
        </Callout>
      ) : null}

      <Paragraph>Vérifie que tu es toujours disponible. Si ce n’est pas le cas, écris-nous : on regarde ensemble ce qu’il est possible de faire.</Paragraph>
      <CtaButton href={manageUrl}>Voir mon inscription</CtaButton>

      <SmallPrint>
        Une question ? Écris-nous à{' '}
        <Link href="mailto:contact@overbound-race.com" style={{ color: EMAIL_COLORS.eyebrow }}>
          contact@overbound-race.com
        </Link>
        .
      </SmallPrint>
    </EmailLayout>
  )
}

export default EventUpdateEmail
