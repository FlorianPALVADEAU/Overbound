import * as React from 'react'
import { Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface BookingConfirmationEmailProps {
  fullName?: string | null
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  bookingReference: string
  eventUrl: string
  accountUrl: string
  checkinUrl?: string
}

export function BookingConfirmationEmail({
  fullName,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  bookingReference,
  eventUrl,
  accountUrl,
  checkinUrl,
}: BookingConfirmationEmailProps) {
  return (
    <EmailLayout
      preview="Votre inscription est confirmée"
      showSocialLinks={false}
      showNavigationLinks={false}
    >
      <Section style={styles.section}>
        {/* Success Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.successIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="24" cy="24" r="24" fill="#d1fae5" />
              <path
                d="M16 24l6 6 10-12"
                stroke="#16a34a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Ton événement a été réservé
        </Text>

        {/* Confirmation Message */}
        <Text style={styles.paragraph}>
          Nous avons envoyé un email à tous les participants avec les détails de l'événement.
        </Text>

        {/* Event Details Card */}
        <Section style={styles.card}>
          <table style={styles.cardTable}>
            <tbody>
              <tr>
                <td style={styles.cardLabel}>Événement</td>
                <td style={styles.cardValue}>{eventName}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>Date</td>
                <td style={styles.cardValue}>{eventDate}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>Heure</td>
                <td style={styles.cardValue}>{eventTime}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>Lieu</td>
                <td style={styles.cardValue}>{eventLocation}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>Référence</td>
                <td style={styles.cardValue}>{bookingReference}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* CTA Buttons */}
        <Section style={styles.buttonContainer}>
          <Button href={eventUrl} style={styles.primaryButton}>
            Voir les détails de l'événement
          </Button>
        </Section>

        {checkinUrl && (
          <Section style={styles.buttonContainer}>
            <Button href={checkinUrl} style={styles.secondaryButton}>
              Compléter mon check-in
            </Button>
          </Section>
        )}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Next Steps */}
        <Text style={styles.sectionTitle}>
          Prochaines étapes
        </Text>

        <ul style={styles.list}>
          <li style={styles.listItem}>
            <b>Prépare-toi physiquement</b> - Consulte nos{' '}
            <Link href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://overbound-race.com'}/blog`} style={styles.link}>
              conseils d'entraînement
            </Link>
          </li>
          <li style={styles.listItem}>
            <b>Vérifie ton équipement</b> - Assure-toi d'avoir tout le matériel nécessaire
          </li>
          <li style={styles.listItem}>
            <b>Arrive à l'heure</b> - Présente-toi au moins 30 minutes avant le départ
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Support Section */}
        <Text style={styles.smallText}>
          Des questions ? Contacte-nous à{' '}
          <Link href="mailto:contact@overbound-race.com" style={styles.link}>
            contact@overbound-race.com
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default BookingConfirmationEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  iconContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  successIcon: {
    display: 'inline-block',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 32px 0',
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  cardTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  cardLabel: {
    fontSize: '14px',
    color: '#6b7280',
    paddingBottom: '12px',
    verticalAlign: 'top',
    width: '35%',
  },
  cardValue: {
    fontSize: '15px',
    color: '#111827',
    fontWeight: 600,
    paddingBottom: '12px',
    verticalAlign: 'top',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '16px 0',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#16a34a',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
    border: '2px solid #16a34a',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '32px 0',
    width: '100%',
    height: '1px',
    borderRadius: '1000px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  list: {
    marginLeft: '0',
    paddingLeft: '20px',
    marginBottom: '32px',
    color: '#111827',
  },
  listItem: {
    marginBottom: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  smallText: {
    fontSize: '14px',
    textAlign: 'center',
    color: '#6b7280',
    margin: '0',
  },
}
