import * as React from 'react'
import { Body, Container, Head, Html, Section, Text } from '@react-email/components'

interface EmailLayoutProps {
  preview?: string
  children: React.ReactNode
  unsubscribeUrl?: string
  supportEmail?: string
}

export function EmailLayout({ preview, children, unsubscribeUrl, supportEmail }: EmailLayoutProps) {
  const logoSrc = 'https://cdn.overbound.app/public/images/LOGO_FULL.webp'

  return (
    <Html>
      <Head />
      {/* Preview text shown in many mail clients */}
      {preview ? <meta name="preview" content={preview} /> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <img src={logoSrc} alt="Overbound" width={160} style={styles.logo} />
          </Section>

          <Section style={styles.content}>{children}</Section>

          <Section style={styles.footer}>
            <Text style={styles.small}>
              Vous recevez cet email car vous êtes inscrit·e sur Overbound.
            </Text>
            <Text style={styles.small}>
              Pour arrêter de recevoir nos emails, cliquez ici:{' '}
              {unsubscribeUrl ? (
                <a href={unsubscribeUrl} style={styles.link}>
                  Se désinscrire
                </a>
              ) : (
                ' [lien de désinscription] '
              )}
            </Text>
            <Text style={styles.small}>
              Pour toute question: {supportEmail ? (
                <a href={`mailto:${supportEmail}`} style={styles.link}>{supportEmail}</a>
              ) : ('support@overbound.app')}
            </Text>
            <Text style={styles.small}>
              Conformément au RGPD, vos données sont traitées par Overbound. Vous pouvez exercer vos droits en répondant à cet email ou via votre compte.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailLayout

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    padding: '20px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '28px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '12px',
  },
  logo: {
    display: 'block',
    margin: '0 auto',
  },
  content: {
    lineHeight: 1.5,
  },
  footer: {
    marginTop: '20px',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '12px',
  },
  small: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
}
