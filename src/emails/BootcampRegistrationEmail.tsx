import * as React from 'react'
import { Section, Text, Button, Hr, Img } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

export interface BootcampRegistrationEmailProps {
  fullName: string | null
  bootcampTitle: string
  startsAt: string
  locationName: string
  locationAddress: string | null
}

export function BootcampRegistrationEmail({
  fullName,
  bootcampTitle,
  startsAt,
  locationName,
  locationAddress,
}: BootcampRegistrationEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

  const formattedDate = !Number.isNaN(Date.parse(startsAt))
    ? new Date(startsAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Paris',
      })
    : startsAt

  const formattedTime = !Number.isNaN(Date.parse(startsAt))
    ? new Date(startsAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
      })
    : null

  const greeting = fullName ? `Salut ${fullName} !` : 'Salut !'

  return (
    <EmailLayout preview={`Tu es inscrit·e au ${bootcampTitle} — à très vite !`}>
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/young-man-lifting-a-tractor-tire-with-a-photograph-in-his-back.avif`}
        alt="Bootcamp Overbound"
        width="560"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Icône succès */}
        <Section style={styles.iconWrap}>
          <div style={styles.iconCircle}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#dcfce7" />
              <path d="M12 20l6 6 10-10" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Section>

        <Text style={styles.heading}>{greeting}</Text>

        <Text style={styles.paragraph}>
          Ta place est confirmée pour le <strong style={{ color: '#111827' }}>{bootcampTitle}</strong>.
          On est impatients de t'y retrouver 💪
        </Text>

        <Hr style={styles.divider} />

        {/* Carte bootcamp */}
        <Section style={styles.card}>
          <Text style={styles.cardLabel}>BOOTCAMP</Text>
          <Text style={styles.cardTitle}>{bootcampTitle}</Text>

          <table style={styles.detailsTable} cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td style={styles.detailIcon}>📅</td>
                <td style={styles.detailText}>
                  <strong>Date :</strong> {formattedDate}
                  {formattedTime ? ` à ${formattedTime}` : ''}
                </td>
              </tr>
              <tr>
                <td style={styles.detailIcon}>📍</td>
                <td style={styles.detailText}>
                  <strong>Lieu :</strong> {locationName}
                  {locationAddress ? ` — ${locationAddress}` : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Infos pratiques */}
        <Section style={styles.infoCard}>
          <Text style={styles.infoTitle}>À ne pas oublier</Text>
          <Text style={styles.infoItem}>• Tenue de sport adaptée à l'extérieur</Text>
          <Text style={styles.infoItem}>• Chaussures de trail ou running</Text>
          <Text style={styles.infoItem}>• Gourde d'eau (1 L minimum)</Text>
          <Text style={styles.infoItem}>• Arriver 10 minutes avant le départ</Text>
        </Section>

        <Hr style={styles.divider} />

        <Text style={styles.ctaLabel}>Besoin de modifier ta présence ?</Text>
        <Section style={styles.ctaWrap}>
          <Button href={`${baseUrl}/bootcamps`} style={styles.button}>
            Gérer mon inscription
          </Button>
        </Section>

        <Text style={styles.closing}>
          À très vite sur le terrain !<br />
          <strong>L'équipe Overbound</strong>
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default BootcampRegistrationEmail

const styles: Record<string, React.CSSProperties> = {
  heroImage: {
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '240px',
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '8px',
    marginBottom: '24px',
    display: 'block',
  },
  section: {
    lineHeight: '1.6',
  },
  iconWrap: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  iconCircle: {
    display: 'inline-block',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
    textAlign: 'center',
    margin: '0 0 12px 0',
  },
  paragraph: {
    fontSize: '15px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '28px 0',
  },
  card: {
    backgroundColor: '#f0fdf4',
    border: '2px solid #16a34a',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: '11px',
    fontWeight: 900,
    color: '#16a34a',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    margin: '0 0 8px 0',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 20px 0',
  },
  detailsTable: {
    width: '100%',
  },
  detailIcon: {
    width: '28px',
    fontSize: '16px',
    verticalAlign: 'top',
    paddingBottom: '10px',
  },
  detailText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    paddingBottom: '10px',
    textAlign: 'left',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px 24px',
    marginBottom: '20px',
  },
  infoTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px 0',
  },
  infoItem: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 6px 0',
    lineHeight: '1.5',
  },
  ctaLabel: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0 0 16px 0',
  },
  ctaWrap: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  button: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '15px',
    display: 'inline-block',
  },
  closing: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.8',
  },
}
