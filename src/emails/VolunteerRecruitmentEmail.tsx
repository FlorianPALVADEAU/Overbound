import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

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
      <Section style={styles.section}>
        <Text style={styles.heading}>Deviens bénévole pour {headlineEvent?.title}</Text>
        <Text style={styles.paragraph}>{fullName ? `Salut ${fullName},` : 'Salut,'} Nous cherchons des volontaires pour notre prochain événement.</Text>

        <div style={styles.highlightBox}>
          <Text style={styles.paragraph}>
            <strong>Date :</strong> {new Date(headlineEvent.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}<br />
            <strong>Lieu :</strong> {headlineEvent.location}
            {headlineEvent.checkinWindow ? (
              <><br /><strong>Check-in :</strong> {headlineEvent.checkinWindow}</>
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
                    {new Date(event.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })} — {event.location}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Text style={styles.paragraph}>
          <Link href={callToActionUrl} style={styles.button}>Je deviens bénévole sur cet événement</Link>
        </Text>

        <Text style={styles.secondary}>
          Brief, matériel, ambiance : on s’occupe de tout. Ta mission principale : offrir une expérience mémorable aux participants et gérer le check-in sur site.
        </Text>
      </Section>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: { lineHeight: 1.6 },
  heading: { fontSize: '22px', fontWeight: 700, marginBottom: '12px' },
  paragraph: { fontSize: '16px', marginBottom: '14px' },
  highlightBox: { backgroundColor: '#f97316', color: '#0f172a', borderRadius: '12px', padding: '16px', marginBottom: '20px' },
  otherEvents: { marginBottom: '20px' },
  eventList: { listStyleType: 'none', padding: 0, margin: 0 },
  eventItem: { padding: '8px 0', borderBottom: '1px solid #e5e7eb' },
  eventTitle: { display: 'block', fontWeight: 600 },
  eventMeta: { fontSize: '14px', color: '#6b7280' },
  button: { display: 'inline-block', backgroundColor: '#f8fafc', color: '#0f172a', padding: '12px 20px', borderRadius: '9999px', textDecoration: 'none', fontWeight: 600 },
  secondary: { fontSize: '14px', color: '#94a3b8', marginTop: '20px' },
}
