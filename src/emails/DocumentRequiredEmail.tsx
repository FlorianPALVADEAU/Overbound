import * as React from 'react'
import { Preview, Section, Text, Link, Button } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'

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
    <EmailLayout preview={`Documents requis pour ${eventTitle}`}>
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

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={uploadUrl} style={styles.button}>
            Je dépose mon document dès maintenant
          </Button>
        </Section>
        
        <Text style={styles.paragraph}>
          Dès réception, notre équipe vérifiera ton document. Tu seras informé·e par email lorsqu’il sera validé.
        </Text>

        <Text style={styles.secondary}>
          Si tu as déjà envoyé ce document, considère ce message comme un rappel — il peut y avoir un léger délai de traitement.
        </Text>
        <Text style={styles.secondary}>
          Règlement officiel Overbound 2026 :{' '}
          <Link href={OFFICIAL_RULEBOOK_PDF_PATH} style={styles.link}>
            consulter le PDF
          </Link>
          .
        </Text>
      </Section>
    </EmailLayout>
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
  buttonContainer: {
    textAlign: 'center',
    margin: '32px 0',
  },
  button: {
    backgroundColor: 'red',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
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
