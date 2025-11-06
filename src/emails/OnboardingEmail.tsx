import * as React from 'react'
import { Preview, Section, Text, Link, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface OnboardingEmailProps {
  fullName?: string | null
  accountUrl: string
  eventsUrl: string
  blogUrl: string
}

export function OnboardingEmail({ fullName, accountUrl, eventsUrl, blogUrl }: OnboardingEmailProps) {
  return (
    <EmailLayout preview="Bienvenue sur OverBound">
      <Section style={styles.section}>
        <Text style={styles.heading}>
          Bienvenue{fullName ? ` ${fullName}` : ''} !
        </Text>

        <Text style={styles.paragraph}>
          Merci d’avoir rejoint OverBound. On t’aide à profiter à fond de nos événements et de la communauté.
        </Text>

        <Text style={styles.paragraph}>
          Voici les trois prochaines actions recommandées :
        </Text>

        <ul style={styles.list}>
          <li>
            <b>Complète ton profil</b> pour personnaliser ton expérience et faciliter le check-in.{' '}
            <Link href={accountUrl} style={styles.link}>Accéder à mon profil</Link>
          </li>
          <li>
            <b>Explore les événements</b> et réserve ta prochaine course.{' '}
            <Link href={eventsUrl} style={styles.link}>Voir le calendrier</Link>
          </li>
          <li>
            <b>Découvre nos conseils</b> d’entraînement, nutrition et récits d’athlètes.{' '}
            <Link href={blogUrl} style={styles.link}>Lire le blog</Link>
          </li>
        </ul>

        <Hr style={styles.divider} />

        <Text style={styles.secondary}>
          Tu recevras aussi nos mails essentiels (billets, mises à jour, rappels). Ajoute
          <br />
          <Link href="mailto:no-reply@overbound-race.com" style={styles.link}>
            no-reply@overbound-race.com
          </Link>{' '}
          à ton carnet pour ne rien manquer.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default OnboardingEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    padding: '24px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '560px',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '16px',
    margin: '12px 0',
  },
  list: {
    marginLeft: '18px',
    marginBottom: '18px',
    color: '#111827',
  },
  link: {
    color: '#0f172a',
    textDecoration: 'underline',
  },
  divider: {
    borderColor: '#e5e7eb',
    margin: '24px 0',
  },
  secondary: {
    fontSize: '14px',
    color: '#6b7280',
  },
}
