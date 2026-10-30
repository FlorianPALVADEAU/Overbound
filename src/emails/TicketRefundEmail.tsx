import * as React from 'react'
import EmailLayout from './EmailLayout'
import { Eyebrow, FactList, Paragraph, SmallPrint, Title } from './blocks'

interface FlexibleRefundEmailProps {
  eventTitle: string
  eventDate: string
  amountLabel: string
  cancelledAt: string
}

/** Sent to the buyer once a "billet flexible" bib is cancelled and refunded. */
export function FlexibleRefundEmail({ eventTitle, eventDate, amountLabel, cancelledAt }: FlexibleRefundEmailProps) {
  return (
    <EmailLayout preview={`Billet ${eventTitle} annulé : ${amountLabel} remboursés.`}>
      <Eyebrow>Billet flexible</Eyebrow>
      <Title>Billet annulé et remboursé</Title>
      <Paragraph>
        Ton billet pour <strong>{eventTitle}</strong> ({eventDate}) est annulé, grâce à l’option billet flexible. Son QR code ne
        fonctionne plus.
      </Paragraph>
      <FactList
        rows={[
          { label: 'Annulé le', value: cancelledAt },
          { label: 'Montant remboursé', value: amountLabel },
          { label: 'Versé sur', value: 'Le moyen de paiement utilisé pour l’achat' },
          { label: 'Délai', value: 'Sous 5 à 10 jours ouvrés selon ta banque' },
        ]}
      />
      <SmallPrint>
        Les frais de l’option billet flexible et les autres options de la commande ne sont pas remboursés (CGV, article 10).
      </SmallPrint>
    </EmailLayout>
  )
}
