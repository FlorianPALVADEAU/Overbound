import * as React from 'react'
import { Link, Preview, Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface AbandonedCheckoutEmailProps {
  fullName?: string | null
  eventTitle: string
  ticketName?: string | null
  resumeUrl: string
  incentive?: string | null
}

export function AbandonedCheckoutEmail({
  fullName,
  eventTitle,
  ticketName,
  resumeUrl,
  incentive,
}: AbandonedCheckoutEmailProps) {
  return (
    <EmailLayout preview={`Ton inscription à ${eventTitle} t’attend`}>
      <Section style={styles.section}>
        <Text style={styles.heading}>
          {fullName ? `${fullName}, tout est prêt pour ton inscription` : 'Ton inscription est presque finalisée'}
        </Text>
        <Text style={styles.paragraph}>
          Tu étais sur le point de rejoindre <strong>{eventTitle}</strong>
          {ticketName ? ` — format ${ticketName}` : ''}. Il ne te reste plus qu’une étape.
        </Text>
        {incentive ? (
          <Text style={styles.highlight}>{incentive}</Text>
        ) : null}
        <Text style={styles.paragraph}>
          <Link href={resumeUrl} style={styles.button}>
            Finaliser mon inscription
          </Link>
        </Text>
        <Text style={styles.secondary}>
          Besoin d’aide ? Réponds simplement à cet email, on est là pour toi.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default AbandonedCheckoutEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f9fafb',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    padding: '24px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '520px',
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
    marginBottom: '14px',
  },
  highlight: {
    fontSize: '16px',
    marginBottom: '16px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '10px',
    padding: '12px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondary: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '20px',
  },
}
