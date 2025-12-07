import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface DocumentRejectedEmailProps {
  participantName?: string | null
  eventTitle: string
  uploadUrl: string
  reason?: string | null
}

export function DocumentRejectedEmail({ participantName, eventTitle, uploadUrl, reason }: DocumentRejectedEmailProps) {
  return (
    <EmailLayout preview={`Document non validé pour ${eventTitle}`}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/young-man-ramping-under-barbed-wires-with-overbound-headband.avif`}
        alt="Document à mettre à jour"
        width="400"
        style={styles.heroImage}
      />

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

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={uploadUrl} style={styles.button}>
            Mettre à jour mon document
          </Button>
        </Section>

        <Text style={styles.secondary}>
          Nous restons disponibles si tu as des questions. Ce document est indispensable pour participer à l’événement.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default DocumentRejectedEmail

const styles: Record<string, React.CSSProperties> = {
  heroImage: {
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '8px',
    marginBottom: '24px',
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
  section: {
    lineHeight: 1.6,
  },
  iconContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  alertIcon: {
    display: 'inline-block',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '16px',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    marginBottom: '12px',
    textAlign: 'center',
    color: '#6b7280',
  },
  link: {
    color: '#2563eb',
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
    textAlign: 'center',
  },
}
