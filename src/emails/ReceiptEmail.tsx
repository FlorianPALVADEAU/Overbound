import * as React from 'react'
import { Link } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { CtaButton, EMAIL_COLORS, Eyebrow, FactList, Paragraph, SectionTitle, SmallPrint, Title } from './blocks'
import { COMPANY_INFO } from '@/constants/companyInfo'
import { getFirstName } from '@/lib/email/participantName'
import { sumLines, type ReceiptLine, type ReceiptParticipant } from '@/lib/email/receiptBreakdown'

interface ReceiptEmailProps {
  fullName?: string | null
  invoiceNumber: string
  invoiceDate: string
  eventName: string
  items?: ReceiptLine[]
  participants?: ReceiptParticipant[]
  orderLines?: ReceiptLine[]
  subtotal: number
  discount?: number
  discountLabel?: string
  tax?: number
  total: number
  currency?: string
  paymentMethod: string
  billingAddress?: string
  invoiceUrl?: string
}

const cell: React.CSSProperties = { padding: '10px 0', fontSize: '15px', lineHeight: '22px', color: EMAIL_COLORS.text, borderBottom: `1px solid ${EMAIL_COLORS.line}` }

/** One block of receipt lines, optionally titled with the participant they belong to. */
function LineGroup({
  title,
  lines,
  formatPrice,
}: {
  title?: string
  lines: ReceiptLine[]
  formatPrice: (amount: number) => string
}) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 20px 0' }}>
      <tbody>
        {title ? (
          <tr>
            <td style={{ padding: '0 0 6px 0', fontSize: '15px', fontWeight: 800, color: EMAIL_COLORS.ink, borderBottom: `2px solid ${EMAIL_COLORS.ink}` }}>
              {title}
            </td>
            <td style={{ padding: '0 0 6px 0', fontSize: '15px', fontWeight: 800, textAlign: 'right', color: EMAIL_COLORS.ink, borderBottom: `2px solid ${EMAIL_COLORS.ink}` }}>
              {formatPrice(sumLines(lines))}
            </td>
          </tr>
        ) : null}
        {lines.map((entry, index) => (
          <tr key={index}>
            <td style={cell}>
              {entry.description}
              {entry.detail ? <span style={{ display: 'block', fontSize: '13px', color: EMAIL_COLORS.muted }}>{entry.detail}</span> : null}
              {entry.quantity > 1 ? (
                <span style={{ display: 'block', fontSize: '13px', color: EMAIL_COLORS.muted }}>
                  {entry.quantity} × {formatPrice(entry.unitPrice)}
                </span>
              ) : null}
            </td>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 700, color: EMAIL_COLORS.ink, whiteSpace: 'nowrap' }}>
              {entry.total === 0 ? 'Offert' : formatPrice(entry.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ReceiptEmail({
  fullName,
  invoiceNumber,
  invoiceDate,
  eventName,
  items = [],
  participants,
  orderLines = [],
  subtotal,
  discount,
  discountLabel,
  tax,
  total,
  currency = 'EUR',
  paymentMethod,
  billingAddress,
  invoiceUrl,
}: ReceiptEmailProps) {
  const formatPrice = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
  const firstName = getFirstName(fullName)

  return (
    <EmailLayout preview={`Paiement reçu : ${formatPrice(total)} pour ${eventName}. Facture n°${invoiceNumber}.`}>
      <Eyebrow>Paiement reçu</Eyebrow>
      <Title>{firstName ? `Merci ${firstName}` : 'Merci'}</Title>
      <Paragraph>
        On a bien reçu ton paiement de <strong>{formatPrice(total)}</strong> pour <strong>{eventName}</strong>. Voici ton reçu,
        à garder. Ton billet avec ton QR code arrive dans un autre email.
      </Paragraph>

      <FactList
        rows={[
          { label: 'Facture n°', value: invoiceNumber },
          { label: 'Date', value: invoiceDate },
          { label: 'Événement', value: eventName },
          { label: 'Paiement', value: paymentMethod },
          { label: 'Facturé à', value: billingAddress },
        ]}
      />

      <SectionTitle>Ce que tu as payé</SectionTitle>
      {participants && participants.length > 0 ? (
        <>
          {participants.map((participant, index) => (
            <LineGroup key={index} title={participant.name} lines={participant.lines} formatPrice={formatPrice} />
          ))}
          {orderLines.length > 0 ? (
            <LineGroup title="Sur la commande" lines={orderLines} formatPrice={formatPrice} />
          ) : null}
        </>
      ) : (
        <LineGroup lines={items} formatPrice={formatPrice} />
      )}

      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 24px 0' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px 0', fontSize: '15px', color: EMAIL_COLORS.muted }}>Sous-total</td>
            <td style={{ padding: '8px 0', fontSize: '15px', textAlign: 'right', color: EMAIL_COLORS.text }}>{formatPrice(subtotal)}</td>
          </tr>
          {discount && discount > 0 ? (
            <tr>
              <td style={{ padding: '8px 0', fontSize: '15px', color: EMAIL_COLORS.muted }}>{discountLabel || 'Réduction'}</td>
              <td style={{ padding: '8px 0', fontSize: '15px', textAlign: 'right', color: EMAIL_COLORS.eyebrow, fontWeight: 700 }}>
                -{formatPrice(discount)}
              </td>
            </tr>
          ) : null}
          {tax && tax > 0 ? (
            <tr>
              <td style={{ padding: '8px 0', fontSize: '15px', color: EMAIL_COLORS.muted }}>dont TVA</td>
              <td style={{ padding: '8px 0', fontSize: '15px', textAlign: 'right', color: EMAIL_COLORS.text }}>{formatPrice(tax)}</td>
            </tr>
          ) : null}
          <tr>
            <td style={{ padding: '12px 0 0 0', borderTop: `2px solid ${EMAIL_COLORS.ink}`, fontSize: '16px', fontWeight: 800, color: EMAIL_COLORS.ink, textTransform: 'uppercase' }}>
              Total payé
            </td>
            <td style={{ padding: '12px 0 0 0', borderTop: `2px solid ${EMAIL_COLORS.ink}`, fontSize: '22px', fontWeight: 800, textAlign: 'right', color: EMAIL_COLORS.ink }}>
              {formatPrice(total)}
            </td>
          </tr>
        </tbody>
      </table>

      {invoiceUrl ? <CtaButton href={invoiceUrl}>Télécharger la facture (PDF)</CtaButton> : null}

      <SmallPrint>
        Une question sur ce paiement ? Écris-nous à{' '}
        <Link href={`mailto:${COMPANY_INFO.emails.billing}`} style={{ color: EMAIL_COLORS.eyebrow }}>
          {COMPANY_INFO.emails.billing}
        </Link>
        .
      </SmallPrint>
      <SmallPrint>
        {COMPANY_INFO.legalName} · {COMPANY_INFO.rcs.full} · TVA {COMPANY_INFO.vat}
      </SmallPrint>
    </EmailLayout>
  )
}

export default ReceiptEmail
