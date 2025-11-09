import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

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
      <Section style={styles.section}>
        <Text style={styles.heading}>{fullName ? `${fullName},` : 'Salut,'}</Text>
        <Text style={styles.paragraph}>On vient d’ouvrir les inscriptions pour <strong>{eventTitle}</strong>.</Text>
        {highlight ? <Text style={styles.highlight}>{highlight}</Text> : null}
        <Text style={styles.paragraph}><strong>Date :</strong> {eventDate}<br /><strong>Lieu :</strong> {eventLocation}</Text>
        <Text style={styles.paragraph}><Link href={eventUrl} style={styles.button}>Je découvre l’événement</Link></Text>
        <Text style={styles.secondary}>Les places partent vite : n’attends pas pour choisir ton format préféré.</Text>
      </Section>
    </EmailLayout>
  )
}

export default NewEventAnnouncementEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f9fafb',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    padding: '24px',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '580px',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '14px',
  },
  highlight: {
    fontSize: '16px',
    marginBottom: '16px',
    backgroundColor: '#fef3c7',
    padding: '12px',
    borderRadius: '10px',
    color: '#92400e',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondary: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '20px',
  },
}
