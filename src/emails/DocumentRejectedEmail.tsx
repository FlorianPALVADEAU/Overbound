import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface DocumentRejectedEmailProps {
  participantName?: string | null
  eventTitle: string
  uploadUrl: string
  reason?: string | null
}

export function DocumentRejectedEmail({ participantName, eventTitle, uploadUrl, reason }: DocumentRejectedEmailProps) {
  return (
    <EmailLayout preview={`Document non validé pour ${eventTitle}`}>
      <Section style={styles.section}>
        <Text style={styles.heading}>Bonjour {participantName || ''}</Text>

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
          Nous restons disponibles si tu as des questions. Ce document est indispensable pour participer à l’événement.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default DocumentRejectedEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: 1.6,
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
