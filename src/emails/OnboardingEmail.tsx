import * as React from 'react'
import { Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface OnboardingEmailProps {
  fullName?: string | null
  accountUrl: string
  eventsUrl: string
  blogUrl: string
}

export function OnboardingEmail({ fullName, accountUrl, eventsUrl, blogUrl }: OnboardingEmailProps) {
  const galleryImages = [
    `${getEmailAssetsBaseUrl()}/images/images/a-middle-aged-man-rolling-a-tire-over.avif`,
    `${getEmailAssetsBaseUrl()}/images/images/a-smiling-running-man-black-weared-sport.avif`,
    `${getEmailAssetsBaseUrl()}/images/images/blond-lady-carrying-chains.avif`,
  ]

  return (
    <EmailLayout
      preview="Bienvenue sur Overbound"
      showSocialLinks={true}
      showNavigationLinks={true}
    >
      <Section style={styles.section}>
        {/* Hero Image */}
        <Img
          src={`${getEmailAssetsBaseUrl()}/images/images/participants-carrying-wooden-logs-going-uphill.avif`}
          alt="Overbound logo"
          width="400"
          style={styles.heroImage}
        />

        {/* Greeting */}
        <Text style={styles.greeting}>
          Cher{fullName ? ` ${fullName}` : ''}
        </Text>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Bienvenue sur Overbound
        </Text>

        {/* Welcome Message */}
        <Text style={styles.paragraph}>
          Merci d'avoir rejoint Overbound. Nos équipes sont fières de tout mettre en
          oeuvre pour que tu profites à fond des événements et de la communauté.
          Nous espérons que tu te sentiras comme chez toi chez nous, et surtout
          car les places sont très limitées, elles risquent de partir vite !
        </Text>

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={eventsUrl} style={styles.button}>
            Je réserve ma première course !
          </Button>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Recommended Actions */}
        <Text style={styles.sectionTitle}>
          Voici les prochaines actions que nous te recommandons de faire :
        </Text>

        <ul style={styles.list}>
          <li style={styles.listItem}>
            <b>Complète ton profil</b> pour personnaliser ton expérience et faciliter ton check-in.{' '}
            <Link href={accountUrl} style={styles.link}>Accéder à mon profil</Link>
          </li>
          <li style={styles.listItem}>
            <b>Explore les prochains événements</b> :{' '}
            <Link href={eventsUrl} style={styles.link}>Voir le calendrier</Link>
          </li>
          <li style={styles.listItem}>
            <b>Découvre nos conseils</b> d'entraînements, nutrition et récits d'athlètes sur notre{' '}
            <Link href={blogUrl} style={styles.link}>blog</Link>
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Image Gallery */}
        <Text style={styles.sectionTitle}>
          Nos dernières images
        </Text>

        <Section style={styles.gallerySection}>
          <table style={styles.galleryTable}>
            <tbody>
              <tr>
                {galleryImages.map((imgSrc, index) => (
                  <td key={index} style={styles.galleryCell}>
                    <Img
                      src={imgSrc}
                      alt={`Gallery image ${index + 1}`}
                      width="150"
                      height="250"
                      style={styles.galleryImage}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Section>
      </Section>
    </EmailLayout>
  )
}

export default OnboardingEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '32px 0',
    width: '100%',
    height: '1px',
    borderRadius: '1000px'
  },
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
  greeting: {
    width: '100%',
    textAlign: 'center',
    fontSize: '16px',
    margin: '0 0 8px 0',
    color: '#111827',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 20px 0',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    color: '#111827',
    textAlign: 'center',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '32px 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  list: {
    marginLeft: '0',
    paddingLeft: '20px',
    marginBottom: '32px',
    color: '#111827',
  },
  listItem: {
    marginBottom: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  gallerySection: {
    marginTop: '16px',
  },
  galleryTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '8px',
  },
  galleryCell: {
    width: '33.33%',
    textAlign: 'center',
  },
  galleryImage: {
    width: '150px',
    height: '250px',
    objectFit: 'cover',
    borderRadius: '6px',
    display: 'block',
    margin: '0 auto',
  },
}
