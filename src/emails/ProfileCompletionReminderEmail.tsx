import * as React from 'react'
import { Body, Container, Head, Html, Hr, Link, Preview, Section, Text } from '@react-email/components'

interface ProfileCompletionReminderEmailProps {
  fullName?: string | null
  accountUrl: string
  missingFields: string[]
}

export function ProfileCompletionReminderEmail({
  fullName,
  accountUrl,
  missingFields,
}: ProfileCompletionReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Complète ton profil OverBound</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>
              {fullName ? `Hey ${fullName},` : 'Salut,'}
            </Text>

            <Text style={styles.paragraph}>
              Il manque encore quelques informations sur ton profil. Elles nous permettent de te contacter en cas d’urgence et d’accélérer ton check-in le jour J.
            </Text>

            <Text style={styles.paragraph}>
              Champs à compléter&nbsp;:
            </Text>

            <ul style={styles.list}>
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>

            <Text style={styles.paragraph}>
              <Link href={accountUrl} style={styles.link}>
                Mets à jour ton profil en 2 minutes
              </Link>
            </Text>

            <Hr style={styles.divider} />

            <Text style={styles.secondary}>
              Completer ces informations nous aide aussi à te proposer des événements adaptés et à t’envoyer des rappels utiles.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ProfileCompletionReminderEmail

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
    fontSize: '22px',
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
  },
  link: {
    color: '#0f172a',
    textDecoration: 'underline',
    fontWeight: 600,
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
