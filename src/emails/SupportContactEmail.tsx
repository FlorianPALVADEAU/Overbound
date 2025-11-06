import * as React from 'react'
import { Preview, Section, Text, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface SupportContactEmailProps {
  fullName: string
  email: string
  reason?: string
  message: string
  submittedAt: string
  hasAttachment?: boolean
}

export function SupportContactEmail({ fullName, email, reason, message, submittedAt, hasAttachment }: SupportContactEmailProps) {
  return (
    <EmailLayout preview="Nouvelle demande de contact Overbound">
      <Section style={styles.section}>
        <Text style={styles.heading}>Nouvelle demande de contact</Text>

        <Text style={styles.paragraph}><strong>{fullName}</strong> ({email}) vient d&apos;envoyer un message via le formulaire support.</Text>

        {reason ? <Text style={styles.paragraph}><strong>Motif :</strong> {reason}</Text> : null}

        <Text style={styles.paragraph}><strong>Reçu le :</strong> {submittedAt}</Text>

        <Hr style={styles.divider} />

        <Text style={styles.paragraph}><strong>Message :</strong></Text>
        <Text style={styles.message}>{message}</Text>

        <Hr style={styles.divider} />

        {hasAttachment ? <Text style={styles.paragraph}><strong>Dossier joint :</strong> un fichier est attaché à cet e-mail.</Text> : null}

        <Text style={styles.secondary}>Pense à répondre directement à {email} ou via l&apos;espace support pour garder une trace de l&apos;échange.</Text>
      </Section>
    </EmailLayout>
  )
}

export default SupportContactEmail

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
