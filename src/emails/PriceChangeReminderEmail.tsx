import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

interface PriceChangeReminderEmailProps {
  fullName?: string | null
  eventTitle: string
  eventDate: string
  deadlineLabel: string
  eventUrl: string
  currentPriceLabel: string
  nextPriceLabel?: string | null
}

export function PriceChangeReminderEmail({
  fullName,
  eventTitle,
  eventDate,
  deadlineLabel,
  eventUrl,
  currentPriceLabel,
  nextPriceLabel,
}: PriceChangeReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Dernier rappel — tarif change bientôt</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {fullName ? `${fullName}, dernière chance !` : 'Dernière chance !'}
            </Text>
            <Text style={styles.paragraph}>
              Le tarif actuel pour <strong>{eventTitle}</strong> se termine {deadlineLabel}.
            </Text>
            <Text style={styles.paragraph}>
              <strong>Prix actuel :</strong> {currentPriceLabel}<br />
              {nextPriceLabel ? (
                <>
                  <strong>Nouveau prix :</strong> {nextPriceLabel}
                </>
              ) : null}
            </Text>
            <Text style={styles.paragraph}>
              <Link href={eventUrl} style={styles.button}>
                Je profite du tarif actuel
              </Link>
            </Text>
            <Text style={styles.secondary}>
              Date de l’événement : {eventDate}.<br />
              Réserve ta place avant le changement de prix.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PriceChangeReminderEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f9fafb',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    padding: '24px',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '540px',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '14px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#dc2626',
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
