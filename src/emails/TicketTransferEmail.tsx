import * as React from 'react'
import { Hr, Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface TransferReceivedEmailProps {
  participantName: string
  eventTitle: string
  eventDate: string
  signedAt: string
  documentVersion: string
  documentSha256: string
  waiverText: string
  accountUrl: string
}

/** Sent to the new holder: proof of the hand-over and a durable copy of the waiver they signed. */
export function TransferReceivedEmail({
  participantName,
  eventTitle,
  eventDate,
  signedAt,
  documentVersion,
  documentSha256,
  waiverText,
  accountUrl,
}: TransferReceivedEmailProps) {
  return (
    <EmailLayout preview={`Ton dossard ${eventTitle} est à ton nom`}>
      <Section style={styles.section}>
        <Text style={styles.heading}>{participantName}, le dossard est à toi</Text>
        <Text style={styles.paragraph}>
          Le billet pour <strong>{eventTitle}</strong> ({eventDate}) t’a été transféré. Tu en es désormais le seul titulaire.
          Ton QR code d’accès est dans ton espace :{' '}
          <a href={accountUrl} style={styles.link}>
            voir mon billet
          </a>
          .
        </Text>
        <Text style={styles.paragraph}>
          Le jour J, présente une pièce d’identité au retrait du dossard : le nom doit correspondre au tien.
        </Text>

        <Hr style={styles.divider} />

        <Text style={styles.paragraph}>
          <strong>Copie de la décharge que tu as signée</strong>
          <br />
          Signée le {signedAt} · version {documentVersion}
        </Text>
        <Text style={styles.document}>{waiverText}</Text>
        <Text style={styles.secondary}>Empreinte du document (SHA-256) : {documentSha256}</Text>
        <Text style={styles.secondary}>Garde cet email : il fait foi de ce que tu as accepté.</Text>
      </Section>
    </EmailLayout>
  )
}

interface TransferHandedOverEmailProps {
  holderName: string
  eventTitle: string
  eventDate: string
  claimedAt: string
}

/** Sent to the former holder: the bib is no longer theirs. */
export function TransferHandedOverEmail({ holderName, eventTitle, eventDate, claimedAt }: TransferHandedOverEmailProps) {
  return (
    <EmailLayout preview={`Ton billet ${eventTitle} a été récupéré`}>
      <Section style={styles.section}>
        <Text style={styles.heading}>Transfert terminé</Text>
        <Text style={styles.paragraph}>
          Ton billet pour <strong>{eventTitle}</strong> ({eventDate}) a été récupéré par {holderName} le {claimedAt}.
        </Text>
        <Text style={styles.paragraph}>
          Tu n’es plus titulaire de ce dossard : ton ancien QR code ne fonctionne plus. Conformément aux CGV, si Overbound
          annulait l’événement, le remboursement serait versé sur le moyen de paiement de l’achat d’origine. Le règlement
          éventuel entre vous deux reste de votre ressort.
        </Text>
        <Text style={styles.secondary}>Ce n’est pas toi ? Réponds à cet email immédiatement.</Text>
      </Section>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: { lineHeight: 1.6 },
  heading: { fontSize: '22px', fontWeight: 700, marginBottom: '12px' },
  paragraph: { fontSize: '16px', margin: '12px 0' },
  link: { color: '#16a34a', fontWeight: 700 },
  document: {
    fontSize: '13px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  divider: { borderColor: '#e5e7eb', margin: '24px 0' },
  secondary: { fontSize: '13px', color: '#6b7280', wordBreak: 'break-all' },
}
