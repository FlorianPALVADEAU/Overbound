import * as React from 'react'
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components'

interface SupportContactConfirmationEmailProps {
  fullName: string
  reason?: string
  message: string
  submittedAt: string
}

export function SupportContactConfirmationEmail({
  fullName,
  reason,
  message,
  submittedAt,
}: SupportContactConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nous avons bien reçu ta demande Overbound</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>Merci {fullName.split(' ')[0] ?? fullName},</Text>

            <Text style={styles.paragraph}>
              Nous avons bien reçu ta demande et un membre de la tribu support te répondra sous 24&nbsp;h
              ouvrées (48&nbsp;h pendant les week-ends de course).
            </Text>

            {reason ? (
              <Text style={styles.paragraph}>
                <strong>Motif indiqué :</strong> {reason}
              </Text>
            ) : null}

            <Text style={styles.paragraph}>
              <strong>Envoyé le :</strong> {submittedAt}
            </Text>

            <Hr style={styles.divider} />

            <Text style={styles.paragraph}>
              <strong>Rappel de ton message :</strong>
            </Text>
            <Text style={styles.message}>{message}</Text>

            <Hr style={styles.divider} />

            <Text style={styles.secondary}>
              Si tu dois ajouter des précisions ou des pièces jointes, réponds directement à cet e-mail :
              ta réponse arrivera sur le même fil de conversation.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SupportContactConfirmationEmail

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
    maxWidth: '600px',
  },
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
    margin: '12px 0',
  },
  message: {
    fontSize: '16px',
    whiteSpace: 'pre-wrap',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  divider: {
    borderColor: '#e5e7eb',
    margin: '24px 0',
  },
  secondary: {
    fontSize: '14px',
    color: '#6b7280',
  },
}
