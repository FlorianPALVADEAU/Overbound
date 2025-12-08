import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface PriceChangeReminderEmailProps {
  fullName?: string | null
  eventTitle: string
  eventDate: string
  deadlineLabel: string
  eventUrl: string
  currentPriceLabel: string
  nextPriceLabel?: string | null
  unsubscribeUrl?: string
}

export function PriceChangeReminderEmail({
  fullName,
  eventTitle,
  eventDate,
  deadlineLabel,
  eventUrl,
  currentPriceLabel,
  nextPriceLabel,
  unsubscribeUrl,
}: PriceChangeReminderEmailProps) {
  const preview = 'Dernier rappel — tarif change bientôt'

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/runner-wearing-glasses-astonished.avif`}
        alt="Dernière chance"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Urgency Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.urgencyIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#fee2e2" />
              <path
                d="M32 20v12l8 8"
                stroke="#ef4444"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="12" stroke="#ef4444" strokeWidth="3" />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          {fullName ? `${fullName}, dernière chance !` : 'Dernière chance !'}
        </Text>

        {/* Intro */}
        <Text style={styles.paragraph}>
          Le tarif actuel pour <strong>{eventTitle}</strong> se termine <strong>{deadlineLabel}</strong>.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Price Comparison Card */}
        <Section style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>Comparaison des tarifs</Text>
          <table style={styles.priceTable}>
            <tbody>
              <tr>
                <td style={styles.priceLabel}>Tarif actuel</td>
                <td style={styles.priceCurrentValue}>{currentPriceLabel}</td>
              </tr>
              {nextPriceLabel && (
                <>
                  <tr>
                    <td style={styles.priceLabel}>Prochain tarif</td>
                    <td style={styles.priceNextValue}>{nextPriceLabel}</td>
                  </tr>
                  <tr>
                    <td style={styles.priceSavingsLabel}>💰 Tu économises</td>
                    <td style={styles.priceSavingsValue}>
                      Jusqu'à {parseInt(nextPriceLabel) - parseInt(currentPriceLabel)}€
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </Section>

        {/* Countdown Card */}
        <Section style={styles.countdownCard}>
          <Text style={styles.countdownTitle}>⏰ Le tarif change {deadlineLabel}</Text>
          <Text style={styles.countdownText}>
            Ne rate pas cette opportunité de profiter du meilleur prix.
          </Text>
        </Section>

        {/* What's Included */}
        <Text style={styles.sectionTitle}>Inclus dans ton inscription</Text>
        <ul style={styles.featuresList}>
          <li style={styles.featureItem}>
            🎫 <strong>Dossard & chronomètre</strong> - Suivi de ta performance en temps réel
          </li>
          <li style={styles.featureItem}>
            🏅 <strong>Médaille finisher</strong> - Récompense ta détermination
          </li>
          <li style={styles.featureItem}>
            📸 <strong>Photos professionnelles</strong> - En option, pour garder un souvenir de tous tes moments forts
          </li>
          <li style={styles.featureItem}>
            🎉 <strong>Village partenaires</strong> - Animations, musique et ravitaillement
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={eventUrl} style={styles.button}>
            Je profite du tarif actuel
          </Button>
        </Section>

        {/* Event Info */}
        <Section style={styles.infoCard}>
          <Text style={styles.infoText}>
            📅 <strong>Date de l'événement :</strong> {eventDate}
          </Text>
          <Text style={styles.infoText}>
            📍 <strong>Événement :</strong> {eventTitle}
          </Text>
        </Section>

        {/* Footer Message */}
        <Text style={styles.footerText}>
          Réserve ta place avant le changement de prix et prépare-toi à relever le défi !
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default PriceChangeReminderEmail

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
  urgencyIcon: {
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
  priceCard: {
    backgroundColor: '#fee2e2',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  priceCardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  priceTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  priceLabel: {
    fontSize: '14px',
    color: '#7f1d1d',
    paddingBottom: '12px',
    verticalAlign: 'top',
    width: '50%',
    fontWeight: 600,
  },
  priceCurrentValue: {
    fontSize: '20px',
    color: '#16a34a',
    fontWeight: 700,
    paddingBottom: '12px',
    verticalAlign: 'top',
    textAlign: 'right',
  },
  priceNextValue: {
    fontSize: '18px',
    color: '#991b1b',
    fontWeight: 600,
    paddingBottom: '12px',
    verticalAlign: 'top',
    textAlign: 'right',
    textDecoration: 'line-through',
  },
  priceSavingsLabel: {
    fontSize: '14px',
    color: '#16a34a',
    paddingTop: '8px',
    borderTop: '1px solid #fecaca',
    fontWeight: 600,
  },
  priceSavingsValue: {
    fontSize: '16px',
    color: '#16a34a',
    fontWeight: 700,
    paddingTop: '8px',
    borderTop: '1px solid #fecaca',
    textAlign: 'right',
  },
  countdownCard: {
    backgroundColor: '#fef3c7',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '24px',
  },
  countdownTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#92400e',
    textAlign: 'center',
  },
  countdownText: {
    fontSize: '14px',
    color: '#78350f',
    margin: '0',
    lineHeight: '1.6',
    textAlign: 'center',
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
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  infoText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0',
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
