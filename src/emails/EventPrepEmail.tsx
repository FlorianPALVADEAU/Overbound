import * as React from 'react'
import { Preview, Section, Text, Link, Img } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface EventPrepEmailProps {
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  weeksRemaining: number
  checklist: string[]
  trainingUrl: string
}

export function EventPrepEmail({
  participantName,
  eventTitle,
  eventDate,
  eventLocation,
  weeksRemaining,
  checklist,
  trainingUrl,
}: EventPrepEmailProps) {
  const preview = `${eventTitle} — Préparation à ${weeksRemaining} semaine(s)`

  return (
    <EmailLayout preview={preview}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/young-lady-ramping-below-barbed-wires.avif`}
        alt="Overbound préparation"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>Préparation OverBound</Text>
        <Text style={styles.heading}>
          {weeksRemaining === 0
            ? 'C’est presque l’heure !'
            : `${weeksRemaining} semaine${weeksRemaining > 1 ? 's' : ''} avant ${eventTitle}`}
        </Text>
        <Text style={styles.meta}>
          {eventDate} • {eventLocation}
        </Text>
      </Section>

      <Section style={styles.section}>
        <Text style={styles.paragraph}>Salut {participantName},</Text>
        <Text style={styles.paragraph}>
          La course approche, voici ta checklist du moment pour rester prêt(e).
        </Text>
        <ul style={styles.list}>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {/* Training Programs Section */}
        <Section style={styles.programsSection}>
          <table style={styles.programsTable}>
            <tbody>
              <tr>
                {/* Program 1 - Sleek Study */}
                <td style={styles.programCell}>
                  <Section style={styles.programCard}>
                    <Img
                      src={`${getEmailAssetsBaseUrl()}/images/images/a-middle-aged-man-rolling-a-tire-over.avif`}
                      alt="Programme Essentiel"
                      width="250"
                      height="200"
                      style={styles.programImage}
                    />
                    <Section style={styles.programContent}>
                      <Text style={styles.programTitle}>Prépa physique</Text>
                      <Text style={styles.programDescription}>
                        Plan d'entraînement minimaliste avec les bases pour une préparation optimale
                      </Text>
                      <Link href={trainingUrl} style={styles.programButton}>
                        Commencer
                      </Link>
                    </Section>
                  </Section>
                </td>

                {/* Program 2 - Modern Workspace */}
                <td style={styles.programCell}>
                  <Section style={styles.programCard}>
                    <Img
                      src={`${getEmailAssetsBaseUrl()}/images/images/osteopath-practicing-pt2.avif`}
                      alt="Programme Récupération post-course"
                      width="250"
                      height="200"
                      style={styles.programImage}
                    />
                    <Section style={styles.programContent}>
                      <Text style={styles.programTitle}>Programme Récup'</Text>
                      <Text style={styles.programDescription}>
                        Entraînement avancé pour des sessions de préparation ultra-productives
                      </Text>
                      <Link href={trainingUrl} style={styles.programButton}>
                        Découvrir
                      </Link>
                    </Section>
                  </Section>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      </Section>
    </EmailLayout>
  )
}

export default EventPrepEmail

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
  
  sectionHeader: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  eyebrow: {
    color: '#16a34a',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '8px 0',
  },
  meta: {
    fontSize: '14px',
    color: '#6b7280',
  },
  section: {
    lineHeight: 1.6,
  },
  paragraph: {
    fontSize: '16px',
    margin: '12px 0',
  },
  paragraphSmall: {
    fontSize: '13px',
    color: '#6b7280',
  },
  list: {
    marginLeft: '18px',
    marginBottom: '18px',
  },
  link: {
    color: '#0f172a',
    textDecoration: 'underline',
  },
  programsSection: {
    marginTop: '32px',
    marginBottom: '24px',
  },
  programsTable: {
    width: '100%',
    borderCollapse: 'separate' as const,
    borderSpacing: '16px',
  },
  programCell: {
    width: '50%',
    verticalAlign: 'top',
  },
  programCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  programImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  programContent: {
    padding: '20px',
    textAlign: 'center' as const,
  },
  programTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px 0',
  },
  programDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
    height: '100%'
  },
  programPrice: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 20px 0',
  },
  programButton: {
    display: 'inline-block',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '12px 40px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '16px',
  },
}
