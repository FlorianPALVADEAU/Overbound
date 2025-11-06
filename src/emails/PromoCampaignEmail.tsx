import * as React from 'react'
import { Preview, Section, Text, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface PromoCampaignEmailProps {
  fullName?: string | null
  title: string
  message: string
  ctaLabel: string
  ctaUrl: string
  promoCode?: string | null
  promoDetails?: string | null
}

export function PromoCampaignEmail({
  fullName,
  title,
  message,
  ctaLabel,
  ctaUrl,
  promoCode,
  promoDetails,
}: PromoCampaignEmailProps) {
  return (
    <EmailLayout preview={title}>
      <Section style={styles.section}>
        <Text style={styles.heading}>{title}</Text>
        <Text style={styles.paragraph}>{message}</Text>
        {ctaUrl ? (
          <Text>
            <Link href={ctaUrl} style={styles.button}>{ctaLabel || 'Voir'}</Link>
          </Text>
        ) : null}

        {promoCode ? (
          <Text style={styles.codeBlock}>{promoCode}</Text>
        ) : null}

        {promoDetails ? (
          <Text style={styles.secondary}>{promoDetails}</Text>
        ) : null}
      </Section>
    </EmailLayout>
  )
}

export default PromoCampaignEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#111827',
    fontFamily: 'Arial, sans-serif',
    color: '#f9fafb',
    padding: '24px',
  },
  container: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '560px',
    border: '1px solid #374151',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#f9fafb',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '14px',
    color: '#f3f4f6',
  },
  codeBlock: {
    display: 'inline-block',
    marginBottom: '16px',
    backgroundColor: '#f9fafb',
    color: '#111827',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '16px',
    letterSpacing: '0.05em',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#f97316',
    color: '#111827',
    padding: '12px 22px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  secondary: {
    fontSize: '14px',
    color: '#d1d5db',
    marginTop: '20px',
  },
}
