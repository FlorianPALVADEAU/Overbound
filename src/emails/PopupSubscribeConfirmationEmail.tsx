import * as React from 'react'
import { Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface PopupSubscribeConfirmationEmailProps {
  fullName?: string | null
  userId?: string
  eventsUrl: string
  blogUrl: string
}

export function PopupSubscribeConfirmationEmail({
  fullName,
  userId,
  eventsUrl,
  blogUrl,
}: PopupSubscribeConfirmationEmailProps) {
  return (
    <EmailLayout
      preview="Bienvenue dans la communauté Overbound — code cumulable WELCOME05"
      showSocialLinks={true}
      showNavigationLinks={true}
    >
      <Section style={styles.section}>
        {/* Hero Image */}
        <Img
          src={`${getEmailAssetsBaseUrl()}/images/images/participants-carrying-wooden-logs-going-uphill.avif`}
          alt="Overbound"
          width="400"
          style={styles.heroImage}
        />

        {/* Greeting */}
        <Text style={styles.greeting}>Cher{fullName ? ` ${fullName}` : ''}</Text>

        {/* Main Heading */}
        <Text style={styles.heading}>Bienvenue dans la communauté Overbound !</Text>

        {/* Welcome Message */}
        <Text style={styles.paragraph}>
          Merci de t'être inscrit à notre newsletter. Tu recevras désormais toutes nos actualités :
          nouveaux événements, offres partenaires, conseils d'entraînement et bien plus encore.
        </Text>

        <Text style={styles.paragraph}>
          Nous sommes ravis de t'accueillir dans notre communauté de passionnés de courses
          d'obstacles et de dépassement de soi !
        </Text>

        <Text style={styles.paragraph}>
          En cadeau de bienvenue, voici ton code de réduction <b>cumulable</b> :
        </Text>

        <Section style={styles.couponBox}>
          <Text style={styles.couponCode}>WELCOME05</Text>
        </Section>

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={eventsUrl} style={styles.button}>
            Découvrir nos prochains événements
          </Button>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* What to Expect */}
        <Text style={styles.sectionTitle}>Ce que tu vas recevoir :</Text>

        <ul style={styles.list}>
          <li style={styles.listItem}>
            <b>Nouveaux événements</b> dès leur annonce
          </li>
          <li style={styles.listItem}>
            <b>Alertes de prix</b> pour ne pas manquer les early bird
          </li>
          <li style={styles.listItem}>
            <b>Offres partenaires</b> exclusives
          </li>
          <li style={styles.listItem}>
            <b>Conseils d'entraînement</b> et articles de blog
          </li>
          <li style={styles.listItem}>
            <b>Opportunités de bénévolat</b> pour participer à l'organisation
          </li>
        </ul>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Additional Info */}
        <Text style={styles.paragraph}>
          Tu peux découvrir nos{' '}
          <Link href={eventsUrl} style={styles.link}>
            prochains événements
          </Link>{' '}
          et lire nos derniers{' '}
          <Link href={blogUrl} style={styles.link}>
            articles de blog
          </Link>{' '}
          dès maintenant.
        </Text>

        <Text style={styles.footerNote}>
          Tu peux te désinscrire à tout moment en cliquant sur le lien de désinscription en bas de
          nos emails.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default PopupSubscribeConfirmationEmail

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
    borderRadius: '1000px',
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
  couponBox: {
    backgroundColor: '#f3f4f6',
    border: '1px dashed #9ca3af',
    borderRadius: '10px',
    padding: '12px 16px',
    textAlign: 'center',
    margin: '8px 0 24px 0',
  },
  couponCode: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '1px',
    margin: 0,
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
  footerNote: {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    margin: '24px 0 0 0',
  },
}
