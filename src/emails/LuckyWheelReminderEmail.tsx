import * as React from 'react'
import EmailLayout from './EmailLayout'
import { CtaButton, Eyebrow, FactList, Highlight, Paragraph, SmallPrint, Title } from './blocks'

interface LuckyWheelReminderEmailProps {
  rewardName: string
  expiresAtLabel: string
  registerUrl: string
  isLastChance?: boolean
}

// FDR-0014 §11: reminder sequence for an unredeemed reward. The caller (a
// scheduled function) must stop the sequence once redeemed_at is set:
// "all reminder sequences must immediately stop after redemption/purchase."
export function LuckyWheelReminderEmail({
  rewardName,
  expiresAtLabel,
  registerUrl,
  isLastChance = false,
}: LuckyWheelReminderEmailProps) {
  return (
    <EmailLayout
      preview={isLastChance ? `Dernières heures pour ${rewardName}.` : `Ta récompense ${rewardName} t’attend.`}
    >
      <Eyebrow>{isLastChance ? 'Dernière chance' : 'Rappel Lucky Wheel'}</Eyebrow>
      <Title>{isLastChance ? 'Ta récompense expire bientôt' : 'Ta récompense t’attend'}</Title>
      <Highlight label="Ta récompense">{rewardName}</Highlight>
      <FactList rows={[{ label: 'Valable jusqu’au', value: expiresAtLabel }]} />
      <Paragraph>
        Elle s’applique à ton inscription. Si ton premier email contenait un code, saisis-le au moment de payer.
      </Paragraph>
      <CtaButton href={registerUrl}>Je prends mon dossard</CtaButton>
      <SmallPrint>Une question ? Réponds simplement à cet email.</SmallPrint>
    </EmailLayout>
  )
}

export default LuckyWheelReminderEmail
