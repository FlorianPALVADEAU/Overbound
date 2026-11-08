import * as React from 'react'
import { Button, Section, Text } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface ReconsentEmailProps {
  firstName?: string | null
  confirmUrl: string
  unsubscribeUrl?: string
}

export function ReconsentEmail({ firstName, confirmUrl, unsubscribeUrl }: ReconsentEmailProps) {
  return (
    <EmailLayout preview="Choisis les emails que tu veux recevoir d'Overbound" unsubscribeUrl={unsubscribeUrl}>
      <Section style={styles.section}>
        <Text style={styles.heading}>
          {firstName ? `${firstName}, ` : ''}tu veux toujours recevoir nos nouvelles ?
        </Text>
        <Text style={styles.paragraph}>
          Nous remettons à plat la gestion des emails d&apos;Overbound. Nous ne pouvons plus prouver à quelle
          occasion tu as accepté de les recevoir, alors nous te demandons de choisir.
        </Text>
        <Text style={styles.paragraph}>
          Coche uniquement ce qui t&apos;intéresse : annonces d&apos;événements, alertes de prix, actualités,
          offres de partenaires, recrutement de bénévoles.
        </Text>

        <Section style={styles.buttonContainer}>
          <Button href={confirmUrl} style={styles.button}>
            Choisir mes emails
          </Button>
        </Section>

        <Text style={styles.footerText}>
          Sans réponse de ta part, nous ne t&apos;enverrons plus d&apos;emails marketing. Les emails liés à tes
          inscriptions (billets, reçus) ne changent pas.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default ReconsentEmail

const styles: Record<string, React.CSSProperties> = {
  section: { lineHeight: '1.6' },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
    color: '#374151',
    textAlign: 'center',
  },
  buttonContainer: { textAlign: 'center', marginTop: '24px' },
  button: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  footerText: {
    marginTop: '24px',
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
  },
}
