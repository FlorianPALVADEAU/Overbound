import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

interface DocumentRequiredEmailProps {
  participantName?: string | null
  eventTitle: string
  uploadUrl: string
  requiredDocuments: string[]
}

export function DocumentRequiredEmail({
  participantName,
  eventTitle,
  uploadUrl,
  requiredDocuments,
}: DocumentRequiredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Documents requis pour {eventTitle}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {participantName ? `Bonjour ${participantName},` : 'Bonjour,'}
            </Text>

            <Text style={styles.paragraph}>
              Pour finaliser ton inscription à <strong>{eventTitle}</strong>, nous avons besoin de valider
              un document avant le départ.
            </Text>

            {requiredDocuments.length > 0 ? (
              <Text style={styles.paragraph}>
                Document(s) attendu(s)&nbsp;:
                <ul style={styles.list}>
                  {requiredDocuments.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
              </Text>
            ) : null}

            <Text style={styles.paragraph}>
              <Link href={uploadUrl} style={styles.link}>
                Déposer mon document maintenant
              </Link>
            </Text>

            <Text style={styles.paragraph}>
              Dès réception, notre équipe vérifiera ton document. Tu seras informé·e par email lorsqu’il sera validé.
            </Text>

            <Text style={styles.secondary}>
              Si tu as déjà envoyé ce document, considère ce message comme un rappel — il peut y avoir un léger délai de traitement.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default DocumentRequiredEmail

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
  list: {
    margin: '8px 0 0 18px',
  },
  secondary: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#6b7280',
  },
}
