import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface NewEventAnnouncementEmailProps {
  fullName?: string | null
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  highlight?: string | null
  unsubscribeUrl?: string
}

export function NewEventAnnouncementEmail({ fullName, eventTitle, eventDate, eventLocation, eventUrl, highlight, unsubscribeUrl }: NewEventAnnouncementEmailProps) {
  return (
    <EmailLayout preview={`Nouvel événement OverBound — ${eventTitle}`} unsubscribeUrl={unsubscribeUrl}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/a-group-of-friend-celebrating-after-a-race.avif`}
        alt={eventTitle}
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Announcement Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.announcementIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#fef3c7" />
              <path
                d="M32 16v16l11 11M44 32c0 6.627-5.373 12-12 12s-12-5.373-12-12S25.373 20 32 20"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M20 40l-4 4m40-4l4 4"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          {fullName ? `${fullName}, ` : ''}Nouveau défi disponible !
        </Text>

        {/* Intro */}
        <Text style={styles.paragraph}>
          Les inscriptions pour <strong>{eventTitle}</strong> viennent d'ouvrir. Prépare-toi à vivre une expérience inoubliable.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Event Details Card */}
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

        {/* Highlight */}
        {highlight && (
          <Section style={styles.highlightCard}>
            <Text style={styles.highlightIcon}>⚡</Text>
            <Text style={styles.highlightText}>{highlight}</Text>
          </Section>
        )}

        {/* What's Included */}
        <Text style={styles.sectionTitle}>Ce qui t'attend</Text>
        <ul style={styles.featuresList}>
          <li style={styles.featureItem}>
            🏃 <strong>Parcours challengeant</strong> - Obstacles variés adaptés à tous les niveaux
          </li>
          <li style={styles.featureItem}>
            🎯 <strong>Formats multiples</strong> - Solo, duo ou équipe, choisis ton aventure
          </li>
          <li style={styles.featureItem}>
            📸 <strong>Photos professionnelles</strong> - En option, pour garder un souvenir de tous tes moments forts
          </li>
          <li style={styles.featureItem}>
            🎉 <strong>Ambiance unique</strong> - Musique, animation et esprit de communauté
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Urgency Card */}
        <Section style={styles.urgencyCard}>
          <Text style={styles.urgencyTitle}>⏰ Places limitées</Text>
          <Text style={styles.urgencyText}>
            Les événements OverBound affichent régulièrement complet. Plus tu réserves tôt, plus tu bénéficies du meilleur tarif.
          </Text>
        </Section>

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={eventUrl} style={styles.button}>
            Je découvre l'événement
          </Button>
        </Section>

        {/* Social Proof */}
        {/* <Section style={styles.statsCard}>
          <table style={styles.statsTable}>
            <tbody>
              <tr>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>5000+</Text>
                  <Text style={styles.statLabel}>Participants</Text>
                </td>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>4.8/5</Text>
                  <Text style={styles.statLabel}>Satisfaction</Text>
                </td>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>25+</Text>
                  <Text style={styles.statLabel}>Obstacles</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section> */}

        {/* Footer Message */}
        <Text style={styles.footerText}>
          On se retrouve sur la ligne de départ ! 💪
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default NewEventAnnouncementEmail

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
  announcementIcon: {
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
  eventCard: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  eventTitle: {
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  detailsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#92400e',
    paddingBottom: '8px',
    verticalAlign: 'top',
    width: '35%',
    fontWeight: 600,
  },
  detailValue: {
    fontSize: '15px',
    color: '#111827',
    paddingBottom: '8px',
    verticalAlign: 'top',
    fontWeight: 600,
  },
  highlightCard: {
    backgroundColor: '#dcfce7',
    border: '2px solid #16a34a',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  highlightIcon: {
    fontSize: '32px',
    margin: '0 0 8px 0',
  },
  highlightText: {
    fontSize: '16px',
    color: '#166534',
    fontWeight: 600,
    margin: '0',
    lineHeight: '1.6',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  featuresList: {
    marginLeft: '0',
    paddingLeft: '20px',
    marginBottom: '32px',
    color: '#111827',
  },
  featureItem: {
    marginBottom: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#6b7280',
  },
  urgencyCard: {
    backgroundColor: '#fee2e2',
    borderLeft: '4px solid #ef4444',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '24px',
  },
  urgencyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#991b1b',
  },
  urgencyText: {
    fontSize: '14px',
    color: '#7f1d1d',
    margin: '0',
    lineHeight: '1.6',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  statsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  statsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  statItem: {
    textAlign: 'center',
    padding: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
}
