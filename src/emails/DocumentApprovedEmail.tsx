import * as React from 'react'
import { Preview, Section, Text, Img } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface DocumentApprovedEmailProps {
  participantName?: string | null
  eventTitle: string
}

export function DocumentApprovedEmail({ participantName, eventTitle }: DocumentApprovedEmailProps) {
  return (
    <EmailLayout preview={`Document validé pour ${eventTitle}`}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/a-young-men-carrying-two-wooden-logs-on-his-shoulders-shouting-at-the-camera.avif`}
        alt="Document validé"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        <Text style={styles.heading}>{participantName ? `Bonne nouvelle ${participantName} !` : 'Bonne nouvelle !'}</Text>
        <Text style={styles.paragraph}>
          Ton document a été vérifié et validé pour l’événement <strong>{eventTitle}</strong>.
        </Text>
        <Text style={styles.paragraph}>
          Tu es maintenant prêt·e pour le jour J. Garde un œil sur tes emails, nous t’enverrons d’autres informations utiles à l’approche de l’événement.
        </Text>
        <Text style={styles.secondary}>Merci de ta réactivité et à très vite sur la ligne de départ !</Text>
      </Section>
    </EmailLayout>
  )
}

export default DocumentApprovedEmail

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
  successIcon: {
    display: 'inline-block',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '16px',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    marginBottom: '12px',
    textAlign: 'center',
    color: '#6b7280',
  },
  secondary: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
  },
}
