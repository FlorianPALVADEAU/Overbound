import * as React from 'react'
import { Button, Hr, Link, Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface LuckyWheelReminderEmailProps {
  rewardName: string
  expiresAtLabel: string
  registerUrl: string
  isLastChance?: boolean
}

// FDR-0014 §11: reminder sequence for an unredeemed reward. Same content
// as LuckyWheelRewardEmail with urgency framing -- the caller (a scheduled
// function, mirroring existing reminder crons e.g. AbandonedCheckoutEmail)
// is responsible for stopping this sequence once redeemed_at is set, per
// FDR-0014 §11: "all reminder sequences must immediately stop after
// redemption/purchase."
export function LuckyWheelReminderEmail({
  rewardName,
  expiresAtLabel,
  registerUrl,
  isLastChance = false,
}: LuckyWheelReminderEmailProps) {
  return (
    <EmailLayout preview={isLastChance ? `Dernières heures pour ${rewardName}` : `N'oublie pas ${rewardName}`}>
      <Section style={styles.section}>
        <Text style={styles.eyebrow}>{isLastChance ? '⏰ DERNIÈRE CHANCE' : '🎡 RAPPEL LUCKY WHEEL'}</Text>
        <Text style={styles.heading}>
          {isLastChance ? 'Ta récompense expire bientôt' : "N'oublie pas ta récompense"}
        </Text>

        <Section style={styles.rewardCard}>
          <Text style={styles.rewardName}>{rewardName}</Text>
          <Text style={styles.rewardCondition}>Offre valable jusqu'au {expiresAtLabel}.</Text>
        </Section>

        <Text style={styles.paragraph}>
          Ta récompense s'applique automatiquement à ton inscription, aucun code à copier.
        </Text>

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

export default LuckyWheelReminderEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  eyebrow: {
    fontSize: '13px',
    fontWeight: 900,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#dc2626',
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
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
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
