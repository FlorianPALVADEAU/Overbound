import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface VolunteerEventSnapshot {
  id: string | null
  title: string | null
  date: string | null
  location: string | null
}

export interface VolunteerApplicationConfirmationEmailProps {
  applicantName: string
  preferredMission: string
  submittedAt: string
  event?: VolunteerEventSnapshot | null
}

export function VolunteerApplicationConfirmationEmail({ applicantName, preferredMission, submittedAt, event = null }: VolunteerApplicationConfirmationEmailProps) {
  const formattedEventDate =
    event?.date && !Number.isNaN(Date.parse(event.date))
      ? new Date(event.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null

  return (
    <EmailLayout preview="On a bien reçu ta candidature bénévole">
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/two-young-girls-climbing-a-wall-while-holding-each-others-hands.avif`}
        alt="Candidature bénévole reçue"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Success Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.successIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#fff7ed" />
              <path
                d="M20 32l8 8 16-16"
                stroke="#f97316"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          {applicantName ? `Merci ${applicantName} !` : 'Merci pour ta candidature !'}
        </Text>

        {/* Greeting */}
        <Text style={styles.paragraph}>
          On a bien reçu ta candidature pour rejoindre la <strong>tribu bénévole Overbound</strong>. Notre équipe revient vers toi sous 48 heures avec les prochaines étapes.
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Event Details */}
        {event && (
          <Section style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>
              {event.title ?? 'Événement Overbound'}
            </Text>
            {formattedEventDate && (
              <Text style={styles.highlightMeta}>
                📅 <strong>Date :</strong> {formattedEventDate}
              </Text>
            )}
            {event.location && (
              <Text style={styles.highlightMeta}>
                📍 <strong>Lieu :</strong> {event.location}
              </Text>
            )}
          </Section>
        )}

        {/* Mission Card */}
        <Section style={styles.card}>
          <Text style={styles.cardTitle}>Ta mission proposée</Text>
          <Text style={styles.missionText}>{preferredMission}</Text>
          <Text style={styles.cardNote}>
            Nous allons vérifier les besoins exacts sur l'événement et te confirmer le créneau idéal au plus vite.
          </Text>
        </Section>

        {/* Info Section */}
        <Section style={styles.infoCard}>
          <Text style={styles.infoText}>
            💬 Tu as un empêchement ou un complément d'information à partager ? Réponds directement à cet email, on t'accompagne jusqu'au jour J.
          </Text>
          <Text style={styles.submittedText}>
            Candidature reçue le {submittedAt}
          </Text>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Social CTA */}
        <Text style={styles.socialTitle}>
          Rejoins la tribu dès maintenant
        </Text>
        <Text style={styles.socialText}>
          En attendant, découvre les coulisses de la tribu et les témoignages des bénévoles de la saison dernière.
        </Text>

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href="https://www.instagram.com/overbound_race" style={styles.button}>
            Voir la tribu sur Instagram
          </Button>
        </Section>

        {/* Footer Message */}
        <Text style={styles.footerText}>
          À très bientôt dans la communauté OverBound !
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default VolunteerApplicationConfirmationEmail

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
  section: {
    lineHeight: '1.6',
  },
  iconContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  successIcon: {
    display: 'inline-block',
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
  highlightCard: {
    backgroundColor: '#fff7ed',
    border: '2px solid #f97316',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  highlightTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 12px 0',
    color: '#111827',
  },
  highlightMeta: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 6px 0',
    lineHeight: '1.6',
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    color: '#111827',
    textAlign: 'center',
  },
  missionText: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#f97316',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  cardNote: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  infoText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 12px 0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  submittedText: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '0',
    textAlign: 'center',
  },
  socialTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 12px 0',
    color: '#111827',
    textAlign: 'center',
  },
  socialText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  buttonContainer: {
    textAlign: 'center',
    margin: '24px 0',
  },
  button: {
    backgroundColor: '#f97316',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
    display: 'inline-block',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
}
