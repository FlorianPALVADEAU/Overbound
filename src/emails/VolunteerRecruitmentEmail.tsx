import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

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

export function VolunteerRecruitmentEmail({
  fullName,
  headlineEvent,
  otherEvents = [],
  callToActionUrl,
}: VolunteerRecruitmentEmailProps) {
  const formattedHeadlineDate = new Date(headlineEvent.date).toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  })

  return (
    <Html>
      <Head />
      <Preview>On a besoin de toi pour {headlineEvent.title}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {fullName ? `${fullName}, prêt·e à rejoindre l’équipe bénévole ?` : 'Prêt·e à rejoindre l’équipe bénévole ?'}
            </Text>
            <Text style={styles.paragraph}>
              Le prochain événement <strong>{headlineEvent.title}</strong> approche. On compte sur notre communauté pour assurer le welcome des participants.
            </Text>
            <div style={styles.highlightBox}>
              <Text style={styles.paragraph}>
                <strong>Date :</strong> {formattedHeadlineDate}<br />
                <strong>Lieu :</strong> {headlineEvent.location}<br />
                {headlineEvent.checkinWindow ? (
                  <>
                    <strong>Check-in :</strong> {headlineEvent.checkinWindow}
                  </>
                ) : null}
              </Text>
            </div>
            {otherEvents.length > 0 ? (
              <div style={styles.otherEvents}>
                <Text style={styles.paragraph}>Autres événements à venir :</Text>
                <ul style={styles.eventList}>
                  {otherEvents.map((event) => (
                    <li key={event.id} style={styles.eventItem}>
                      <span style={styles.eventTitle}>{event.title}</span>
                      <span style={styles.eventMeta}>
                        {new Date(event.date).toLocaleString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                        {' — '}
                        {event.location}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Text style={styles.paragraph}>
              <Link href={callToActionUrl} style={styles.button}>
                Je deviens bénévole sur cet événement
              </Link>
            </Text>
            <Text style={styles.secondary}>
              Brief, matériel, ambiance : on s’occupe de tout. Ta mission principale : offrir une expérience mémorable aux participants et gérer le check-in sur site.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VolunteerRecruitmentEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#0f172a',
    fontFamily: 'Arial, sans-serif',
    color: '#e2e8f0',
    padding: '24px',
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '600px',
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
    color: '#e2e8f0',
  },
  highlightBox: {
    backgroundColor: '#f97316',
    color: '#0f172a',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  otherEvents: {
    marginBottom: '20px',
  },
  eventList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  eventItem: {
    padding: '8px 0',
    borderBottom: '1px solid #334155',
  },
  eventTitle: {
    display: 'block',
    fontWeight: 600,
    color: '#f8fafc',
  },
  eventMeta: {
    fontSize: '14px',
    color: '#cbd5f5',
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
    color: '#94a3b8',
    marginTop: '20px',
  },
}
