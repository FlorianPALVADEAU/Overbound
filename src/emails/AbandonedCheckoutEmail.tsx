import * as React from 'react'
import { Link, Preview, Section, Text, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface AbandonedCheckoutEmailProps {
  fullName?: string | null
  eventTitle: string
  ticketName?: string | null
  resumeUrl: string
  incentive?: string | null
}

export function AbandonedCheckoutEmail({
  fullName,
  eventTitle,
  ticketName,
  resumeUrl,
  incentive,
}: AbandonedCheckoutEmailProps) {
  return (
    <EmailLayout preview={`Ton inscription à ${eventTitle} t'attend`}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/two-runners-going-downhill-with-chains-on-their-backs.avif`}
        alt="Ton inscription t'attend"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Cart Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.cartIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#fef3c7" />
              <path
                d="M12 16h8l6.4 25.6c.3 1.2 1.4 2 2.6 2H44c1.2 0 2.3-.8 2.6-2L50 24H20"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="30" cy="50" r="2" fill="#f59e0b" />
              <circle cx="44" cy="50" r="2" fill="#f59e0b" />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          {fullName ? `${fullName}, tout est prêt pour ton inscription` : 'Ton inscription est presque finalisée'}
        </Text>

        {/* Intro */}
        <Text style={styles.paragraph}>
          Tu étais sur le point de rejoindre <strong>{eventTitle}</strong>
          {ticketName ? ` — format ${ticketName}` : ''}. Il ne te reste plus qu'une étape.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Cart Summary */}
        <Section style={styles.cartCard}>
          <Text style={styles.cartTitle}>📋 Ton inscription en attente</Text>
          <table style={styles.cartTable}>
            <tbody>
              <tr>
                <td style={styles.cartLabel}>Événement</td>
                <td style={styles.cartValue}>{eventTitle}</td>
              </tr>
              {ticketName && (
                <tr>
                  <td style={styles.cartLabel}>Format</td>
                  <td style={styles.cartValue}>{ticketName}</td>
                </tr>
              )}
              <tr>
                <td style={styles.cartLabel}>Statut</td>
                <td style={styles.cartStatusValue}>⏳ En attente</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Incentive/Reminder */}
        {incentive && (
          <Section style={styles.incentiveCard}>
            <Text style={styles.incentiveIcon}>💡</Text>
            <Text style={styles.incentiveText}>{incentive}</Text>
          </Section>
        )}

        {/* What You're Missing */}
        <Text style={styles.sectionTitle}>Ce qui t'attend</Text>
        <ul style={styles.featuresList}>
          <li style={styles.featureItem}>
            🏃 <strong>Parcours mythique</strong> - Des obstacles conçus pour te challenger
          </li>
          <li style={styles.featureItem}>
            👥 <strong>Communauté soudée</strong> - Rejoins des milliers de participants
          </li>
          <li style={styles.featureItem}>
            📸 <strong>Moments inoubliables</strong> - Photos professionnelles en option
          </li>
          <li style={styles.featureItem}>
            🏅 <strong>Médaille finisher</strong> - Célèbre ton accomplissement
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Urgency Card */}
        <Section style={styles.urgencyCard}>
          <Text style={styles.urgencyTitle}>⏰ Places limitées</Text>
          <Text style={styles.urgencyText}>
            Ton panier est réservé pendant <strong>48 heures</strong>. Au-delà, ta place pourrait être attribuée à un autre participant.
          </Text>
        </Section>

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={resumeUrl} style={styles.button}>
            Finaliser mon inscription
          </Button>
        </Section>

        {/* Social Proof */}
        {/* <Section style={styles.statsCard}>
          <table style={styles.statsTable}>
            <tbody>
              <tr>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>2500+</Text>
                  <Text style={styles.statLabel}>Déjà inscrits</Text>
                </td>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>95%</Text>
                  <Text style={styles.statLabel}>Finissent</Text>
                </td>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>4.8/5</Text>
                  <Text style={styles.statLabel}>Satisfaction</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section> */}

        {/* Help Section */}
        <Section style={styles.helpCard}>
          <Text style={styles.helpTitle}>💬 Besoin d'aide ?</Text>
          <Text style={styles.helpText}>
            Une question avant de finaliser ton inscription ? Notre équipe est là pour toi.
          </Text>
          <Text style={styles.helpContact}>
            Réponds simplement à cet email ou contacte-nous à{' '}
            <Link href="mailto:contact@overbound-race.com" style={styles.link}>
              contact@overbound-race.com
            </Link>
          </Text>
        </Section>

        {/* Footer Message */}
        <Text style={styles.footerText}>
          On a hâte de te voir franchir la ligne d'arrivée ! 🎯
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default AbandonedCheckoutEmail

const styles: Record<string, React.CSSProperties> = {
  heroImage: {
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  section: {
    lineHeight: '1.6',
  },
  iconContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  cartIcon: {
    display: 'inline-block',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    color: '#6b7280',
    textAlign: 'center',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '32px 0',
    width: '100%',
    height: '1px',
    borderRadius: '1000px',
  },
  cartCard: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  cartTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  cartTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  cartLabel: {
    fontSize: '14px',
    color: '#92400e',
    paddingBottom: '12px',
    verticalAlign: 'top',
    width: '40%',
    fontWeight: 600,
  },
  cartValue: {
    fontSize: '15px',
    color: '#111827',
    fontWeight: 600,
    paddingBottom: '12px',
    verticalAlign: 'top',
  },
  cartStatusValue: {
    fontSize: '15px',
    color: '#f59e0b',
    fontWeight: 600,
    paddingBottom: '12px',
    verticalAlign: 'top',
  },
  incentiveCard: {
    backgroundColor: '#dcfce7',
    border: '2px solid #16a34a',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  incentiveIcon: {
    fontSize: '32px',
    margin: '0 0 8px 0',
  },
  incentiveText: {
    fontSize: '15px',
    color: '#166534',
    fontWeight: 600,
    margin: '0',
    lineHeight: '1.6',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  featuresList: {
    marginLeft: '0',
    paddingLeft: '20px',
    marginBottom: '32px',
    color: '#111827',
  },
  featureItem: {
    marginBottom: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#6b7280',
  },
  urgencyCard: {
    backgroundColor: '#fee2e2',
    borderLeft: '4px solid #ef4444',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '24px',
  },
  urgencyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#991b1b',
    textAlign: 'center',
  },
  urgencyText: {
    fontSize: '14px',
    color: '#7f1d1d',
    margin: '0',
    lineHeight: '1.6',
    textAlign: 'center',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  statsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  statsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  statItem: {
    textAlign: 'center',
    padding: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0',
  },
  helpCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  helpTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    color: '#111827',
    textAlign: 'center',
  },
  helpText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 12px 0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  helpContact: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
}
