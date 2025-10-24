import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

interface VolunteerAssignmentEmailProps {
  fullName?: string | null
  eventTitle: string
  eventDate: string
  eventLocation: string
  shiftStart: string
  shiftEnd: string
  arrivalInstructions?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  checkinUrl: string
}

export function VolunteerAssignmentEmail({
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
  const formattedEventDate = new Date(eventDate).toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return (
    <Html>
      <Head />
      <Preview>Confirmation mission bénévole — {eventTitle}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {fullName ? `${fullName}, bienvenue dans l’équipe bénévole !` : 'Bienvenue dans l’équipe bénévole !'}
            </Text>
            <Text style={styles.paragraph}>
              Merci de rejoindre l’organisation de <strong>{eventTitle}</strong>.<br />
              Voici les informations utiles pour ta mission :
            </Text>
            <div style={styles.infoBox}>
              <Text style={styles.paragraph}>
                <strong>Date :</strong> {formattedEventDate}<br />
                <strong>Lieu :</strong> {eventLocation}<br />
                <strong>Mission :</strong> Check-in participants<br />
                <strong>Horaires :</strong> {shiftStart} → {shiftEnd}
              </Text>
            </div>
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
            <Text style={styles.paragraph}>
              <Link href={checkinUrl} style={styles.button}>
                Accéder à l’outil de check-in
              </Link>
            </Text>
            <Text style={styles.secondary}>
              Pense à venir 15 minutes avant le début du shift pour le briefing. Merci pour ton engagement auprès de la communauté OverBound !
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VolunteerAssignmentEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#111827',
    fontFamily: 'Arial, sans-serif',
    color: '#f1f5f9',
    padding: '24px',
  },
  container: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '580px',
    border: '1px solid #334155',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#f8fafc',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '14px',
  },
  infoBox: {
    backgroundColor: '#f97316',
    color: '#0f172a',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  link: {
    color: '#f97316',
    textDecoration: 'underline',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    padding: '12px 20px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondary: {
    fontSize: '14px',
    color: '#cbd5f5',
    marginTop: '20px',
  },
}
