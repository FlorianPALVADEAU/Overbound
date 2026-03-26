import * as React from 'react'
import { Preview, Section, Text, Hr, Link, Img, Button } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface VolunteerEventSnapshot {
  id: string | null
  title: string | null
  date: string | null
  location: string | null
}

export interface VolunteerApplicationEmailProps {
  applicantName: string
  applicantEmail: string
  phone?: string | null
  preferredMission: string
  availability: string
  experience?: string | null
  motivations?: string | null
  submittedAt: string
  event?: VolunteerEventSnapshot | null
}

export function VolunteerApplicationEmail({ applicantName, applicantEmail, phone, preferredMission, availability, experience, motivations, submittedAt, event = null }: VolunteerApplicationEmailProps) {
  const formattedEventDate = event?.date && !Number.isNaN(Date.parse(event.date))
    ? new Date(event.date).toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Europe/Paris',
      })
    : null

  return (
    <EmailLayout preview={`Nouvelle candidature bénévole — ${applicantName}`}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/a-young-girl-climbing-a-ladder-with-many-other-participants-watching-her.avif`}
        alt="Nouvelle candidature bénévole"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.notificationIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#fff7ed" />
              <path
                d="M32 20v12l8 8M44 32c0 6.627-5.373 12-12 12s-12-5.373-12-12S25.373 20 32 20s12 5.373 12 12z"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Nouvelle candidature bénévole
        </Text>

        {/* Intro */}
        <Text style={styles.paragraph}>
          <strong>{applicantName}</strong> vient de déposer une candidature pour rejoindre l'équipe bénévole Overbound.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Applicant Details Card */}
        <Section style={styles.card}>
          <Text style={styles.cardTitle}>Coordonnées du candidat</Text>
          <table style={styles.cardTable}>
            <tbody>
              <tr>
                <td style={styles.cardLabel}>👤 Nom</td>
                <td style={styles.cardValue}>{applicantName}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>✉️ Email</td>
                <td style={styles.cardValue}>
                  <Link href={`mailto:${applicantEmail}`} style={styles.link}>
                    {applicantEmail}
                  </Link>
                </td>
              </tr>
              {phone && (
                <tr>
                  <td style={styles.cardLabel}>📱 Téléphone</td>
                  <td style={styles.cardValue}>
                    <Link href={`tel:${phone}`} style={styles.link}>
                      {phone}
                    </Link>
                  </td>
                </tr>
              )}
              <tr>
                <td style={styles.cardLabel}>📅 Soumis le</td>
                <td style={styles.cardValue}>{submittedAt}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Event Details */}
        {event && (
          <Section style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>🎯 Événement ciblé</Text>
            <Text style={styles.highlightText}>
              <strong>{event.title ?? 'Événement Overbound'}</strong>
            </Text>
            {formattedEventDate && (
              <Text style={styles.highlightMeta}>
                📅 {formattedEventDate}
              </Text>
            )}
            {event.location && (
              <Text style={styles.highlightMeta}>
                📍 {event.location}
              </Text>
            )}
            {event.id && (
              <Text style={styles.highlightMetaSmall}>
                ID: {event.id}
              </Text>
            )}
          </Section>
        )}

        {/* Availability & Mission Card */}
        <Section style={styles.card}>
          <Text style={styles.cardTitle}>Disponibilités & mission</Text>
          <table style={styles.cardTable}>
            <tbody>
              <tr>
                <td style={styles.cardLabel}>⏰ Créneau</td>
                <td style={styles.cardValue}>{availability}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>🎯 Mission</td>
                <td style={styles.cardValue}>{preferredMission}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Experience */}
        {experience && (
          <Section style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>💼 Expérience</Text>
            <Text style={styles.detailsText}>{experience}</Text>
          </Section>
        )}

        {/* Motivations */}
        {motivations && (
          <Section style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>💬 Motivations / message</Text>
            <Text style={styles.detailsText}>{motivations}</Text>
          </Section>
        )}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Footer Message */}
        <Text style={styles.footerText}>
          📋 <strong>Action requise :</strong> Merci d'accuser réception auprès du bénévole et de l'ajouter aux effectifs de l'événement.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default VolunteerApplicationEmail

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
  notificationIcon: {
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
  highlightCard: {
    backgroundColor: '#fff7ed',
    border: '2px solid #f97316',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  highlightTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#111827',
    textAlign: 'center',
  },
  highlightText: {
    fontSize: '15px',
    color: '#111827',
    margin: '0 0 8px 0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  highlightMeta: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  highlightMetaSmall: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '8px 0 0 0',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  },
  detailsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    color: '#111827',
  },
  detailsText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.6',
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
