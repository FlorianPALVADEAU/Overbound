import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

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
      <Section style={styles.section}>
        <Text style={styles.heading}>Bonjour {displayName},</Text>
        <Text style={styles.paragraph}>
          {role ? <>Tu as été assigné·e à la mission <b>{role}</b> pour {eventTitle}.</> : <>Ta mission pour <b>{eventTitle}</b> est confirmée.</>}
        </Text>
        <Text style={styles.paragraph}>
          <b>Date</b> : {date}<br />
          <b>Lieu</b> : {location}
        </Text>

        {shiftStart || shiftEnd ? (
          <Text style={styles.paragraph}>
            <strong>Horaires :</strong> {shiftStart} → {shiftEnd}
          </Text>
        ) : null}

        {/* details URL not provided in some callers; keep CTA to check-in tool if available */}

        {arrivalInstructions ? (
          <Text style={styles.paragraph}>{arrivalInstructions}</Text>
        ) : null}

        {(contactEmail || contactPhone) ? (
          <Text style={styles.paragraph}>
            <strong>Contact responsable :</strong><br />
            {contactEmail ? <span>Email : <Link href={`mailto:${contactEmail}`} style={styles.link}>{contactEmail}</Link><br /></span> : null}
            {contactPhone ? <span>Tél : {contactPhone}</span> : null}
          </Text>
        ) : null}

        {checkinUrl ? (
          <Text style={styles.paragraph}>
            <Link href={checkinUrl} style={styles.button}>Accéder à l’outil de check-in</Link>
          </Text>
        ) : null}

        <Text style={styles.secondary}>
          Pense à venir 15 minutes avant le début du shift pour le briefing. Merci pour ton engagement auprès de la communauté OverBound !
        </Text>
      </Section>
    </EmailLayout>
  )
}

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
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#f97316',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondary: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '16px',
  },
}
