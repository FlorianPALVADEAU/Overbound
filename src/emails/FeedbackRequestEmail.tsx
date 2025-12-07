import * as React from 'react'
import { Section, Text, Link, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'

interface FeedbackRequestEmailProps {
  fullName?: string | null
  eventName: string
  feedbackUrl: string
  eventDate?: string
}

export function FeedbackRequestEmail({
  fullName,
  eventName,
  feedbackUrl,
  eventDate,
}: FeedbackRequestEmailProps) {
  // Generate rating scale buttons (1-10)
  const ratingScale = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <EmailLayout
      preview="Ton avis compte pour nous"
      showSocialLinks={true}
      showNavigationLinks={false}
    >
      <Section style={styles.section}>
        {/* Subtitle */}
        <Text style={styles.subtitle}>Ton avis compte</Text>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Nous aimerions avoir ton retour
        </Text>

        {/* Intro Message */}
        <Text style={styles.paragraph}>
          Nous cherchons constamment à améliorer l'expérience produit pour tous nos utilisateurs
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Event Reference */}
        {eventDate && (
          <Section style={styles.eventCard}>
            <Text style={styles.eventText}>
              Tu as participé à <b>{eventName}</b>
              <br />
              le {eventDate}
            </Text>
          </Section>
        )}

        {/* Rating Question */}
        <Text style={styles.questionText}>
          Sur une échelle de 1 à 10, quelle est la probabilité que tu recommandes Overbound à un
          ami ?
        </Text>

        {/* Rating Scale */}
        <Section style={styles.ratingSection}>
          <table style={styles.ratingTable}>
            <tbody>
              <tr>
                {ratingScale.map((rating) => (
                  <td key={rating} style={styles.ratingCell}>
                    <Link
                      href={`${feedbackUrl}?rating=${rating}`}
                      style={{
                        ...styles.ratingButton,
                        ...(rating <= 6
                          ? styles.ratingButtonRed
                          : rating <= 8
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
                <td style={styles.ratingLabelLeft}>Pas du tout probable</td>
                <td style={styles.ratingLabelRight}>Très probable</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Detailed Feedback CTA */}
        <Text style={styles.sectionTitle}>Partage ton expérience complète</Text>

        <Text style={styles.paragraph}>
          Aide-nous à mieux comprendre ce qui a fonctionné et ce que nous pouvons améliorer.
          Ton retour nous est précieux.
        </Text>

        <Section style={styles.buttonContainer}>
          <Button href={feedbackUrl} style={styles.button}>
            Donner mon avis détaillé
          </Button>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Thank You */}
        <Section style={styles.thankYouCard}>
          <Text style={styles.thankYouText}>
            Merci de prendre le temps de nous aider à améliorer Overbound. Chaque retour compte et
            nous permet de créer de meilleures expériences pour notre communauté.
          </Text>
        </Section>

        {/* Quick Stats */}
        <Text style={styles.smallText}>
          En moyenne, cela prend seulement 2-3 minutes
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default FeedbackRequestEmail

const styles: Record<string, React.CSSProperties> = {
  section: {
    lineHeight: '1.6',
  },
  subtitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2563eb',
    textAlign: 'center',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  heading: {
    fontSize: '28px',
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
  separator: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '32px 0',
    width: '100%',
    height: '1px',
    borderRadius: '1000px',
  },
  eventCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  eventText: {
    fontSize: '15px',
    color: '#111827',
    textAlign: 'center',
    margin: '0',
  },
  questionText: {
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
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    textAlign: 'center',
    color: '#111827',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  thankYouCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  },
  thankYouText: {
    fontSize: '14px',
    color: '#065f46',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
  smallText: {
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    margin: '0',
  },
}
