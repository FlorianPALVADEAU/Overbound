import * as React from 'react'
import { Body, Container, Head, Html, Section, Text, Link } from '@react-email/components'
import { getLogoUrl } from '@/lib/email/config'
interface EmailLayoutProps {
  preview?: string
  children: React.ReactNode
  unsubscribeUrl?: string
  supportEmail?: string
  showSocialLinks?: boolean
  showNavigationLinks?: boolean
}

export function EmailLayout({
  preview,
  children,
  unsubscribeUrl,
  supportEmail,
  showSocialLinks = false,
  showNavigationLinks = false,
}: EmailLayoutProps) {
  // Use absolute URL for email compatibility
  const logoSrc = getLogoUrl()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://overbound-race.com'

  return (
    <Html>
      <Head />
      {/* Preview text shown in many mail clients */}
      {preview ? <meta name="preview" content={preview} /> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <img src={logoSrc} alt="Overbound" width={80} style={styles.logo} />
          </Section>

          <Section style={styles.content}>{children}</Section>

          {/* Social Media Links */}
          {showSocialLinks && (
            <Section style={styles.socialSection}>
              <table style={styles.socialTable}>
                <tbody>
                  <tr>
                    <td style={styles.socialIcon}>
                      <a href="https://facebook.com/overbound" style={styles.socialLink}>
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTggMmgtM2E1IDUgMCAwIDAtNSA1djNIN3Y0aDN2OGg0di04aDNsMS00aC00VjdhMSAxIDAgMCAxIDEtMWgzeiIvPjwvc3ZnPg=="
                          alt="Facebook"
                          width="20"
                          height="20"
                        />
                      </a>
                    </td>
                    <td style={styles.socialIcon}>
                      <a href="https://twitter.com/overbound" style={styles.socialLink}>
                        <img  
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjIgNHMtLjcgMi4xLTIgMy40YzEuNiAxMC0xMC43IDIwLjQtMTggMTMuOCA3LjctMSAxMC00IDEyLTcuM2MtMS01LjUtMi41LTcuMy02LTguNXYtMmMzLjYgMS40IDYgNiA3IDcgNS00LjUgNi0xMS4yIDctMTIuMXoiLz48L3N2Zz4="
                          alt="Twitter"
                          width="20"
                          height="20"
                        />
                      </a>
                    </td>
                    <td style={styles.socialIcon}>
                      <a href="https://instagram.com/overbound" style={styles.socialLink}>
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSI1IiByeT0iNSIvPjxwYXRoIGQ9Ik0xNiAxMS4zN0ExIDEgMCAxIDEgMTYgMTAuNiAxIDEgMCAwIDEgMTYgMTEuMzd6Ii8+PHBhdGggZD0iTTIxIDRoLTNhNSA1IDAgMCAwLTUgNXYzSDd2NGgzdjhoNHYtOGgzbDEtNGgtNFY3YTEgMSAwIDAgMSAxLTFoM3oiLz48L3N2Zz4="
                          alt="Instagram"
                          width="20"
                          height="20"
                        />
                      </a>
                    </td>
                    <td style={styles.socialIcon}>
                      <a href="https://youtube.com/@overbound" style={styles.socialLink}>
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjIuNTQgNi40MnMtLjIyLTEuNTctLjktMi4yNmMtLjg1LS45LTEuOC0uOS0yLjI0LS45NS0zLjEzLS4yMy03LjgyLS4yMy03LjgyLS4yM2gtLjA0cy00LjY5IDAtNy44Mi4yM2MtLjQ0LjA1LTEuMzkuMDUtMi4yNC45NS0uNjguNjktLjkgMi4yNi0uOSAyLjI2UzAgOC4yIDAgMTAuMDF2MS42OWMwIDEuODEuNTQgMy42LjU0IDMuNnMuMjIgMS41Ny45IDIuMjZjLjg1LjkgMS45Ni44NyAyLjQ2Ljk3IDEuNzguMTcgNy42LjIzIDcuNi4yM3M0LjctLjAxIDcuODMtLjI0Yy40NC0uMDUgMS4zOS0uMDUgMi4yNC0uOTUuNjgtLjY5LjktMi4yNi45LTIuMjZTMjQgMTMuNSAyNCAxMS43di0xLjY5YzAtMS44MS0uNTQtMy42LS41NC0zLjZ6TTkuNTQgMTUuNTNWNy42M2w3LjUgMy45NS03LjUgMy45NXoiLz48L3N2Zz4="
                          alt="YouTube"
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
                    <td style={styles.navSeparator}>|</td>
                    <td style={styles.navLink}>
                      <Link href={`${baseUrl}/obstacles`} style={styles.link}>Obstacles</Link>
                    </td>
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
    marginTop: '20px',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '12px',
  },
  small: {
    fontSize: '12px',
    color: '#acacac',
    marginBottom: '8px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  smallLink: {
    color: '#9b9b9b',
  },
}
