import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

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

  return (
    <EmailLayout preview={`Mise à jour importante — ${eventTitle}`}>
      <Section style={styles.section}>
        <Text style={styles.heading}>{participantName ? `${participantName},` : 'Bonjour,'}</Text>

        <Text style={styles.paragraph}>
          Nous avons une mise à jour concernant <strong>{eventTitle}</strong>.
        </Text>

        {hasDateChange ? (
          <Text style={styles.paragraph}>
            <strong>Nouvelle date :</strong> {newDate}
            <br />
            {previousDate ? <span style={styles.note}>Ancienne date : {previousDate}</span> : null}
          </Text>
        ) : null}

        {hasLocationChange ? (
          <Text style={styles.paragraph}>
            <strong>Nouveau lieu :</strong> {newLocation}
            <br />
            {previousLocation ? <span style={styles.note}>Ancien lieu : {previousLocation}</span> : null}
          </Text>
        ) : null}

        {statusMessage ? <Text style={styles.highlight}>{statusMessage}</Text> : null}

        <Text style={styles.paragraph}>
          <Link href={manageUrl} style={styles.button}>
            Gérer mon inscription
          </Link>
        </Text>

        <Text style={styles.secondary}>
          Merci de vérifier tes disponibilités. Si tu as des questions, réponds à cet email — l’équipe OverBound est là pour toi.
        </Text>
      </Section>
    </EmailLayout>
  )
}

const styles: { [key: string]: any } = {
  section: {
    padding: '20px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    color: '#111827',
    marginBottom: '12px',
  },
  note: {
    display: 'block',
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '6px',
  },
  highlight: {
    display: 'block',
    backgroundColor: '#f3f4f6',
    padding: '10px',
    borderRadius: '6px',
    marginTop: '10px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondary: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '20px',
  },
}
