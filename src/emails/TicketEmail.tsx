import * as React from 'react'
import { Img, Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import {
  Callout,
  Checklist,
  CtaButton,
  EMAIL_COLORS,
  Eyebrow,
  FactList,
  Paragraph,
  SectionTitle,
  SmallPrint,
  Steps,
  Title,
} from './blocks'
import { OFFICIAL_RULEBOOK_PDF_PATH, PARENTAL_AUTHORIZATION_PDF_PATH } from '@/constants/registration'
import { HEALTH_PROOF, HEALTH_PROOF_MINOR } from '@/constants/participantNotice'
import { VENUE_ACCESS } from '@/constants/venueAccess'
import { COMPANY_INFO } from '@/constants/companyInfo'
import { getFirstName } from '@/lib/email/participantName'
import { formatTransferFee, TICKET_TRANSFER_FEE_CENTS } from '@/lib/tickets/transferPolicy'

export interface TicketEmailProps {
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketName: string
  startTime?: string | null
  waveIndex?: number | null
  bibNumber?: number | null
  qrUrl: string
  manageUrl: string
  /** Participant aged 16 or 17: other papers at pickup (health attestation, parental authorization, adult referent). */
  isMinor?: boolean
}

export default function TicketEmail({
  participantName,
  eventTitle,
  eventDate,
  eventLocation,
  ticketName,
  startTime,
  waveIndex,
  bibNumber,
  qrUrl,
  manageUrl,
  isMinor = false,
}: TicketEmailProps) {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://overbound-race.com'
  const firstName = getFirstName(participantName)
  const parentalAuthorizationUrl = `${siteUrl}${PARENTAL_AUTHORIZATION_PDF_PATH}`
  const holder = participantName.includes('@') ? participantName : participantName.toUpperCase()

  return (
    <EmailLayout
      preview={`Ton billet pour ${eventTitle} : ton QR code est dans cet email.`}
      hero={{ photo: 'tire-flip', alt: 'Un participant retourne un pneu sur le parcours Overbound' }}
    >
      <Eyebrow>Inscription confirmée</Eyebrow>
      <Title>{firstName ? `${firstName}, tu es inscrit·e` : 'Tu es inscrit·e'}</Title>
      <Paragraph>
        Ton inscription à <strong>{eventTitle}</strong> est validée. Ton billet est juste en dessous : le jour J, tu montres
        ce QR code à l’entrée.
      </Paragraph>

      {/* QR code */}
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        style={{ border: `2px solid ${EMAIL_COLORS.ink}`, borderRadius: '16px', margin: '0 0 16px 0' }}
      >
        <tbody>
          <tr>
            <td align="center" style={{ padding: '24px 16px 8px 16px' }}>
              <Img
                src={qrUrl}
                alt={`QR code du billet de ${participantName}`}
                width="220"
                height="220"
                style={{ display: 'block', width: '220px', height: '220px', margin: '0 auto' }}
              />
            </td>
          </tr>
          <tr>
            <td align="center" style={{ padding: '4px 16px 4px 16px', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: EMAIL_COLORS.muted }}>
              Billet nominatif
            </td>
          </tr>
          <tr>
            <td align="center" style={{ padding: '0 16px 4px 16px', fontSize: '20px', lineHeight: '26px', fontWeight: 800, color: EMAIL_COLORS.ink }}>
              {holder}
            </td>
          </tr>
          <tr>
            <td align="center" style={{ padding: '0 16px 24px 16px', fontSize: '14px', lineHeight: '20px', color: EMAIL_COLORS.muted }}>
              {ticketName}
            </td>
          </tr>
        </tbody>
      </table>

      <SmallPrint>
        Fais une capture d’écran de ce QR code. Tu l’auras sur ton téléphone même sans réseau le jour J. Si l’image ne
        s’affiche pas, ouvre ton billet avec le bouton ci-dessous.
      </SmallPrint>

      <CtaButton href={manageUrl}>Ouvrir mon billet</CtaButton>

      <Callout tone="warning" title={`Ce billet est au nom de ${participantName}`}>
        <>
          Le QR code est lié à cette personne. Au contrôle, ta pièce d’identité doit porter le même nom : sinon l’entrée est
          refusée. Tu ne peux pas venir ? Transfère le billet à la personne qui viendra à ta place depuis{' '}
          <Link href={manageUrl} style={{ color: EMAIL_COLORS.eyebrow, textDecoration: 'underline' }}>
            ton compte
          </Link>
          , au plus tard la veille de l’événement ({formatTransferFee(TICKET_TRANSFER_FEE_CENTS)}). Passer ton QR code à
          quelqu’un d’autre ne marche pas.
        </>
      </Callout>

      <FactList
        title="Ton événement"
        rows={[
          { label: 'Date', value: eventDate },
          { label: 'Lieu', value: eventLocation },
          { label: 'Ton billet', value: ticketName },
          { label: 'Heure de départ', value: startTime },
          { label: 'SAS de départ', value: waveIndex ? `SAS n°${waveIndex}` : null },
          { label: 'Dossard', value: bibNumber ? `N°${bibNumber}` : null },
        ]}
      />

      <SectionTitle>Le jour J en 3 étapes</SectionTitle>
      <Steps
        items={[
          {
            title: `Arrive ${VENUE_ACCESS.arriveBeforeDeparture} avant ton départ`,
            text: (
              <>
                {VENUE_ACCESS.entrance} {VENUE_ACCESS.parkingFee}{' '}
                <Link href={VENUE_ACCESS.mapsUrl} style={{ color: EMAIL_COLORS.eyebrow, textDecoration: 'underline' }}>
                  Ouvrir le plan
                </Link>
              </>
            ),
          },
          {
            title: 'Retire ton dossard',
            text: isMinor
              ? 'Montre ton QR code et ta pièce d’identité, remets l’autorisation parentale signée par ton représentant légal et par toi, et l’attestation de santé pour mineurs. Ton adulte référent est présent avec toi. Les infos de retrait te sont envoyées par email avant l’événement.'
              : 'Montre ton QR code, ta pièce d’identité et ton Pass Prévention Santé. Les infos de retrait te sont envoyées par email avant l’événement.',
          },
          {
            title: 'Prends ton départ',
            text: startTime
              ? `Ton SAS de départ est ton groupe de départ. Présente-toi à l’entrée du SAS à ${startTime}.`
              : 'Rends-toi à la ligne de départ à l’heure indiquée sur ton billet.',
          },
        ]}
      />

      <SectionTitle>À avoir sur toi</SectionTitle>
      <Checklist
        items={[
          'Ta pièce d’identité',
          'Ce QR code, en capture d’écran',
          ...(isMinor
            ? [
                <>
                  L’
                  <Link href={parentalAuthorizationUrl} style={{ color: EMAIL_COLORS.eyebrow, textDecoration: 'underline' }}>
                    autorisation parentale (PDF)
                  </Link>
                  , à imprimer et à faire signer par ton représentant légal et par toi
                </>,
                <>
                  L’{HEALTH_PROOF_MINOR.name} délivrée par {HEALTH_PROOF_MINOR.issuer}, <strong>ou</strong>{' '}
                  {HEALTH_PROOF_MINOR.alternative}. Si une réponse du questionnaire est « oui » : {HEALTH_PROOF_MINOR.certificate}
                </>,
                'Ton adulte référent (majeur), présent sur le site et joignable par téléphone pendant toute ta course',
              ]
            : [
                <>
                  Ton {HEALTH_PROOF.name}, délivré par {HEALTH_PROOF.issuer}, <strong>ou</strong> {HEALTH_PROOF.alternative}
                </>,
              ]),
          'Des vêtements de rechange laissés dans ta voiture',
        ]}
      />

      <Callout tone="warning" title={isMinor ? 'Sans ces papiers, tu ne pars pas' : 'Sans PPS ou licence, tu ne pars pas'}>
        {isMinor
          ? `Ils sont contrôlés ${HEALTH_PROOF.checkpoint}. ${HEALTH_PROOF.consequence}`
          : `Il est contrôlé ${HEALTH_PROOF.checkpoint}. ${HEALTH_PROOF.consequence}`}
      </Callout>

      <SmallPrint>
        {VENUE_ACCESS.publicTransport} {VENUE_ACCESS.bagDrop} {VENUE_ACCESS.noChangingRooms}
      </SmallPrint>

      <SectionTitle>Une question ?</SectionTitle>
      <Paragraph muted>
        Réponds simplement à cet email, ou écris-nous à{' '}
        <Link href={`mailto:${COMPANY_INFO.emails.support}`} style={{ color: EMAIL_COLORS.eyebrow, textDecoration: 'underline' }}>
          {COMPANY_INFO.emails.support}
        </Link>
        .
      </Paragraph>

      <SmallPrint>
        <strong>Assurance :</strong> l’assurance d’Overbound couvre les dommages dont Overbound est responsable, pas ceux que
        tu te causes à toi-même. Nous te recommandons une assurance individuelle accident. Détails à l’article 12 des CGV.
      </SmallPrint>
      <SmallPrint>
        Ta participation est soumise à la décharge de responsabilité signée lors de la commande. Si quelqu’un t’a inscrit·e,
        il l’a acceptée en ton nom : lis-la avant l’événement.{' '}
        <Link href={`${siteUrl}/decharge`} style={{ color: EMAIL_COLORS.eyebrow }}>
          Lire la décharge
        </Link>
        {' · '}
        <Link href={`${siteUrl}${OFFICIAL_RULEBOOK_PDF_PATH}`} style={{ color: EMAIL_COLORS.eyebrow }}>
          Règlement officiel (PDF)
        </Link>
        {' · '}
        {isMinor && (
          <>
            {' · '}
            <Link href={parentalAuthorizationUrl} style={{ color: EMAIL_COLORS.eyebrow }}>
              Autorisation parentale (PDF)
            </Link>
          </>
        )}
        {' · '}
        <Link href={`${siteUrl}/cgv`} style={{ color: EMAIL_COLORS.eyebrow }}>
          CGV
        </Link>
      </SmallPrint>
    </EmailLayout>
  )
}
