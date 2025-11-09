import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface PriceChangeReminderEmailProps {
  fullName?: string | null
  eventTitle: string
  eventDate: string
  deadlineLabel: string
  eventUrl: string
  currentPriceLabel: string
  nextPriceLabel?: string | null
  unsubscribeUrl?: string
}

export function PriceChangeReminderEmail({
  fullName,
  eventTitle,
  eventDate,
  deadlineLabel,
  eventUrl,
  currentPriceLabel,
  nextPriceLabel,
  unsubscribeUrl,
}: PriceChangeReminderEmailProps) {
  const preview = 'Dernier rappel — tarif change bientôt'

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <Section style={styles.section}>
        <Text style={styles.heading}>
          {fullName ? `${fullName}, dernière chance !` : 'Dernière chance !'}
        </Text>
        <Text style={styles.paragraph}>
          Le tarif actuel pour <strong>{eventTitle}</strong> se termine {deadlineLabel}.
        </Text>
        <Text style={styles.paragraph}>
          <strong>Prix actuel :</strong> {currentPriceLabel}
          {nextPriceLabel ? (
            <span>
              <br />
              <strong>Nouveau prix :</strong> {nextPriceLabel}
            </span>
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
    </EmailLayout>
  )
}

export default PriceChangeReminderEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: 1.6,
  },
  heading: {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '12px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#ef4444',
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
