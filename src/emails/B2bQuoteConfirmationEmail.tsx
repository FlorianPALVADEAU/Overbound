import * as React from 'react'
import { Link } from '@react-email/components'
import { HEALTH_PROOF } from '@/constants/participantNotice'
import { RANKED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { buildDiscountLadder, describeTicketRange, formatEuros } from '@/lib/b2b/offer'
import { FALLBACK_NEXT_EDITION } from '@/lib/seo/nextEdition'
import { formatTransferFee, TICKET_TRANSFER_FEE_CENTS } from '@/lib/tickets/transferPolicy'
import EmailLayout from './EmailLayout'
import { Callout, Checklist, CtaButton, EMAIL_COLORS, Eyebrow, FactList, Paragraph, SectionTitle, SmallPrint, Steps, Title } from './blocks'

interface B2bQuoteConfirmationEmailProps {
  contactName: string
  companyName: string
  teamSizeLabel: string
  projectTypeLabel: string
  /** Phrase after "prévue" ("entre avril et juin 2027" or "le 7 février 2027"). */
  editionWindow?: string
  editionStatus?: string
}

const SITE_URL = 'https://www.overbound-race.com'
const UTM = 'utm_source=email&utm_medium=transactional&utm_campaign=b2b_quote_confirmation'

const STEPS = [
  { title: 'Nous lisons votre demande', text: 'Nous regardons la taille de votre équipe et votre projet.' },
  { title: 'Vous recevez une offre par e-mail', text: 'Elle est adaptée à votre équipe et à ce que vous nous avez indiqué.' },
  {
    title: 'Vous réservez en ligne',
    text: 'La remise de groupe s’applique automatiquement au paiement. La facture est établie au nom de l’entreprise sur demande.',
  },
]

const TO_PREPARE = [
  `Chaque participant présente le ${HEALTH_PROOF.name} (FFA) ou une licence FFA en cours de validité, contrôlé ${HEALTH_PROOF.checkpoint}.`,
  `Pour partir ensemble : en OPEN, chaque participant choisit son créneau, donc choisissez le même ; en RANKED, le départ est unique à ${RANKED_FORMAT_RULES.departure}.`,
  `Un billet n’est pas remboursable, mais il peut être transféré à un collègue jusqu’à la veille de l’événement (${formatTransferFee(TICKET_TRANSFER_FEE_CENTS)} TTC par billet).`,
]

const th: React.CSSProperties = { padding: '0 0 8px 0', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', color: EMAIL_COLORS.muted, textAlign: 'left', fontWeight: 700 }
const td: React.CSSProperties = { padding: '10px 0', fontSize: '15px', color: EMAIL_COLORS.text, borderBottom: `1px solid ${EMAIL_COLORS.line}` }

export function B2bQuoteConfirmationEmail({
  contactName,
  companyName,
  teamSizeLabel,
  projectTypeLabel,
  editionWindow = FALLBACK_NEXT_EDITION.window,
  editionStatus = FALLBACK_NEXT_EDITION.detailsStatus,
}: B2bQuoteConfirmationEmailProps) {
  const firstName = contactName.trim().split(' ')[0] || contactName
  const ladder = buildDiscountLadder()

  return (
    <EmailLayout
      preview={`Demande de devis reçue pour ${companyName}. Offre par e-mail à suivre.`}
      hero={{ photo: 'log-carry1', alt: 'Des participants portent des troncs ensemble pendant une course Overbound' }}
    >
      <Eyebrow>Demande de devis reçue</Eyebrow>
      <Title>Merci {firstName}, c’est bien reçu</Title>
      <Paragraph>
        La demande de <strong>{companyName}</strong> est enregistrée. Nous revenons vers vous par e-mail avec une offre adaptée à
        votre équipe.
      </Paragraph>

      <FactList
        rows={[
          { label: 'Entreprise', value: companyName },
          { label: 'Équipe', value: `${teamSizeLabel} personnes` },
          { label: 'Projet', value: projectTypeLabel },
        ]}
      />

      <SectionTitle>La suite</SectionTitle>
      <Steps items={STEPS} />

      <SectionTitle>Votre remise de groupe</SectionTitle>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 8px 0' }}>
        <thead>
          <tr>
            <th style={th}>Billets</th>
            <th style={th}>Remise</th>
            <th style={{ ...th, textAlign: 'right' }}>OPEN</th>
            <th style={{ ...th, textAlign: 'right' }}>RANKED</th>
          </tr>
        </thead>
        <tbody>
          {ladder.map((row) => (
            <tr key={row.minTickets}>
              <td style={td}>{describeTicketRange(row)}</td>
              <td style={td}>-{row.percent} %</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: EMAIL_COLORS.ink }}>{formatEuros(row.openUnitCents)}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: EMAIL_COLORS.ink }}>{formatEuros(row.rankedUnitCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <SmallPrint>
        Prix par billet, toutes taxes comprises. La remise se compte par format : un billet OPEN et un billet RANKED d’une même commande ne se comptent pas ensemble.
      </SmallPrint>

      <Callout title="À prévoir côté équipe">
        <Checklist items={TO_PREPARE} />
      </Callout>

      <CtaButton href={`${SITE_URL}/entreprises?${UTM}#tarifs`}>Revoir l’offre entreprises</CtaButton>

      <SmallPrint>
        Prochaine édition {editionWindow}. {editionStatus}
      </SmallPrint>
      <SmallPrint>
        Une précision à ajouter ? Répondez à cet e-mail ou écrivez à{' '}
        <Link href="mailto:contact@overbound-race.com" style={{ color: EMAIL_COLORS.eyebrow }}>
          contact@overbound-race.com
        </Link>
        .
      </SmallPrint>
    </EmailLayout>
  )
}

export default B2bQuoteConfirmationEmail
