import * as React from 'react'
import EmailLayout from './EmailLayout'
import { CtaButton, Eyebrow, FactList, Highlight, Paragraph, SmallPrint, Title } from './blocks'

interface LuckyWheelRewardEmailProps {
  rewardName: string
  promoCode: string | null
  expiresAtLabel: string
  registerUrl: string
}

// FDR-0014 §11 (revised 2026-09-21): sent immediately after spin. Reward
// name, expiration, CTA toward registration and, for discount rewards, the
// promo code to type at checkout (the original "auto-applies" design relied
// on the same browser being used to spin and to check out). See
// src/lib/luckyWheel/redemption.ts header.
export function LuckyWheelRewardEmail({ rewardName, promoCode, expiresAtLabel, registerUrl }: LuckyWheelRewardEmailProps) {
  return (
    <EmailLayout
      preview={`Tu as gagné : ${rewardName}. Valable jusqu’au ${expiresAtLabel}.`}
      hero={{ photo: 'P1091283', alt: 'Médailles de finisher Overbound' }}
    >
      <Eyebrow>Lucky Wheel</Eyebrow>
      <Title>Tu as gagné !</Title>
      <Highlight label="Ta récompense">{rewardName}</Highlight>
      <FactList rows={[{ label: 'Valable jusqu’au', value: expiresAtLabel }]} />

      {promoCode ? (
        <>
          <Paragraph>Saisis ce code au moment de ton inscription pour profiter de ta récompense :</Paragraph>
          <Highlight label="Ton code">{promoCode}</Highlight>
        </>
      ) : (
        <Paragraph>Ta récompense s’applique quand tu t’inscris à une course. Rien à saisir.</Paragraph>
      )}

      <CtaButton href={registerUrl}>Je prends mon dossard</CtaButton>
      <SmallPrint>Une question ? Réponds simplement à cet email.</SmallPrint>
    </EmailLayout>
  )
}

export default LuckyWheelRewardEmail
