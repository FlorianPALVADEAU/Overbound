import * as React from 'react'
import { Preview, Section, Text, Link, Img, Hr, Button } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface PostEventThankYouEmailProps {
  participantName: string
  eventTitle: string
  eventId: string
  userId: string
  photosUrl?: string | null
  feedbackUrl: string
  nextEventUrl: string
}

export function PostEventThankYouEmail({ participantName, eventTitle, eventId, userId, photosUrl, feedbackUrl, nextEventUrl }: PostEventThankYouEmailProps) {
  const ratingScale = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <EmailLayout preview={`Merci d'avoir participé à ${eventTitle}`}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/two-sporty-mens-staring-at-the-camera-with-pride.avif`}
        alt="Merci de ta participation"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        <Text style={styles.heading}>Merci {participantName} !</Text>
        <Text style={styles.paragraph}>Quelle course ! Merci d'avoir fait vibrer {eventTitle}. On espère que l'expérience t'a plu autant qu'à nous.</Text>
        {photosUrl ? (
          <Text style={styles.paragraph}>
            <Link href={photosUrl} style={styles.link}>Découvre la galerie photos officielle</Link>
          </Text>
        ) : null}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Rating Section */}
        <Text style={styles.sectionTitle}>Ton avis compte</Text>
        <Text style={styles.ratingQuestion}>
          Sur une échelle de 1 à 10, recommanderais-tu {eventTitle} à un ami ?
        </Text>

        {/* Rating Scale */}
        <Section style={styles.ratingSection}>
          <table style={styles.ratingTable}>
            <tbody>
              <tr>
                {ratingScale.map((rating) => (
                  <td key={rating} style={styles.ratingCell}>
                    <Link
                      href={`${getEmailAssetsBaseUrl()}/feedback/rate?userId=${userId}&eventId=${eventId}&rating=${rating}`}
                      style={{
                        ...styles.ratingButton,
                        ...(rating <= 3
                          ? styles.ratingButtonRed
                          : rating <= 7
                          ? styles.ratingButtonYellow
                          : styles.ratingButtonGreen),
                      }}
                    >
                      {rating}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <table style={styles.ratingLabelsTable}>
            <tbody>
              <tr>
                <td style={styles.ratingLabelLeft}>Pas du tout</td>
                <td style={styles.ratingLabelRight}>Absolument</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* CTA */}
        <Text style={styles.sectionTitle}>Tu veux déjà planifier ton prochain défi ?</Text>
        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={nextEventUrl} style={styles.button}>
            Je réserve ma prochaine course !
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  )
}

export default PostEventThankYouEmail

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
  section: {
    lineHeight: '1.6',
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
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
    fontWeight: 600,
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
    margin: '0 0 12px 0',
    textAlign: 'center',
    color: '#111827',
  },
  ratingQuestion: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  ratingSection: {
    marginBottom: '32px',
  },
  ratingTable: {
    width: '100%',
    margin: '0 auto 12px',
    borderCollapse: 'separate',
    borderSpacing: '4px',
  },
  ratingCell: {
    textAlign: 'center',
  },
  ratingButton: {
    display: 'inline-block',
    width: '40px',
    height: '40px',
    lineHeight: '40px',
    textAlign: 'center',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    color: '#ffffff',
  },
  ratingButtonRed: {
    backgroundColor: '#dc2626',
  },
  ratingButtonYellow: {
    backgroundColor: '#f59e0b',
  },
  ratingButtonGreen: {
    backgroundColor: '#16a34a',
  },
  ratingLabelsTable: {
    width: '100%',
    margin: '0 auto',
  },
  ratingLabelLeft: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'left',
    width: '50%',
  },
  ratingLabelRight: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right',
    width: '50%',
  },
}
