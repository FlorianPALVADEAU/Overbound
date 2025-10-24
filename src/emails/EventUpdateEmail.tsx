import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

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
  const hasDateChange = previousDate && newDate && previousDate !== newDate
  const hasLocationChange = previousLocation && newLocation && previousLocation !== newLocation

  return (
    <Html>
      <Head />
      <Preview>Mise à jour importante — {eventTitle}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {participantName ? `${participantName},` : 'Bonjour,'}
            </Text>
            <Text style={styles.paragraph}>
              Nous avons une mise à jour concernant <strong>{eventTitle}</strong>.
            </Text>
            {hasDateChange ? (
              <Text style={styles.paragraph}>
                <strong>Nouvelle date :</strong> {newDate}<br />
                {previousDate ? (
                  <span style={styles.note}>Ancienne date : {previousDate}</span>
                ) : null}
              </Text>
            ) : null}
            {hasLocationChange ? (
              <Text style={styles.paragraph}>
                <strong>Nouveau lieu :</strong> {newLocation}<br />
                {previousLocation ? (
                  <span style={styles.note}>Ancien lieu : {previousLocation}</span>
                ) : null}
              </Text>
            ) : null}
            {statusMessage ? (
              <Text style={styles.highlight}>{statusMessage}</Text>
            ) : null}
            <Text style={styles.paragraph}>
              <Link href={manageUrl} style={styles.button}>
                Gérer mon inscription
              </Link>
            </Text>
            <Text style={styles.secondary}>
              Merci de vérifier tes disponibilités. Si tu as des questions, réponds à cet email — l’équipe OverBound est là pour toi.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default EventUpdateEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f9fafb',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    padding: '24px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '560px',
    border: '1px solid #e5e7eb',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '16px',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '14px',
  },
  note: {
    display: 'block',
    marginTop: '6px',
    fontSize: '14px',
    color: '#6b7280',
  },
  highlight: {
    fontSize: '16px',
    marginBottom: '16px',
    backgroundColor: '#eef2ff',
    color: '#3730a3',
    padding: '12px',
    borderRadius: '10px',
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
