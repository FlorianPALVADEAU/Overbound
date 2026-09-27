import * as React from 'react'
import { Button, Hr, Link, Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface LuckyWheelRewardEmailProps {
  rewardName: string
  promoCode: string | null
  expiresAtLabel: string
  registerUrl: string
}

// FDR-0014 §11 (revised 2026-09-21): sent immediately after spin. Reward
// name, conditions, expiration, CTA toward registration, and -- for
// discount-type rewards -- the actual promo code to type manually at
// checkout. Replaces the original "auto-applies, no code" design: that
// relied on the same browser/device being used to spin and to check out,
// which broke in practice. See src/lib/luckyWheel/redemption.ts header.
export function LuckyWheelRewardEmail({ rewardName, promoCode, expiresAtLabel, registerUrl }: LuckyWheelRewardEmailProps) {
  return (
    <EmailLayout preview={`Tu as gagné : ${rewardName}`}>
      <Section style={styles.section}>
        <Text style={styles.eyebrow}>🎡 LUCKY WHEEL</Text>
        <Text style={styles.heading}>Tu as gagné ton avantage Overbound !</Text>

        <Section style={styles.rewardCard}>
          <Text style={styles.rewardName}>{rewardName}</Text>
          <Text style={styles.rewardCondition}>Offre valable jusqu'au {expiresAtLabel}.</Text>
        </Section>

        {promoCode ? (
          <>
            <Text style={styles.paragraph}>
              Utilise ce code lors de ton inscription pour appliquer ta récompense :
            </Text>
            <Section style={styles.codeCard}>
              <Text style={styles.code}>{promoCode}</Text>
            </Section>
          </>
        ) : (
          <Text style={styles.paragraph}>
            Direction ton inscription pour profiter de ta récompense.
          </Text>
        )}

        <Section style={styles.buttonContainer}>
          <Button href={registerUrl} style={styles.button}>
            Je prends mon dossard
          </Button>
        </Section>

        <Hr style={styles.separator} />

        <Text style={styles.footerText}>
          Une question ? Réponds simplement à cet email ou contacte-nous à{' '}
          <Link href="mailto:contact@overbound-race.com" style={styles.link}>
            contact@overbound-race.com
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default LuckyWheelRewardEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  eyebrow: {
    fontSize: '13px',
    fontWeight: 900,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#2563eb',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    margin: '0 0 24px 0',
    textAlign: 'center',
    color: '#111827',
  },
  rewardCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  rewardName: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  rewardCondition: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  codeCard: {
    backgroundColor: '#0f172a',
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  code: {
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '2px',
    color: '#ffffff',
    fontFamily: 'monospace',
    margin: 0,
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    color: '#6b7280',
    textAlign: 'center',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  button: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: '16px',
    padding: '14px 32px',
    borderRadius: '10px',
    textDecoration: 'none',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
  },
  footerText: {
    fontSize: '13px',
    color: '#94a3b8',
    textAlign: 'center',
    margin: 0,
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
}
