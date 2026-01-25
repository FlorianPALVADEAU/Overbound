import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface PromoCampaignEmailProps {
  fullName?: string | null
  title: string
  message: string
  ctaLabel: string
  ctaUrl: string
  promoCode?: string | null
  promoDetails?: string | null
  unsubscribeUrl?: string
}

export function PromoCampaignEmail({
  fullName,
  title,
  message,
  ctaLabel,
  ctaUrl,
  promoCode,
  promoDetails,
  unsubscribeUrl,
}: PromoCampaignEmailProps) {
  return (
    <EmailLayout preview={title} unsubscribeUrl={unsubscribeUrl}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif`}
        alt={title}
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Gift Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.giftIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#dcfce7" />
              <path
                d="M16 28h32v20H16V28zM32 28v20M24 28c0-4.418 3.582-8 8-8s8 3.582 8 8"
                stroke="#16a34a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 28h24v-4H20v4z"
                fill="#16a34a"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>{title}</Text>

        {/* Message */}
        <Text style={styles.paragraph}>{message}</Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Promo Code Card */}
        {promoCode && (
          <Section style={styles.promoCard}>
            <Text style={styles.promoCardTitle}>🎁 Ton code promo</Text>
            <Section style={styles.promoCodeContainer}>
              <Text style={styles.promoCode}>{promoCode}</Text>
            </Section>
            <Text style={styles.promoHowTo}>
              Copie ce code et colle-le lors de ton inscription pour bénéficier de l'offre.
            </Text>
          </Section>
        )}

        {/* Promo Details */}
        {promoDetails && (
          <Section style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>📋 Conditions d'utilisation</Text>
            <Text style={styles.detailsText}>{promoDetails}</Text>
          </Section>
        )}

        {/* What You Get */}
        <Text style={styles.sectionTitle}>Ce que tu obtiens avec cette offre</Text>
        <ul style={styles.featuresList}>
          <li style={styles.featureItem}>
            💰 <strong>Réduction exclusive</strong> - Économise sur ton inscription
          </li>
          <li style={styles.featureItem}>
            🎯 <strong>Choix de formats</strong> - Solo, duo ou équipe selon tes envies
          </li>
          <li style={styles.featureItem}>
            📸 <strong>Photos professionnelles</strong> - En option, pour garder un souvenir de tous tes moments forts
          </li>
          <li style={styles.featureItem}>
            🏅 <strong>Médaille finisher</strong> - Pour célébrer ton accomplissement
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={ctaUrl} style={styles.button}>
            {ctaLabel || 'Voir les événements'}
          </Button>
        </Section>

        {/* Featured Events */}
        <Text style={styles.sectionTitle}>Événements à venir</Text>
        <Section style={styles.eventsCard}>
          <table style={styles.eventsTable}>
            <tbody>
              <tr>
                <td style={styles.eventItem}>
                  <Text style={styles.eventName}>🏔️ Ultra Arena</Text>
                  <Text style={styles.eventMeta}>15 février 2026 • Lyon</Text>
                </td>
              </tr>
              <tr>
                <td style={styles.eventItem}>
                  <Text style={styles.eventName}>🌙 Night Run Paris</Text>
                  <Text style={styles.eventMeta}>8 mars 2026 • Paris</Text>
                </td>
              </tr>
              <tr>
                <td style={styles.eventItem}>
                  <Text style={styles.eventName}>🎯 Horizon Challenge</Text>
                  <Text style={styles.eventMeta}>12 avril 2026 • Annecy</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Urgency Message */}
        <Section style={styles.urgencyCard}>
          <Text style={styles.urgencyText}>
            ⏰ Cette offre est <strong>limitée dans le temps</strong>. Ne la laisse pas passer !
          </Text>
        </Section>

        {/* Footer Message */}
        <Text style={styles.footerText}>
          Prêt à relever le défi ? Utilise ton code et inscris-toi dès maintenant !
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default PromoCampaignEmail

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
  giftIcon: {
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
  promoCard: {
    backgroundColor: '#dcfce7',
    border: '2px solid #16a34a',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  promoCardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  promoCodeContainer: {
    backgroundColor: '#ffffff',
    border: '2px dashed #16a34a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  promoCode: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#166534',
    margin: '0',
    textAlign: 'center',
    letterSpacing: '0.1em',
    fontFamily: 'monospace',
  },
  promoHowTo: {
    fontSize: '13px',
    color: '#166534',
    margin: '0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  detailsCard: {
    backgroundColor: '#fef3c7',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '24px',
  },
  detailsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#92400e',
  },
  detailsText: {
    fontSize: '13px',
    color: '#78350f',
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
  eventsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  eventsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  eventItem: {
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  eventName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  eventMeta: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0',
  },
  urgencyCard: {
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  urgencyText: {
    fontSize: '14px',
    color: '#991b1b',
    margin: '0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
}
