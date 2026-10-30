import * as React from 'react'
import { Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { CtaButton, EMAIL_COLORS, Eyebrow, FactList, Paragraph, QuoteBox, SectionTitle, SmallPrint, Title } from './blocks'
import { getFirstName } from '@/lib/email/participantName'
import { COMPANY_INFO } from '@/constants/companyInfo'

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
  const firstName = getFirstName(participantName)
  return (
    <EmailLayout
      preview={`Ton dossard ${eventTitle} est à ton nom. Ton QR code est dans ton espace.`}
      hero={{ photo: 'P1091584', alt: 'Deux participantes sur le parcours Overbound' }}
    >
      <Eyebrow>Transfert terminé</Eyebrow>
      <Title>{firstName ? `${firstName}, le dossard est à toi` : 'Le dossard est à toi'}</Title>
      <Paragraph>
        Le billet pour <strong>{eventTitle}</strong> ({eventDate}) t’a été transféré. Tu en es désormais le seul titulaire. Ton
        QR code est dans ton espace.
      </Paragraph>
      <CtaButton href={accountUrl}>Voir mon billet et mon QR code</CtaButton>
      <Paragraph>
        Le jour J, présente une pièce d’identité au retrait du dossard : le nom doit correspondre au tien.
      </Paragraph>

      <SectionTitle>Copie de la décharge que tu as signée</SectionTitle>
      <FactList
        rows={[
          { label: 'Signée le', value: signedAt },
          { label: 'Version', value: documentVersion },
        ]}
      />
      <QuoteBox>{waiverText}</QuoteBox>
      <SmallPrint>Empreinte du document (SHA-256) : {documentSha256}</SmallPrint>
      <SmallPrint>Garde cet email : il fait foi de ce que tu as accepté.</SmallPrint>
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
    <EmailLayout preview={`Ton billet ${eventTitle} a été récupéré par ${holderName}.`}>
      <Eyebrow>Transfert terminé</Eyebrow>
      <Title>Ton billet a été transféré</Title>
      <Paragraph>
        Ton billet pour <strong>{eventTitle}</strong> ({eventDate}) a été récupéré par <strong>{holderName}</strong> le {claimedAt}.
      </Paragraph>
      <Paragraph>
        Tu n’es plus titulaire de ce dossard : ton ancien QR code ne fonctionne plus. Conformément aux CGV, si Overbound
        annulait l’événement, le remboursement serait versé sur le moyen de paiement de l’achat d’origine. Le règlement
        éventuel entre vous deux reste de votre ressort.
      </Paragraph>
      <SmallPrint>
        Ce n’est pas toi qui as fait ce transfert ? Écris-nous tout de suite à{' '}
        <Link href={`mailto:${COMPANY_INFO.emails.support}`} style={{ color: EMAIL_COLORS.eyebrow }}>
          {COMPANY_INFO.emails.support}
        </Link>
        .
      </SmallPrint>
    </EmailLayout>
  )
}
