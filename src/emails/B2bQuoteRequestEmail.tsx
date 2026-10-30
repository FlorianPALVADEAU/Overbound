import * as React from 'react'
import { Hr, Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface B2bQuoteRequestEmailProps {
  companyName: string
  fullName: string
  email: string
  phone?: string | null
  teamSizeLabel: string
  projectTypeLabel: string
  message?: string | null
  utmSummary?: string | null
  submittedAt: string
}

export function B2bQuoteRequestEmail({
  companyName,
  fullName,
  email,
  phone,
  teamSizeLabel,
  projectTypeLabel,
  message,
  utmSummary,
  submittedAt,
}: B2bQuoteRequestEmailProps) {
  return (
    <EmailLayout preview={`Demande de devis entreprise : ${companyName}`}>
      <Section style={styles.section}>
        <Text style={styles.heading}>Demande de devis : {companyName}</Text>

        <Text style={styles.paragraph}>
          <strong>{fullName}</strong> ({email}
          {phone ? `, ${phone}` : ''}) a rempli le formulaire de la page entreprises.
        </Text>

        <Text style={styles.paragraph}><strong>Équipe :</strong> {teamSizeLabel} personnes</Text>
        <Text style={styles.paragraph}><strong>Projet :</strong> {projectTypeLabel}</Text>
        <Text style={styles.paragraph}><strong>Reçue le :</strong> {submittedAt}</Text>
        {utmSummary ? <Text style={styles.paragraph}><strong>Source :</strong> {utmSummary}</Text> : null}

        {message ? (
          <>
            <Hr style={styles.divider} />
            <Text style={styles.paragraph}><strong>Message :</strong></Text>
            <Text style={styles.message}>{message}</Text>
          </>
        ) : null}

        <Hr style={styles.divider} />
        <Text style={styles.secondary}>Réponds directement à cet e-mail : la réponse part à {email}. La demande est aussi dans la table b2b_quote_requests.</Text>
      </Section>
    </EmailLayout>
  )
}

export default B2bQuoteRequestEmail

const styles: Record<string, React.CSSProperties> = {
  section: { lineHeight: 1.6 },
  heading: { fontSize: '22px', fontWeight: 700, marginBottom: '12px' },
  paragraph: { fontSize: '16px', margin: '12px 0' },
  message: {
    fontSize: '16px',
    whiteSpace: 'pre-wrap',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  divider: { borderColor: '#e5e7eb', margin: '24px 0' },
  secondary: { fontSize: '14px', color: '#6b7280' },
}
