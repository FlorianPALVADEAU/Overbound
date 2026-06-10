import * as React from 'react'
import { Button, Hr, Img, Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface EventOpeningEmailProps {
  fullName?: string | null
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  heroImageUrl?: string
  offerTitle?: string
  offerDescription?: string
}

export function EventOpeningEmail({
  fullName,
  eventTitle,
  eventDate,
  eventLocation,
  eventUrl,
  heroImageUrl,
  offerTitle,
  offerDescription,
}: EventOpeningEmailProps) {
  return (
    <EmailLayout preview={`Inscriptions ouvertes — ${eventTitle}`}>
      <Section style={styles.section}>
        {heroImageUrl ? (
          <Section style={styles.heroWrap}>
            <Img src={heroImageUrl} alt={eventTitle} width="400" style={styles.heroImage} />
          </Section>
        ) : null}

        <Text style={styles.heading}>
          {fullName ? `${fullName}, ` : ''}les inscriptions sont ouvertes !
        </Text>
        <Text style={styles.paragraph}>
          Tu nous as demandé de te prévenir : c&apos;est le moment de réserver ta place pour <strong>{eventTitle}</strong>.
        </Text>

        <Hr style={styles.separator} />

        <Section style={styles.eventCard}>
          <Text style={styles.eventTitle}>{eventTitle}</Text>
          <table style={styles.detailsTable}>
            <tbody>
              <tr>
                <td style={styles.detailLabel}>📅 Date</td>
                <td style={styles.detailValue}>{eventDate}</td>
              </tr>
              <tr>
                <td style={styles.detailLabel}>📍 Lieu</td>
                <td style={styles.detailValue}>{eventLocation}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {offerTitle ? (
          <Section style={styles.offerCard}>
            <Text style={styles.offerTitle}>{offerTitle}</Text>
            {offerDescription ? <Text style={styles.offerText}>{offerDescription}</Text> : null}
          </Section>
        ) : null}

        <Section style={styles.buttonContainer}>
          <Button href={eventUrl} style={styles.button}>
            Je m'inscris maintenant
          </Button>
        </Section>

        <Text style={styles.footerText}>
          Si tu ne souhaites plus recevoir ce type d'alerte, il te suffit d'ignorer cet email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default EventOpeningEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  heroWrap: {
    marginBottom: '20px',
  },
  heroImage: {
    width: '100%',
    maxWidth: '400px',
    height: 'auto',
    borderRadius: '12px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    color: '#6b7280',
    textAlign: 'center',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
    width: '100%',
  },
  eventCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
  },
  offerCard: {
    marginTop: '16px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #86efac',
    borderRadius: '12px',
    padding: '16px',
  },
  offerTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#166534',
    margin: '0 0 6px 0',
    textAlign: 'center',
  },
  offerText: {
    fontSize: '14px',
    color: '#14532d',
    margin: 0,
    textAlign: 'center',
  },
  eventTitle: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 12px 0',
  },
  detailsTable: {
    width: '100%',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
    padding: '4px 0',
    width: '90px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#111827',
    padding: '4px 0',
  },
  buttonContainer: {
    textAlign: 'center',
    marginTop: '24px',
  },
  button: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  footerText: {
    marginTop: '24px',
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
  },
}
