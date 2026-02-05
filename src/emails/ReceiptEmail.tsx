import * as React from 'react'
import { Section, Text, Link, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { COMPANY_INFO } from '@/constants/companyInfo'

interface ReceiptItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface ReceiptEmailProps {
  fullName?: string | null
  invoiceNumber: string
  invoiceDate: string
  eventName: string
  items: ReceiptItem[]
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

export function ReceiptEmail({
  fullName,
  invoiceNumber,
  invoiceDate,
  eventName,
  items,
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
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <EmailLayout
      preview={`Reçu #${invoiceNumber} - ${eventName}`}
      showSocialLinks={false}
      showNavigationLinks={false}
    >
      <Section style={styles.section}>
        {/* Main Heading */}
        <Text style={styles.heading}>Reçu de paiement</Text>

        {/* Greeting */}
        <Text style={styles.greeting}>
          Cher{fullName ? ` ${fullName}` : ''}, merci pour ton inscription !
        </Text>

        {/* Invoice Info */}
        <Section style={styles.infoCard}>
          <table style={styles.infoTable}>
            <tbody>
              <tr>
                <td style={styles.infoLabel}>Numéro de facture</td>
                <td style={styles.infoValue}>{invoiceNumber}</td>
              </tr>
              <tr>
                <td style={styles.infoLabel}>Date</td>
                <td style={styles.infoValue}>{invoiceDate}</td>
              </tr>
              <tr>
                <td style={styles.infoLabel}>Événement</td>
                <td style={styles.infoValue}>{eventName}</td>
              </tr>
              <tr>
                <td style={styles.infoLabel}>Mode de paiement</td>
                <td style={styles.infoValue}>{paymentMethod}</td>
              </tr>
              {billingAddress && (
                <tr>
                  <td style={styles.infoLabel}>Adresse de facturation</td>
                  <td style={styles.infoValue}>{billingAddress}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Items Table */}
        <Text style={styles.sectionTitle}>Détail de la commande</Text>

        <Section style={styles.itemsCard}>
          <table style={styles.itemsTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Description</th>
                <th style={{ ...styles.tableHeader, textAlign: 'center' }}>Qté</th>
                <th style={{ ...styles.tableHeader, textAlign: 'right' }}>Prix unitaire</th>
                <th style={{ ...styles.tableHeader, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{item.description}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'right' }}>
                    {formatPrice(item.unitPrice)}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'right' }}>
                    {formatPrice(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Price Breakdown */}
        <Section style={styles.breakdownCard}>
          <table style={styles.breakdownTable}>
            <tbody>
              <tr>
                <td style={styles.breakdownLabel}>Sous-total</td>
                <td style={styles.breakdownValue}>{formatPrice(subtotal)}</td>
              </tr>
              {discount && discount > 0 && (
                <tr>
                  <td style={styles.breakdownLabel}>
                    {discountLabel || 'Réduction'}
                  </td>
                  <td style={styles.discountValue}>-{formatPrice(discount)}</td>
                </tr>
              )}
              {tax && tax > 0 && (
                <tr>
                  <td style={styles.breakdownLabel}>TVA</td>
                  <td style={styles.breakdownValue}>{formatPrice(tax)}</td>
                </tr>
              )}
              <tr style={styles.totalRow}>
                <td style={styles.totalLabel}>Total (EUR)</td>
                <td style={styles.totalValue}>{formatPrice(total)}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Download Button */}
        {invoiceUrl && (
          <Section style={styles.buttonContainer}>
            <Button href={invoiceUrl} style={styles.button}>
              Télécharger la facture PDF
            </Button>
          </Section>
        )}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Footer Info */}
        <Text style={styles.footerText}>
          Cette facture a été générée automatiquement. Pour toute question concernant cette
          facture, contacte-nous à{' '}
          <Link href={`mailto:${COMPANY_INFO.emails.billing}`} style={styles.link}>
            {COMPANY_INFO.emails.billing}
          </Link>
        </Text>

        <Text style={styles.smallText}>
          {COMPANY_INFO.legalName} — {COMPANY_INFO.legalForm} au capital de {COMPANY_INFO.capital}
          <br />
          {COMPANY_INFO.address.full}
          <br />
          {COMPANY_INFO.rcs.full} — TVA : {COMPANY_INFO.vat}
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default ReceiptEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 8px 0',
    textAlign: 'center',
    color: '#111827',
  },
  greeting: {
    fontSize: '15px',
    margin: '0 0 32px 0',
    textAlign: 'center',
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  infoTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#6b7280',
    paddingBottom: '8px',
    verticalAlign: 'top',
    width: '45%',
  },
  infoValue: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: 600,
    paddingBottom: '8px',
    verticalAlign: 'top',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '32px 0',
    width: '100%',
    height: '1px',
    borderRadius: '1000px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
  },
  itemsCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6b7280',
    textAlign: 'left',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    fontSize: '14px',
    color: '#111827',
    paddingTop: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
  },
  breakdownCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  breakdownTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  breakdownLabel: {
    fontSize: '14px',
    color: '#6b7280',
    paddingBottom: '8px',
    textAlign: 'left',
  },
  breakdownValue: {
    fontSize: '14px',
    color: '#111827',
    paddingBottom: '8px',
    textAlign: 'right',
    fontWeight: 500,
  },
  discountValue: {
    fontSize: '14px',
    color: '#16a34a',
    paddingBottom: '8px',
    textAlign: 'right',
    fontWeight: 500,
  },
  totalRow: {
    borderTop: '2px solid #e5e7eb',
  },
  totalLabel: {
    fontSize: '16px',
    color: '#111827',
    paddingTop: '12px',
    fontWeight: 700,
    textAlign: 'left',
  },
  totalValue: {
    fontSize: '18px',
    color: '#111827',
    paddingTop: '12px',
    textAlign: 'right',
    fontWeight: 700,
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '16px',
  },
  smallText: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: '0',
  },
}
