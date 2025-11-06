import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface EventPrepEmailProps {
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  weeksRemaining: number
  checklist: string[]
  trainingUrl: string
}

export function EventPrepEmail({
  participantName,
  eventTitle,
  eventDate,
  eventLocation,
  weeksRemaining,
  checklist,
  trainingUrl,
}: EventPrepEmailProps) {
  const preview = `${eventTitle} — Préparation à ${weeksRemaining} semaine(s)`

  return (
    <EmailLayout preview={preview}>
      <Section style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>Préparation OverBound</Text>
        <Text style={styles.heading}>
          {weeksRemaining === 0
            ? 'C’est presque l’heure !'
            : `${weeksRemaining} semaine${weeksRemaining > 1 ? 's' : ''} avant ${eventTitle}`}
        </Text>
        <Text style={styles.meta}>
          {eventDate} • {eventLocation}
        </Text>
      </Section>

      <Section style={styles.section}>
        <Text style={styles.paragraph}>Salut {participantName},</Text>
        <Text style={styles.paragraph}>
          La course approche, voici ta checklist du moment pour rester prêt(e).
        </Text>
        <ul style={styles.list}>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Text style={styles.paragraph}>
          Et pour aller plus loin, on t&apos;a préparé un bloc d’entraînement spécifique.
        </Text>
        <Text style={styles.paragraph}>
          <Link href={trainingUrl} style={styles.link}>
            Découvrir le plan d’entraînement
          </Link>
        </Text>
      </Section>

      <Section style={styles.section}>
        <Text style={styles.paragraphSmall}>
          Pour toute question, réponds simplement à cet email ou contacte l’équipe via contact@overbound-race.com.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default EventPrepEmail

const styles: Record<string, React.CSSProperties> = {
  sectionHeader: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  eyebrow: {
    color: '#6366f1',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '8px 0',
  },
  meta: {
    fontSize: '14px',
    color: '#6b7280',
  },
  section: {
    lineHeight: 1.6,
  },
  paragraph: {
    fontSize: '16px',
    margin: '12px 0',
  },
  paragraphSmall: {
    fontSize: '13px',
    color: '#6b7280',
  },
  list: {
    marginLeft: '18px',
    marginBottom: '18px',
  },
  link: {
    color: '#0f172a',
    textDecoration: 'underline',
  },
}
