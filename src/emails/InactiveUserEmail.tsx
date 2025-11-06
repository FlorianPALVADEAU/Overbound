import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface InactiveUserEmailProps {
  fullName?: string | null
  lastEventTitle?: string | null
  eventsUrl: string
  highlightEventTitle?: string | null
  highlightEventUrl?: string | null
}

export function InactiveUserEmail({
  fullName,
  lastEventTitle,
  eventsUrl,
  highlightEventTitle,
  highlightEventUrl,
}: InactiveUserEmailProps) {
  const preview = 'Tu nous manques sur OverBound !'

  return (
    <EmailLayout preview={preview}>
      <Section style={styles.section}>
        <Text style={styles.heading}>
          {fullName ? `${fullName}, on reprend la ligne de départ ?` : 'On reprend la ligne de départ ?'}
        </Text>

        <Text style={styles.paragraph}>
          Ça fait un moment qu’on ne t’a pas vu sur OverBound.{' '}
          {lastEventTitle ? `Ton dernier challenge : ${lastEventTitle}.` : 'Vient te mesurer à nos nouveaux formats !'}
        </Text>

        {highlightEventTitle && highlightEventUrl ? (
          <Text style={styles.paragraph}>
            Le prochain rendez-vous : <strong>{highlightEventTitle}</strong>.{' '}
            <Link href={highlightEventUrl} style={styles.link}>
              Découvre le programme
            </Link>
          </Text>
        ) : null}

        <Text style={styles.paragraph}>
          <Link href={eventsUrl} style={styles.button}>
            Voir les événements à venir
          </Link>
        </Text>

        <Text style={styles.secondary}>
          Prépare-toi, de nouveaux obstacles t’attendent. On est prêts quand tu l’es !
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default InactiveUserEmail

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
  button: {
    display: 'inline-block',
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  secondary: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '20px',
  },
}
