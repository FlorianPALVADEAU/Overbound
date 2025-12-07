import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface VolunteerAssignmentEmailProps {
  // older callers provide volunteerName & role
  volunteerName?: string
  role?: string

  // lib/email.sendVolunteerAssignmentEmail provides these fields
  fullName?: string | null
  eventTitle: string
  eventDate?: string
  eventLocation?: string
  shiftStart?: string
  shiftEnd?: string
  arrivalInstructions?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  checkinUrl?: string
}

export default function VolunteerAssignmentEmail({
  volunteerName,
  role,
  fullName,
  eventTitle,
  eventDate,
  eventLocation,
  shiftStart,
  shiftEnd,
  arrivalInstructions,
  contactEmail,
  contactPhone,
  checkinUrl,
}: VolunteerAssignmentEmailProps) {
  const displayName = volunteerName ?? fullName ?? ''
  const date = eventDate ?? ''
  const location = eventLocation ?? ''
  const preview = `Mission bénévole assignée — ${eventTitle}`

  return (
    <EmailLayout preview={preview}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/speaker-talking-in-microphone.avif`}
        alt="Mission bénévole"
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
              <circle cx="32" cy="32" r="32" fill="#fff7ed" />
              <path
                d="M20 32l8 8 16-16"
                stroke="#f97316"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Mission confirmée !
        </Text>

        {/* Greeting */}
        <Text style={styles.paragraph}>
          {displayName ? `Salut ${displayName}, t` : 'T'}a mission pour <strong>{eventTitle}</strong> est confirmée.
          {role && <> Tu as été assigné·e à la mission <strong>{role}</strong>.</>}
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Mission Details Card */}
        <Section style={styles.card}>
          <Text style={styles.cardTitle}>Détails de ta mission</Text>
          <table style={styles.cardTable}>
            <tbody>
              <tr>
                <td style={styles.cardLabel}>📅 Date</td>
                <td style={styles.cardValue}>{date}</td>
              </tr>
              <tr>
                <td style={styles.cardLabel}>📍 Lieu</td>
                <td style={styles.cardValue}>{location}</td>
              </tr>
              {(shiftStart || shiftEnd) && (
                <tr>
                  <td style={styles.cardLabel}>⏰ Horaires</td>
                  <td style={styles.cardValue}>{shiftStart} → {shiftEnd}</td>
                </tr>
              )}
              {role && (
                <tr>
                  <td style={styles.cardLabel}>🎯 Rôle</td>
                  <td style={styles.cardValue}>{role}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* Arrival Instructions */}
        {arrivalInstructions && (
          <>
            <Section style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>📋 Instructions d'arrivée</Text>
              <Text style={styles.highlightText}>{arrivalInstructions}</Text>
            </Section>
          </>
        )}

        {/* Contact Information */}
        {(contactEmail || contactPhone) && (
          <>
            <Hr style={styles.separator} />
            <Section style={styles.contactCard}>
              <Text style={styles.contactTitle}>📞 Contact responsable</Text>
              {contactEmail && (
                <Text style={styles.contactItem}>
                  <strong>Email :</strong>{' '}
                  <Link href={`mailto:${contactEmail}`} style={styles.link}>
                    {contactEmail}
                  </Link>
                </Text>
              )}
              {contactPhone && (
                <Text style={styles.contactItem}>
                  <strong>Téléphone :</strong> {contactPhone}
                </Text>
              )}
            </Section>
          </>
        )}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* CTA Button */}
        {checkinUrl && (
          <Section style={styles.buttonContainer}>
            <Button href={checkinUrl} style={styles.button}>
              Accéder à l'outil de check-in
            </Button>
          </Section>
        )}

        {/* Footer Message */}
        <Text style={styles.footerText}>
          💡 <strong>Rappel important :</strong> Pense à venir 15 minutes avant le début du shift pour le briefing. Merci pour ton engagement auprès de la communauté OverBound !
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
    // 20% from the top to focus on speaker
    objectPosition: '0% 17%',
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
    margin: '0 0 12px 0',
    color: '#111827',
    textAlign: 'center',
  },
  highlightText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.6',
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  contactTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    color: '#111827',
    textAlign: 'center',
  },
  contactItem: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#f97316',
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
