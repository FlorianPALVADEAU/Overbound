import * as React from 'react'
import EmailLayout from './EmailLayout'
import { Eyebrow, FactList, Paragraph, QuoteBox, SectionTitle, SmallPrint, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'

interface SupportContactConfirmationEmailProps {
  fullName: string
  reason?: string
  message: string
  submittedAt: string
}

export function SupportContactConfirmationEmail({ fullName, reason, message, submittedAt }: SupportContactConfirmationEmailProps) {
  const firstName = getFirstName(fullName)
  return (
    <EmailLayout preview="On a bien reçu ta demande. Réponse sous 24 h ouvrées.">
      <Eyebrow>Demande reçue</Eyebrow>
      <Title>{firstName ? `Merci ${firstName}` : 'Merci'}</Title>
      <Paragraph>
        On a bien reçu ta demande. Un membre de l’équipe te répond sous 24&nbsp;h ouvrées (48&nbsp;h pendant les week-ends de
        course).
      </Paragraph>
      <FactList
        rows={[
          { label: 'Envoyée le', value: submittedAt },
          { label: 'Motif', value: reason },
        ]}
      />
      <SectionTitle>Ton message</SectionTitle>
      <QuoteBox>{message}</QuoteBox>
      <SmallPrint>
        Un détail à ajouter, une pièce jointe ? Réponds simplement à cet email : ta réponse arrive sur le même fil.
      </SmallPrint>
    </EmailLayout>
  )
}

export default SupportContactConfirmationEmail
