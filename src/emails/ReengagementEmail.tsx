import * as React from 'react'
import { Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface ReengagementEmailProps {
  fullName?: string | null
  eventsUrl: string
  blogUrl: string
  accountUrl: string
  lastActivityDate?: string
}

export function ReengagementEmail({
  fullName,
  eventsUrl,
  blogUrl,
  accountUrl,
  lastActivityDate,
}: ReengagementEmailProps) {
  const featuredImages = [
    {
      src: `${getEmailAssetsBaseUrl()}/images/images/a-middle-aged-man-rolling-a-tire-over.avif`,
      title: 'Défis Multiples',
      description:
        'Découvre le monde innovant des défis multiples, où chaque obstacle demande créativité et endurance pour maximiser ton potentiel.',
    },
    {
      src: `${getEmailAssetsBaseUrl()}/images/images/a-smiling-running-man-black-weared-sport.avif`,
      title: 'Classiques Intemporels',
      description:
        'Plonge dans l\'univers des classiques intemporels alors que nous explorons les courses mythiques qui ont résisté à l\'épreuve du temps.',
    },
  ]

  return (
    <EmailLayout
      preview="Ça nous a manqué de te voir !"
      showSocialLinks={true}
      showNavigationLinks={true}
    >
      <Section style={styles.section}>
        {/* Greeting */}
        <Text style={styles.greeting}>
          Cher{fullName ? ` ${fullName}` : ''}
        </Text>

        {/* Main Heading */}
        <Text style={styles.heading}>Tu nous as manqué !</Text>

        {/* Intro Message */}
        <Text style={styles.paragraph}>
          Cela fait un moment que nous ne t'avons pas vu sur Overbound.
          {lastActivityDate && ` Ta dernière visite remonte au ${lastActivityDate}.`} Nous
          avons plein de nouveautés à partager avec toi !
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* What's New Section */}
        <Text style={styles.sectionTitle}>Voici les prochaines courses à ne pas manquer</Text>

        <Text style={styles.paragraph}>
          Complète ton profil pour ton premier check-in{' '}
          <Link href={accountUrl} style={styles.inlineLink}>
            juste ici
          </Link>
        </Text>

        {/* Featured Events - Two Column Layout */}
        <Section style={styles.featuresSection}>
          <table style={styles.featuresTable}>
            <tbody>
              <tr>
                {featuredImages.map((feature, index) => (
                  <td key={index} style={styles.featureCell}>
                    <Section style={styles.featureCard}>
                      <Img
                        src={feature.src}
                        alt={feature.title}
                        width="250"
                        height="200"
                        style={styles.featureImage}
                      />
                      <Section style={styles.featureContent}>
                        <Text style={styles.featureSubtitle}>Nouveauté</Text>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                        <Link href={blogUrl} style={styles.readMoreLink}>
                          En savoir plus
                        </Link>
                      </Section>
                    </Section>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Section>

        {/* CTA Section */}
        <Section style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Prêt à repousser tes limites ?</Text>
          <Text style={styles.ctaParagraph}>
            Les places sont très limitées et risquent de partir vite. Ne manque pas l'opportunité
            de rejoindre notre communauté pour ton prochain défi.
          </Text>
          <Section style={styles.buttonContainer}>
            <Button href={eventsUrl} style={styles.primaryButton}>
              Découvrir les événements
            </Button>
          </Section>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Benefits Grid */}
        <Text style={styles.sectionTitle}>Pourquoi revenir sur Overbound ?</Text>

        <Section style={styles.benefitsGrid}>
          <table style={styles.benefitsTable}>
            <tbody>
              <tr>
                <td style={styles.benefitCell}>
                  <Text style={styles.benefitIcon}>🏆</Text>
                  <Text style={styles.benefitTitle}>Événements exclusifs</Text>
                  <Text style={styles.benefitText}>
                    Accède à des courses uniques réservées à notre communauté
                  </Text>
                </td>
                <td style={styles.benefitCell}>
                  <Text style={styles.benefitIcon}>👥</Text>
                  <Text style={styles.benefitTitle}>Communauté active</Text>
                  <Text style={styles.benefitText}>
                    Rejoins des milliers d'athlètes passionnés comme toi
                  </Text>
                </td>
              </tr>
              <tr>
                <td style={styles.benefitCell}>
                  <Text style={styles.benefitIcon}>📚</Text>
                  <Text style={styles.benefitTitle}>Conseils d'experts</Text>
                  <Text style={styles.benefitText}>
                    Profite de nos guides d'entraînement et nutrition
                  </Text>
                </td>
                <td style={styles.benefitCell}>
                  <Text style={styles.benefitIcon}>🎯</Text>
                  <Text style={styles.benefitTitle}>Défis progressifs</Text>
                  <Text style={styles.benefitText}>
                    Évolue à ton rythme avec des parcours adaptés
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Footer Message */}
        <Text style={styles.footerMessage}>
          Si tu ne souhaites plus recevoir nos emails, tu peux{' '}
          <Link href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://overbound-race.com'}/unsubscribe`} style={styles.link}>
            te désinscrire ici
          </Link>
          . Mais nous espérons vraiment te revoir bientôt !
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default ReengagementEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  greeting: {
    width: '100%',
    textAlign: 'center',
    fontSize: '16px',
    margin: '0 0 8px 0',
    color: '#111827',
  },
  heading: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 16px 0',
    textAlign: 'center',
    color: '#111827',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
    color: '#6b7280',
    textAlign: 'center',
  },
  inlineLink: {
    color: '#2563eb',
    textDecoration: 'underline',
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
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 0 24px 0',
    textAlign: 'center',
    color: '#111827',
  },
  featuresSection: {
    marginBottom: '32px',
  },
  featuresTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '16px',
  },
  featureCell: {
    width: '50%',
    verticalAlign: 'top',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  featureImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  featureContent: {
    padding: '16px',
  },
  featureSubtitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  featureDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: '0 0 12px 0',
  },
  readMoreLink: {
    fontSize: '14px',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 600,
  },
  ctaCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center',
    marginBottom: '32px',
  },
  ctaTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px 0',
  },
  ctaParagraph: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '0',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  benefitsGrid: {
    marginBottom: '32px',
  },
  benefitsTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '16px',
  },
  benefitCell: {
    width: '50%',
    verticalAlign: 'top',
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  benefitIcon: {
    fontSize: '32px',
    margin: '0 0 12px 0',
  },
  benefitTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  benefitText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: '0',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  footerMessage: {
    fontSize: '14px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: '0',
  },
}
