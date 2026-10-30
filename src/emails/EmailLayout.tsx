import * as React from 'react'
import { Body, Container, Head, Html, Preview, Section, Text, Link } from '@react-email/components'
import { getEmailAssetsBaseUrl, getWhiteLogoUrl, type EmailPhoto } from '@/lib/email/config'
import { HeroPhoto } from './blocks'

interface EmailLayoutProps {
  preview?: string
  children: React.ReactNode
  unsubscribeUrl?: string
  supportEmail?: string
  showSocialLinks?: boolean
  showNavigationLinks?: boolean
  /** Full-width photo between the header band and the content. */
  hero?: { photo: EmailPhoto; alt: string }
}

/** Phones: full-width card, tighter padding. Ignored by Gmail webmail, which stays readable. */
const MOBILE_CSS = `
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; border-radius: 0 !important; }
    .pad { padding: 24px 20px !important; }
  }
`

export function EmailLayout({
  preview,
  children,
  unsubscribeUrl,
  showSocialLinks = false,
  showNavigationLinks = false,
  hero,
}: EmailLayoutProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://overbound-race.com'

  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <meta name="x-apple-disable-message-reformatting" />
        <style>{MOBILE_CSS}</style>
      </Head>
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={styles.body}>
        <Container className="container" style={styles.container}>
          <Section style={styles.header}>
            <a href={baseUrl} style={styles.logoLink}>
              <img src={getWhiteLogoUrl()} alt="Overbound" width={72} style={styles.logo} />
            </a>
          </Section>

          {hero ? <HeroPhoto photo={hero.photo} alt={hero.alt} /> : null}

          <Section className="pad" style={styles.content}>
            {children}
          </Section>

          {/* Social Media Links */}
          {showSocialLinks && (
            <Section style={styles.socialSection}>
              <table style={styles.socialTable}>
                <tbody>
                  <tr>
                    <td style={styles.socialIcon}>
                      <a href="https://facebook.com/overbound.race" style={styles.socialLink}>
                        <img
                          src={`${getEmailAssetsBaseUrl()}/images/decorations/facebook-icon.png`}
                          alt="Facebook"
                          width="20"
                          height="20"
                        />
                      </a>
                    </td>
                    <td style={styles.socialIcon}>
                      <a href="https://instagram.com/overbound.race" style={styles.socialLink}>
                        <img
                          src={`${getEmailAssetsBaseUrl()}/images/decorations/instagram-icon.png`}
                          alt="Instagram"
                          width="20"
                          height="20"
                        />
                      </a>
                    </td>
                    <td style={styles.socialIcon}>
                      <a href="https://www.tiktok.com/@overbound.race" style={styles.socialLink}>
                        <img
                          src={`${getEmailAssetsBaseUrl()}/images/decorations/tiktok-icon.png`}
                          alt="TikTok"
                          width="20"
                          height="20"
                        />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
          )}

          {/* Navigation Links */}
          {showNavigationLinks && (
            <Section style={styles.navSection}>
              <table style={styles.navTable}>
                <tbody>
                  <tr>
                    <td style={styles.navLink}>
                      <Link href={baseUrl} style={styles.link}>Accueil</Link>
                    </td>
                    <td style={styles.navSeparator}>|</td>
                    <td style={styles.navLink}>
                      <Link href={`${baseUrl}/courses`} style={styles.link}>Courses</Link>
                    </td>
                    {/* <td style={styles.navSeparator}>|</td>
                    <td style={styles.navLink}>
                      <Link href={`${baseUrl}/obstacles`} style={styles.link}>Obstacles</Link>
                    </td> */}
                    <td style={styles.navSeparator}>|</td>
                    <td style={styles.navLink}>
                      <Link href={`${baseUrl}/blog`} style={styles.link}>Entraînements</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
          )}

          <Section style={styles.footer}>
            <Text style={styles.small}>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vos données personnelles sont collectées et traitées par Overbound dans le cadre de la gestion de votre compte et de nos événements. Vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition au traitement de vos données. Pour exercer ces droits ou pour toute question relative à la protection de vos données, contactez-nous à{' '}
              <a href="mailto:contact@overbound-race.com" style={styles.link}>
                contact@overbound-race.com
              </a>
              .
            </Text>
            {unsubscribeUrl ? (
              <Text style={styles.small}>
                Vous recevez cet email car vous êtes inscrit·e sur Overbound. Pour arrêter de recevoir nos emails marketing, cliquez{' '}
                <a href={unsubscribeUrl} style={styles.smallLink}>
                  ici
                </a>
                .
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailLayout

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#eceee9',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#2b2f33',
    margin: 0,
    padding: '24px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    width: '600px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    backgroundColor: '#141414',
    padding: '20px 24px',
    textAlign: 'center',
  },
  logoLink: {
    textDecoration: 'none',
  },
  logo: {
    display: 'block',
    margin: '0 auto',
  },
  content: {
    padding: '32px 32px 24px 32px',
    lineHeight: 1.5,
  },
  socialSection: {
    marginTop: '32px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  socialTable: {
    margin: '0 auto',
    width: 'auto',
  },
  socialIcon: {
    padding: '0 8px',
  },
  socialLink: {
    textDecoration: 'none',
  },
  navSection: {
    marginTop: '16px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  navTable: {
    margin: '0 auto',
    width: 'auto',
  },
  navLink: {
    padding: '0 8px',
    fontSize: '14px',
  },
  navSeparator: {
    color: '#6b7280',
    padding: '0 4px',
    fontSize: '14px',
  },
  footer: {
    padding: '16px 32px 28px 32px',
    borderTop: '1px solid #e4e6e1',
  },
  small: {
    fontSize: '12px',
    lineHeight: '18px',
    color: '#6b7078',
    margin: '0 0 8px 0',
  },
  link: {
    color: '#1c7a1c',
    textDecoration: 'underline',
  },
  smallLink: {
    color: '#6b7078',
  },
}
