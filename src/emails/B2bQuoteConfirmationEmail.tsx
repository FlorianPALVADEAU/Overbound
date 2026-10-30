import * as React from 'react'
import { Button, Column, Img, Row, Section, Text } from '@react-email/components'
import { HEALTH_PROOF } from '@/constants/participantNotice'
import { RANKED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { buildDiscountLadder, describeTicketRange, formatEuros } from '@/lib/b2b/offer'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import { FALLBACK_NEXT_EDITION } from '@/lib/seo/nextEdition'
import { formatTransferFee, TICKET_TRANSFER_FEE_CENTS } from '@/lib/tickets/transferPolicy'
import EmailLayout from './EmailLayout'

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
    text: "La remise de groupe s'applique automatiquement au paiement. La facture est établie au nom de l'entreprise sur demande.",
  },
] as const

const TO_PREPARE = [
  `Chaque participant présente le ${HEALTH_PROOF.name} (FFA) ou une licence FFA en cours de validité, contrôlé ${HEALTH_PROOF.checkpoint}.`,
  `Pour partir ensemble : en OPEN, chaque participant choisit son créneau, donc choisissez le même ; en RANKED, le départ est unique à ${RANKED_FORMAT_RULES.departure}.`,
  `Un billet n’est pas remboursable, mais il peut être transféré à un collègue jusqu’à la veille de l’événement (${formatTransferFee(TICKET_TRANSFER_FEE_CENTS)} TTC par billet).`,
] as const

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
  const heroUrl = `${getEmailAssetsBaseUrl()}/images/email/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.jpg`

  return (
    <EmailLayout preview={`Demande de devis reçue pour ${companyName}`}>
      <Section style={styles.section}>
        <Img src={heroUrl} alt="Des participants portent des troncs ensemble pendant une course Overbound" width="544" style={styles.hero} />

        <Text style={styles.eyebrow}>Demande de devis reçue</Text>
        <Text style={styles.heading}>Merci {firstName}, c’est bien reçu.</Text>
        <Text style={styles.paragraph}>
          La demande de <strong>{companyName}</strong> est enregistrée. Nous revenons vers vous par e-mail avec une offre
          adaptée à votre équipe.
        </Text>

        <Section style={styles.recap}>
          <Row>
            <Column style={styles.recapLabel}>Entreprise</Column>
            <Column style={styles.recapValue}>{companyName}</Column>
          </Row>
          <Row>
            <Column style={styles.recapLabel}>Équipe</Column>
            <Column style={styles.recapValue}>{teamSizeLabel} personnes</Column>
          </Row>
          <Row>
            <Column style={styles.recapLabel}>Projet</Column>
            <Column style={styles.recapValue}>{projectTypeLabel}</Column>
          </Row>
        </Section>

        <Text style={styles.subheading}>La suite</Text>
        {STEPS.map((step, index) => (
          <Row key={step.title} style={styles.stepRow}>
            <Column style={styles.stepNumberCell}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </Column>
            <Column style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </Column>
          </Row>
        ))}

        <Text style={styles.subheading}>Votre remise de groupe</Text>
        <table role="presentation" cellPadding={0} cellSpacing={0} style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Billets</th>
              <th style={styles.th}>Remise</th>
              <th style={styles.thRight}>OPEN</th>
              <th style={styles.thRight}>RANKED</th>
            </tr>
          </thead>
          <tbody>
            {ladder.map((row) => (
              <tr key={row.minTickets}>
                <td style={styles.td}>{describeTicketRange(row)}</td>
                <td style={styles.td}>-{row.percent} %</td>
                <td style={styles.tdRightStrong}>{formatEuros(row.openUnitCents)}</td>
                <td style={styles.tdRightStrong}>{formatEuros(row.rankedUnitCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Text style={styles.note}>
          Prix par billet, toutes taxes comprises. Les billets OPEN et RANKED d’une même commande comptent ensemble.
        </Text>

        <Section style={styles.callout}>
          <Text style={styles.calloutTitle}>À prévoir côté équipe</Text>
          {TO_PREPARE.map((item) => (
            <Text key={item} style={styles.calloutItem}>
              • {item}
            </Text>
          ))}
        </Section>

        <Section style={styles.buttonContainer}>
          <Button href={`${SITE_URL}/entreprises?${UTM}#tarifs`} style={styles.button}>
            Revoir l’offre entreprises
          </Button>
        </Section>

        <Text style={styles.edition}>
          Prochaine édition {editionWindow}. {editionStatus}
        </Text>
        <Text style={styles.secondary}>
          Une précision à ajouter ? Répondez à cet e-mail ou écrivez à{' '}
          <a href="mailto:contact@overbound-race.com" style={styles.link}>
            contact@overbound-race.com
          </a>
          .
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default B2bQuoteConfirmationEmail

const GREEN = '#16a34a'
const INK = '#0f172a'
const BODY = '#475569'

const styles: Record<string, React.CSSProperties> = {
  section: { lineHeight: 1.6 },
  hero: { display: 'block', width: '100%', maxWidth: '544px', height: 'auto', borderRadius: '12px', margin: '0 0 24px 0' },
  eyebrow: { fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: GREEN, margin: '0 0 6px 0' },
  heading: { fontSize: '28px', lineHeight: '34px', fontWeight: 700, color: INK, margin: '0 0 12px 0' },
  paragraph: { fontSize: '16px', color: BODY, margin: '0 0 20px 0' },
  recap: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', margin: '0 0 28px 0' },
  recapLabel: { fontSize: '13px', color: '#64748b', padding: '4px 0', width: '96px', verticalAlign: 'top' },
  recapValue: { fontSize: '14px', fontWeight: 600, color: INK, padding: '4px 0' },
  subheading: { fontSize: '18px', fontWeight: 700, color: INK, margin: '0 0 12px 0' },
  stepRow: { marginBottom: '12px' },
  stepNumberCell: { width: '40px', verticalAlign: 'top' },
  stepNumber: {
    width: '28px',
    height: '28px',
    lineHeight: '28px',
    borderRadius: '14px',
    backgroundColor: GREEN,
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    textAlign: 'center',
    margin: 0,
  },
  stepBody: { verticalAlign: 'top' },
  stepTitle: { fontSize: '15px', fontWeight: 700, color: INK, margin: '0 0 2px 0' },
  stepText: { fontSize: '14px', color: BODY, margin: '0 0 8px 0' },
  table: { width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', margin: '4px 0 8px 0' },
  th: { backgroundColor: '#f1f5f9', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', textAlign: 'left', padding: '8px 10px' },
  thRight: { backgroundColor: '#f1f5f9', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b', textAlign: 'right', padding: '8px 10px' },
  td: { fontSize: '14px', color: INK, padding: '8px 10px', borderTop: '1px solid #e2e8f0' },
  tdRightStrong: { fontSize: '14px', fontWeight: 700, color: GREEN, textAlign: 'right', padding: '8px 10px', borderTop: '1px solid #e2e8f0' },
  note: { fontSize: '12px', color: '#64748b', margin: '0 0 28px 0' },
  callout: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', margin: '0 0 28px 0' },
  calloutTitle: { fontSize: '15px', fontWeight: 700, color: '#166534', margin: '0 0 8px 0' },
  calloutItem: { fontSize: '14px', color: '#14532d', margin: '0 0 6px 0' },
  buttonContainer: { textAlign: 'center', margin: '0 0 24px 0' },
  button: {
    backgroundColor: GREEN,
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '16px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  edition: { fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '0 0 8px 0' },
  secondary: { fontSize: '14px', color: '#64748b', textAlign: 'center', margin: 0 },
  link: { color: '#2563eb', textDecoration: 'none' },
}
