import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

interface VolunteerEventSnapshot {
  id: string | null
  title: string | null
  date: string | null
  location: string | null
}

export interface VolunteerApplicationConfirmationEmailProps {
  applicantName: string
  preferredMission: string
  submittedAt: string
  event?: VolunteerEventSnapshot | null
}

export function VolunteerApplicationConfirmationEmail({
  applicantName,
  preferredMission,
  submittedAt,
  event = null,
}: VolunteerApplicationConfirmationEmailProps) {
  const formattedEventDate =
    event?.date && !Number.isNaN(Date.parse(event.date))
      ? new Date(event.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null

  return (
    <Html>
      <Head />
      <Preview>On a bien reçu ta candidature bénévole</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {applicantName ? `Merci ${applicantName} !` : 'Merci pour ta candidature !'}
            </Text>
            <Text style={styles.paragraph}>
              On a bien reçu ta candidature pour rejoindre la tribu bénévole Overbound. Notre équipe revient vers toi
              sous 48&nbsp;heures avec les prochaines étapes.
            </Text>
          </Section>

          {event ? (
            <Section style={styles.sectionHighlight}>
              <Text style={styles.highlightTitle}>{event.title ?? 'Événement Overbound'}</Text>
              {formattedEventDate ? (
                <Text style={styles.highlightMeta}>
                  <strong>Date :</strong> {formattedEventDate}
                </Text>
              ) : null}
              {event.location ? (
                <Text style={styles.highlightMeta}>
                  <strong>Lieu :</strong> {event.location}
                </Text>
              ) : null}
            </Section>
          ) : null}

          <Section style={styles.section}>
            <Text style={styles.subheading}>Ta mission proposée</Text>
            <Text style={styles.paragraph}>
              <strong>{preferredMission}</strong>
            </Text>
            <Text style={styles.paragraph}>
              Nous allons vérifier les besoins exacts sur l’événement et te confirmer le créneau idéal au plus vite.
            </Text>
          </Section>

          <Section style={styles.section}>
            <Text style={styles.paragraph}>
              Tu as un empêchement ou un complément d’information à partager ? Réponds directement à cet email, on
              t’accompagne jusqu’au jour J.
            </Text>
            <Text style={styles.paragraphSmall}>Candidature reçue le {submittedAt}</Text>
          </Section>

          <Section style={styles.section}>
            <Text style={styles.secondary}>
              En attendant, découvre les coulisses de la tribu et les témoignages des bénévoles la saison dernière.
            </Text>
            <Text style={styles.paragraph}>
              <Link href="https://www.instagram.com/overbound_race" style={styles.link}>
                Voir la tribu sur Instagram
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VolunteerApplicationConfirmationEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#0f172a',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    backgroundColor: '#111827',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '600px',
    color: '#e5e7eb',
    border: '1px solid #1f2937',
  },
  section: {
    marginBottom: '20px',
  },
  sectionHighlight: {
    marginBottom: '24px',
    backgroundColor: '#f97316',
    borderRadius: '12px',
    padding: '16px',
    color: '#111827',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    marginBottom: '12px',
    color: '#f9fafb',
  },
  subheading: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#f9fafb',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#e5e7eb',
  },
  paragraphSmall: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '12px',
  },
  highlightTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  highlightMeta: {
    fontSize: '14px',
    color: '#111827',
  },
  secondary: {
    fontSize: '14px',
    color: '#9ca3af',
    lineHeight: 1.5,
  },
  link: {
    color: '#f8fafc',
    backgroundColor: '#2563eb',
    padding: '10px 18px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
    display: 'inline-block',
    marginTop: '8px',
  },
}
