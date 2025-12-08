import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface InactiveUserEmailProps {
  fullName?: string | null
  lastEventTitle?: string | null
  eventsUrl: string
  highlightEventTitle?: string | null
  highlightEventUrl?: string | null
  unsubscribeUrl?: string
}

export function InactiveUserEmail({
  fullName,
  lastEventTitle,
  eventsUrl,
  highlightEventTitle,
  highlightEventUrl,
  unsubscribeUrl,
}: InactiveUserEmailProps) {
  const preview = 'Tu nous manques sur OverBound !'

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.avif`}
        alt="On reprend la ligne de départ"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Main Heading */}
        <Text style={styles.heading}>
          {fullName ? `${fullName}, on reprend la ligne de départ ?` : 'On reprend la ligne de départ ?'}
        </Text>

        {/* Intro */}
        <Text style={styles.paragraph}>
          Ça fait un moment qu'on ne t'a pas vu sur OverBound.{' '}
          {lastEventTitle ? `Ton dernier challenge : ${lastEventTitle}.` : 'Viens te mesurer à nos nouveaux formats !'}
        </Text>

        <Text style={styles.paragraph}>
          La communauté t'attend et de nouveaux défis sont prêts à être relevés.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* What's New Section */}
        <Text style={styles.sectionTitle}>🆕 Nouveautés depuis ton dernier passage</Text>
        <Section style={styles.featuresCard}>
          <ul style={styles.featuresList}>
            <li style={styles.featureItem}>
              <strong>Nouveaux formats</strong> - Des parcours inédits adaptés à tous les niveaux
            </li>
            <li style={styles.featureItem}>
              <strong>Night Run</strong> - Découvre nos courses nocturnes avec obstacles lumineux
            </li>
            <li style={styles.featureItem}>
              <strong>Photos professionnelles</strong> - En option, pour garder un souvenir de tous tes moments forts
            </li>
            <li style={styles.featureItem}>
              <strong>Médailles collector</strong> - Des designs exclusifs pour chaque événement
            </li>
          </ul>
        </Section>

        {/* Highlighted Event */}
        {highlightEventTitle && highlightEventUrl && (
          <>
            <Hr style={styles.separator} />
            <Text style={styles.sectionTitle}>🎯 Le prochain rendez-vous</Text>
            <Section style={styles.eventCard}>
              <Text style={styles.eventTitle}>{highlightEventTitle}</Text>
              <Text style={styles.eventDescription}>
                Rejoins les centaines de participants qui se sont déjà inscrits pour ce nouveau défi.
              </Text>
              <Section style={styles.eventButtonContainer}>
                <Button href={highlightEventUrl} style={styles.eventButton}>
                  Découvrir le programme
                </Button>
              </Section>
            </Section>
          </>
        )}

        {/* Community Stats
        <Section style={styles.statsCard}>
          <Text style={styles.statsTitle}>La communauté OverBound en chiffres</Text>
          <table style={styles.statsTable}>
            <tbody>
              <tr>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>12K+</Text>
                  <Text style={styles.statLabel}>Athlètes</Text>
                </td>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>50+</Text>
                  <Text style={styles.statLabel}>Événements</Text>
                </td>
                <td style={styles.statItem}>
                  <Text style={styles.statValue}>4.9/5</Text>
                  <Text style={styles.statLabel}>Satisfaction</Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section> */}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Welcome Back Offer */}
        <Section style={styles.offerCard}>
          <Text style={styles.offerIcon}>🎁</Text>
          <Text style={styles.offerTitle}>Offre de bienvenue</Text>
          <Text style={styles.offerText}>
            Pour fêter ton retour, profite de <strong>-15% sur ta prochaine inscription</strong> avec le code <strong>WELCOME15</strong>
          </Text>
        </Section>

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={eventsUrl} style={styles.button}>
            Voir les événements à venir
          </Button>
        </Section>

        {/* Footer Message */}
        <Text style={styles.footerText}>
          Prépare-toi, de nouveaux obstacles t'attendent. On est prêts quand tu l'es ! 💪
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default InactiveUserEmail

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
  welcomeIcon: {
    display: 'inline-block',
  },
  heading: {
    lineHeight: 'auto',
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
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
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  featuresList: {
    marginLeft: '0',
    paddingLeft: '20px',
    margin: '0',
  },
  featureItem: {
    marginBottom: '12px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#6b7280',
  },
  eventCard: {
    backgroundColor: '#dbeafe',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  eventTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 12px 0',
    color: '#111827',
    textAlign: 'center',
  },
  eventDescription: {
    fontSize: '14px',
    color: '#1e40af',
    margin: '0 0 16px 0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  eventButtonContainer: {
    textAlign: 'center',
  },
  eventButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    display: 'inline-block',
  },
  statsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  statsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
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
  offerCard: {
    backgroundColor: '#dcfce7',
    border: '2px solid #16a34a',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  offerIcon: {
    fontSize: '32px',
    margin: '0 0 8px 0',
  },
  offerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    color: '#111827',
  },
  offerText: {
    fontSize: '14px',
    color: '#166534',
    margin: '0',
    lineHeight: '1.6',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
}
