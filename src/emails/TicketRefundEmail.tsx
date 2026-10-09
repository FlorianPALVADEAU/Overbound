import * as React from 'react'
import { Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface FlexibleRefundEmailProps {
  eventTitle: string
  eventDate: string
  amountLabel: string
  cancelledAt: string
}

/** Sent to the buyer once a "billet flexible" bib is cancelled and refunded. */
export function FlexibleRefundEmail({ eventTitle, eventDate, amountLabel, cancelledAt }: FlexibleRefundEmailProps) {
  return (
    <EmailLayout preview={`Billet ${eventTitle} annulé, ${amountLabel} remboursés`}>
      <Section style={styles.section}>
        <Text style={styles.heading}>Billet annulé et remboursé</Text>
        <Text style={styles.paragraph}>
          Ton billet pour <strong>{eventTitle}</strong> ({eventDate}) a été annulé le {cancelledAt}, grâce à l’option billet
          flexible.
        </Text>
        <Text style={styles.paragraph}>
          <strong>{amountLabel}</strong> sont remboursés sur le moyen de paiement utilisé lors de l’achat. Selon ta banque, le
          montant apparaît sous 5 à 10 jours ouvrés.
        </Text>
        <Text style={styles.secondary}>
          Les frais de l’option billet flexible et les autres options de la commande ne sont pas remboursés (CGV, article 10).
          Le QR code de ce billet ne fonctionne plus.
        </Text>
      </Section>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: { lineHeight: 1.6 },
  heading: { fontSize: '22px', fontWeight: 700, marginBottom: '12px' },
  paragraph: { fontSize: '16px', margin: '12px 0' },
  secondary: { fontSize: '13px', color: '#6b7280' },
}
