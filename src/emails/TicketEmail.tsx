import * as React from 'react'
import { Preview, Section, Text, Hr, Link, Img, Button } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'

export default function TicketEmail({
  participantName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketName,
  startTime,
  qrUrl,
  manageUrl,
}: {
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketName: string
  startTime?: string | null
  qrUrl: string
  manageUrl: string
}) {
  return (
    <EmailLayout preview={`Ton billet OverBound — ${eventTitle}`}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/two-runners-going-downhill-with-chains-on-their-backs.avif`}
        alt="Ton billet Overbound"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Success Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.successIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#d1fae5" />
              <path
                d="M20 32l8 8 16-16"
                stroke="#16a34a"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Ton billet est prêt !
        </Text>

        {/* Greeting */}
        <Text style={styles.paragraph}>
          Salut {participantName}, merci pour ton inscription à <strong>{eventTitle}</strong>.
        </Text>

        <Text style={styles.paragraph}>
          Ton billet est maintenant disponible ! Clique sur le bouton ci-dessous pour y accéder et visualiser ton QR code de check-in.
        </Text>

        {/* CTA Button - Moved up */}
        <Section style={styles.buttonContainerTop}>
          <Button href={manageUrl} style={styles.button}>
            Voir mon billet
          </Button>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Event Details Card */}
        <Section style={styles.card}>
          <Text style={styles.cardTitle}>Détails de ton événement</Text>
          <table style={styles.cardTable}>
            <tbody>
              <tr>
                <td style={styles.cardLabel}>📅 Date</td>
                <td style={styles.cardValue}>{eventDate}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>📍 Lieu</td>
                <td style={styles.cardValue}>{eventLocation}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>🎯 Format</td>
                <td style={styles.cardValue}>{ticketName}</td>
              </tr>
              {startTime ? (
                <tr>
                  <td style={styles.cardLabel}>⏱ Départ</td>
                  <td style={styles.cardValue}>{startTime}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Section>
        {startTime ? (
          <Text style={styles.paragraph}>
            Merci de te présenter au minimum 1h avant ton départ.
          </Text>
        ) : null}
        <Text style={styles.footerText}>
          Règlement officiel Overbound 2026 :{' '}
          <Link href={OFFICIAL_RULEBOOK_PDF_PATH} style={styles.link}>
            consulter le PDF
          </Link>
          .
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
    margin: '24px 0',
  },
  buttonContainerTop: {
    textAlign: 'center',
    margin: '32px 0',
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
  },
}
