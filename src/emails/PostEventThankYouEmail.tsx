import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

interface PostEventThankYouEmailProps {
  participantName: string
  eventTitle: string
  photosUrl?: string | null
  feedbackUrl: string
  nextEventUrl: string
}

export function PostEventThankYouEmail({
  participantName,
  eventTitle,
  photosUrl,
  feedbackUrl,
  nextEventUrl,
}: PostEventThankYouEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Merci d’avoir participé à {eventTitle}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              Merci {participantName} !
            </Text>
            <Text style={styles.paragraph}>
              Quelle course ! Merci d’avoir fait vibrer {eventTitle}. On espère que l’expérience t’a plu autant qu’à nous.
            </Text>
            {photosUrl ? (
              <Text style={styles.paragraph}>
                <Link href={photosUrl} style={styles.link}>
                  Découvre la galerie photos officielle
                </Link>
              </Text>
            ) : null}
            <Text style={styles.paragraph}>
              On adore avoir ton avis : il nous aide à rendre les prochaines éditions encore meilleures.
            </Text>
            <Text style={styles.paragraph}>
              <Link href={feedbackUrl} style={styles.link}>
                Donner mon feedback (2 minutes)
              </Link>
            </Text>
            <Text style={styles.paragraph}>
              Tu veux déjà planifier ton prochain défi ?{' '}
              <Link href={nextEventUrl} style={styles.link}>
                Explore les événements à venir
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PostEventThankYouEmail

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
    maxWidth: '560px',
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
    marginBottom: '12px',
  },
  link: {
    color: '#0f172a',
    textDecoration: 'underline',
    fontWeight: 600,
  },
}
