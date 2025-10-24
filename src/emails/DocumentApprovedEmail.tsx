import * as React from 'react'
import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components'

interface DocumentApprovedEmailProps {
  participantName?: string | null
  eventTitle: string
}

export function DocumentApprovedEmail({ participantName, eventTitle }: DocumentApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Document validé pour {eventTitle}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {participantName ? `Bonne nouvelle ${participantName} !` : 'Bonne nouvelle !'}
            </Text>
            <Text style={styles.paragraph}>
              Ton document a été vérifié et validé pour l’événement <strong>{eventTitle}</strong>.
            </Text>
            <Text style={styles.paragraph}>
              Tu es maintenant prêt·e pour le jour J. Garde un œil sur tes emails, nous t’enverrons d’autres informations utiles à l’approche de l’événement.
            </Text>
            <Text style={styles.secondary}>
              Merci de ta réactivité et à très vite sur la ligne de départ !
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DocumentApprovedEmail

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
  secondary: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#6b7280',
  },
}
