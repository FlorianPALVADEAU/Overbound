import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

interface DocumentRejectedEmailProps {
  participantName?: string | null
  eventTitle: string
  reason?: string | null
  uploadUrl: string
}

export function DocumentRejectedEmail({
  participantName,
  eventTitle,
  reason,
  uploadUrl,
}: DocumentRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Document à mettre à jour pour {eventTitle}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {participantName ? `${participantName}, nous avons besoin d'un nouveau document` : 'Document à mettre à jour'}
            </Text>
            <Text style={styles.paragraph}>
              Suite à notre vérification, ton document pour <strong>{eventTitle}</strong> ne peut pas être validé en l’état.
            </Text>
            {reason ? (
              <Text style={styles.paragraph}>
                Motif&nbsp;:<br />
                <span style={styles.reason}>{reason}</span>
              </Text>
            ) : null}
            <Text style={styles.paragraph}>
              Merci de déposer un nouveau document conforme en utilisant le lien suivant&nbsp;:
            </Text>
            <Text style={styles.paragraph}>
              <Link href={uploadUrl} style={styles.link}>
                Mettre à jour mon document
              </Link>
            </Text>
            <Text style={styles.secondary}>
              Nous restons disponibles si tu as des questions. Ce document est indispensable pour participerà l’événement.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DocumentRejectedEmail

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
  reason: {
    display: 'inline-block',
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
  },
  secondary: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#6b7280',
  },
}
