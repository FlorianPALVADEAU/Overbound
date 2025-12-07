import * as React from 'react'
import { Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface EventReminderEmailProps {
  fullName?: string | null
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventUrl: string
  mapUrl?: string
  daysUntilEvent: number
  weatherInfo?: string
}

export function EventReminderEmail({
  fullName,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  eventUrl,
  mapUrl,
  daysUntilEvent,
  weatherInfo,
}: EventReminderEmailProps) {
  const eventImage = `${getEmailAssetsBaseUrl()}/images/images/participants-carrying-wooden-logs-going-uphill.avif`

  return (
    <EmailLayout
      preview={`Rappel: ${eventName} dans ${daysUntilEvent} jour${daysUntilEvent > 1 ? 's' : ''}`}
      showSocialLinks={true}
      showNavigationLinks={false}
    >
      <Section style={styles.section}>
        {/* Hero Image */}
        <Img
          src={eventImage}
          alt={eventName}
          width="400"
          style={styles.heroImage}
        />

        {/* Greeting */}
        <Text style={styles.greeting}>
          Cher{fullName ? ` ${fullName}` : ''}
        </Text>

        {/* Main Heading */}
        <Text style={styles.heading}>
          C'est bientôt le grand jour !
        </Text>

        {/* Reminder Message */}
        <Text style={styles.paragraph}>
          Plus que <b>{daysUntilEvent} jour{daysUntilEvent > 1 ? 's' : ''}</b> avant ton événement{' '}
          <b>{eventName}</b>. Es-tu prêt à repousser tes limites ?
        </Text>

        {/* Event Details Card */}
        <Section style={styles.card}>
          <Text style={styles.cardTitle}>Détails de l'événement</Text>
          <table style={styles.cardTable}>
            <tbody>
              <tr>
                <td style={styles.cardLabel}>📅 Date</td>
                <td style={styles.cardValue}>{eventDate}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>⏰ Heure</td>
                <td style={styles.cardValue}>{eventTime}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>📍 Lieu</td>
                <td style={styles.cardValue}>{eventLocation}</td>
              </tr>
              {weatherInfo && (
                <tr>
                  <td style={styles.cardLabel}>🌤️ Météo</td>
                  <td style={styles.cardValue}>{weatherInfo}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* CTA Buttons */}
        <Section style={styles.buttonContainer}>
          <Button href={eventUrl} style={styles.primaryButton}>
            Voir les détails
          </Button>
        </Section>

        {mapUrl && (
          <Section style={styles.buttonContainer}>
            <Button href={mapUrl} style={styles.secondaryButton}>
              Obtenir l'itinéraire
            </Button>
          </Section>
        )}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Checklist */}
        <Text style={styles.sectionTitle}>
          Liste de vérification avant la course
        </Text>

        <ul style={styles.list}>
          <li style={styles.listItem}>
            ✅ <b>Équipement sportif</b> - Vêtements adaptés et chaussures de course
          </li>
          <li style={styles.listItem}>
            ✅ <b>Hydratation</b> - Gourde ou bouteille d'eau remplie
          </li>
          <li style={styles.listItem}>
            ✅ <b>Nutrition</b> - Barres énergétiques ou snacks
          </li>
          <li style={styles.listItem}>
            ✅ <b>Échauffement</b> - Arrive 30 min avant pour t'échauffer
          </li>
          <li style={styles.listItem}>
            ✅ <b>Pièce d'identité</b> - Pour le check-in sur place
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Motivational Section */}
        <Section style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            "Le seul obstacle insurmontable est celui que tu ne tentes pas de franchir."
          </Text>
          <Text style={styles.motivationAuthor}>
            - L'équipe Overbound
          </Text>
        </Section>

        {/* Support */}
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

export default EventReminderEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  heroImage: {
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  greeting: {
    width: '100%',
    textAlign: 'center',
    fontSize: '16px',
    margin: '0 0 8px 0',
    color: '#111827',
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
    color: '#111827',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
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
    width: '40%',
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
  motivationCard: {
    backgroundColor: '#ecfdf5',
    borderLeft: '4px solid #16a34a',
    padding: '20px',
    marginBottom: '32px',
    borderRadius: '4px',
  },
  motivationText: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: '#111827',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  motivationAuthor: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    textAlign: 'center',
  },
  smallText: {
    fontSize: '14px',
    textAlign: 'center',
    color: '#6b7280',
    margin: '0',
  },
}
