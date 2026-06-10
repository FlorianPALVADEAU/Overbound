import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface VolunteerEventInfo {
  id: string
  title: string
  date: string
  location: string
  checkinWindow?: string | null
}

interface VolunteerRecruitmentEmailProps {
  fullName?: string | null
  headlineEvent: VolunteerEventInfo
  otherEvents?: VolunteerEventInfo[]
  callToActionUrl: string
}

export default function VolunteerRecruitmentEmail({ fullName, headlineEvent, otherEvents = [], callToActionUrl }: VolunteerRecruitmentEmailProps) {
  const preview = `Nous avons besoin de toi — ${headlineEvent?.title || 'missions bénévoles'}`

  return (
    <EmailLayout preview={preview}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/a-group-of-friend-celebrating-after-a-race.avif`}
        alt="Rejoins l'équipe bénévole"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Volunteer Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.volunteerIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#fff7ed" />
              <path
                d="M32 36c6.627 0 12-5.373 12-12s-5.373-12-12-12-12 5.373-12 12 5.373 12 12 12zM32 40c-8 0-24 4-24 12v4h48v-4c0-8-16-12-24-12z"
                fill="#f97316"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Deviens bénévole !
        </Text>

        {/* Greeting */}
        <Text style={styles.paragraph}>
          {fullName ? `Salut ${fullName}` : 'Salut'}, nous cherchons des volontaires passionnés pour{' '}
          <strong>{headlineEvent.title}</strong>.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Event Details Card */}
        <Section style={styles.highlightCard}>
          <Text style={styles.cardTitle}>Détails de la mission</Text>
          <table style={styles.detailsTable}>
            <tbody>
              <tr>
                <td style={styles.detailLabel}>📅 Date</td>
                <td style={styles.detailValue}>
                  {new Date(headlineEvent.date).toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                    timeZone: 'Europe/Paris',
                  })}
                </td>
              </tr>
              <tr>
                <td style={styles.detailLabel}>📍 Lieu</td>
                <td style={styles.detailValue}>{headlineEvent.location}</td>
              </tr>
              {headlineEvent.checkinWindow && (
                <tr>
                  <td style={styles.detailLabel}>⏰ Check-in</td>
                  <td style={styles.detailValue}>{headlineEvent.checkinWindow}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={callToActionUrl} style={styles.ctaButton}>
            Je postule comme bénévole
          </Button>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Benefits */}
        <Text style={styles.sectionTitle}>Ce que nous offrons</Text>
        <ul style={styles.benefitsList}>
          <li style={styles.benefitItem}>
            ✨ <strong>Expérience unique</strong> - Participe à l'organisation d'événements sportifs exceptionnels
          </li>
          <li style={styles.benefitItem}>
            🎽 <strong>T-shirt bénévole</strong> - Reçois ton t-shirt officiel Overbound
          </li>
          <li style={styles.benefitItem}>
            🍔 <strong>Repas offert</strong> - Restauration et boissons fournis sur place
          </li>
          <li style={styles.benefitItem}>
            🎉 <strong>Équipe sympa</strong> - Rejoins une communauté de bénévoles passionnés
          </li>
        </ul>
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
  volunteerIcon: {
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
  highlightCard: {
    backgroundColor: '#fff7ed',
    border: '2px solid #f97316',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#f97316',
    textAlign: 'center',
  },
  detailsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#92400e',
    paddingBottom: '12px',
    verticalAlign: 'top',
    width: '35%',
    fontWeight: 600,
  },
  detailValue: {
    fontSize: '15px',
    color: '#111827',
    paddingBottom: '12px',
    verticalAlign: 'top',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  ctaButton: {
    backgroundColor: '#f97316',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  otherEventsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  eventItem: {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  eventItemLast: {
    marginBottom: '0',
  },
  eventTitle: {
    display: 'block',
    fontWeight: 600,
    fontSize: '15px',
    color: '#111827',
    margin: '0 0 4px 0',
  },
  eventMeta: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0',
  },
  benefitsList: {
    marginLeft: '0',
    paddingLeft: '20px',
    marginBottom: '32px',
    color: '#111827',
  },
  benefitItem: {
    marginBottom: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
  },
  link: {
    color: '#f97316',
    textDecoration: 'underline',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
  },
}
