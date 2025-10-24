import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

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
  return (
    <Html>
      <Head />
      <Preview>Tu nous manques sur OverBound !</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
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
        </Container>
      </Body>
    </Html>
  )
}

export default InactiveUserEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    padding: '24px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '540px',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '16px',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '14px',
  },
  link: {
    color: '#1d4ed8',
    textDecoration: 'underline',
    fontWeight: 600,
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
