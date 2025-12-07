import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

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
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/a-big-tire-is falling-upside-down-thanks-to-a-young-man.avif`}
        alt="Mise à jour événement"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Info Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.infoIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#dbeafe" />
              <path
                d="M32 28v12M32 20h.01"
                stroke="#2563eb"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Mise à jour importante
        </Text>

        {/* Greeting */}
        <Text style={styles.paragraph}>
          {participantName ? `${participantName}, n` : 'N'}ous avons une mise à jour concernant{' '}
          <strong>{eventTitle}</strong>.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Changes Card */}
        <Section style={styles.card}>
          <Text style={styles.cardTitle}>Modifications</Text>

          {hasDateChange && (
            <Section style={styles.changeItem}>
              <Text style={styles.changeLabel}>📅 Nouvelle date</Text>
              <Text style={styles.changeValue}>{newDate}</Text>
              {previousDate && (
                <Text style={styles.changeOld}>Ancienne date : {previousDate}</Text>
              )}
            </Section>
          )}

          {hasLocationChange && (
            <Section style={styles.changeItem}>
              <Text style={styles.changeLabel}>📍 Nouveau lieu</Text>
              <Text style={styles.changeValue}>{newLocation}</Text>
              {previousLocation && (
                <Text style={styles.changeOld}>Ancien lieu : {previousLocation}</Text>
              )}
            </Section>
          )}

          {statusMessage && (
            <Section style={styles.statusCard}>
              <Text style={styles.statusMessage}>{statusMessage}</Text>
            </Section>
          )}
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={manageUrl} style={styles.button}>
            Gérer mon inscription
          </Button>
        </Section>

        {/* Footer Message */}
        <Text style={styles.footerText}>
          Merci de vérifier tes disponibilités. Si tu as des questions, n'hésite pas à nous contacter à{' '}
          <Link href="mailto:contact@overbound-race.com" style={styles.link}>
            contact@overbound-race.com
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
  section: {
    lineHeight: '1.6',
  },
  iconContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  infoIcon: {
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
    margin: '0 0 24px 0',
    color: '#6b7280',
    textAlign: 'center',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '32px 0',
    width: '100%',
    height: '1px',
    borderRadius: '1000px',
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
    margin: '0 0 20px 0',
    color: '#111827',
    textAlign: 'center',
  },
  changeItem: {
    marginBottom: '20px',
  },
  changeLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  changeValue: {
    fontSize: '15px',
    color: '#16a34a',
    fontWeight: 600,
    margin: '0 0 4px 0',
  },
  changeOld: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '0',
    textDecoration: 'line-through',
  },
  statusCard: {
    backgroundColor: '#dbeafe',
    borderLeft: '4px solid #2563eb',
    padding: '16px',
    borderRadius: '4px',
    marginTop: '16px',
  },
  statusMessage: {
    fontSize: '14px',
    color: '#1e40af',
    margin: '0',
    lineHeight: '1.6',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
}
