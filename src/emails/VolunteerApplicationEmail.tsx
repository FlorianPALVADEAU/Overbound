import * as React from 'react'
import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'

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

export function VolunteerApplicationEmail({
  applicantName,
  applicantEmail,
  phone,
  preferredMission,
  availability,
  experience,
  motivations,
  submittedAt,
  event = null,
}: VolunteerApplicationEmailProps) {
  const formattedEventDate =
    event?.date && !Number.isNaN(Date.parse(event.date))
      ? new Date(event.date).toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : null

  return (
    <Html>
      <Head />
      <Preview>Nouvelle candidature bénévole — {applicantName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>Nouvelle candidature bénévole</Text>
            <Text style={styles.paragraph}>
              {applicantName} vient de déposer une candidature pour rejoindre l’équipe bénévole Overbound.
            </Text>
          </Section>

          <Section style={styles.section}>
            <Text style={styles.subheading}>Coordonnées</Text>
            <Text style={styles.paragraph}>
              <strong>Nom :</strong> {applicantName}
              <br />
              <strong>Email :</strong>{' '}
              <Link href={`mailto:${applicantEmail}`} style={styles.link}>
                {applicantEmail}
              </Link>
              <br />
              {phone ? (
                <>
                  <strong>Téléphone :</strong>{' '}
                  <Link href={`tel:${phone}`} style={styles.link}>
                    {phone}
                  </Link>
                  <br />
                </>
              ) : null}
              <strong>Soumis le :</strong> {submittedAt}
            </Text>
          </Section>

          {event ? (
            <Section style={styles.section}>
              <Text style={styles.subheading}>Événement ciblé</Text>
              <Text style={styles.paragraph}>
                <strong>{event.title ?? 'Événement Overbound'}</strong>
                <br />
                {formattedEventDate ? (
                  <>
                    <strong>Date :</strong> {formattedEventDate}
                    <br />
                  </>
                ) : null}
                {event.location ? (
                  <>
                    <strong>Lieu :</strong> {event.location}
                    <br />
                  </>
                ) : null}
                {event.id ? (
                  <>
                    <strong>ID Supabase :</strong> {event.id}
                    <br />
                  </>
                ) : null}
              </Text>
            </Section>
          ) : null}

          <Section style={styles.section}>
            <Text style={styles.subheading}>Disponibilités & mission</Text>
            <Text style={styles.paragraph}>
              <strong>Créneau proposé :</strong> {availability}
              <br />
              <strong>Mission souhaitée :</strong> {preferredMission}
            </Text>
          </Section>

          {experience ? (
            <Section style={styles.section}>
              <Text style={styles.subheading}>Expérience</Text>
              <Text style={styles.paragraph}>{experience}</Text>
            </Section>
          ) : null}

          {motivations ? (
            <Section style={styles.section}>
              <Text style={styles.subheading}>Motivations / message</Text>
              <Text style={styles.paragraph}>{motivations}</Text>
            </Section>
          ) : null}

          <Hr style={styles.divider} />
          <Text style={styles.footer}>
            Merci d’accuser réception auprès du bénévole et de l’ajouter aux effectifs de l’événement.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default VolunteerApplicationEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#0f172a',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
    color: '#e2e8f0',
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '640px',
    border: '1px solid #334155',
  },
  section: {
    marginBottom: '20px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '12px',
    color: '#f8fafc',
  },
  subheading: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#f8fafc',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#e2e8f0',
  },
  link: {
    color: '#fbbf24',
    textDecoration: 'none',
  },
  divider: {
    borderColor: '#334155',
    margin: '24px 0',
  },
  footer: {
    fontSize: '13px',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 1.4,
  },
}
