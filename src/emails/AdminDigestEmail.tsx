import * as React from 'react'
import { Preview, Section, Text, Link, Img, Button, Hr } from '@react-email/components'
import EmailLayout from './EmailLayout'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'

interface AdminDigestEmailProps {
  periodLabel: string
  totalActions: number
  totalErrors: number
  items: Array<{
    timestamp: string
    summary: string
    statusCode: number | null
    userEmail?: string | null
    actionType?: string | null
    path: string
    durationMs?: number | null
  }>
  logsUrl: string
}

export function AdminDigestEmail({ periodLabel, totalActions, totalErrors, items, logsUrl }: AdminDigestEmailProps) {
  const successRate = totalActions > 0 ? Math.round(((totalActions - totalErrors) / totalActions) * 100) : 100

  return (
    <EmailLayout preview={`Digest administrateur — ${periodLabel}`}>
      {/* Hero Image */}
      <Img
        src={`${getEmailAssetsBaseUrl()}/images/images/a-big-tire-is-falling-upside-down-thanks-to-a-middle-aged-man.avif`}
        alt="Digest administrateur"
        width="400"
        style={styles.heroImage}
      />

      <Section style={styles.section}>
        {/* Analytics Icon */}
        <Section style={styles.iconContainer}>
          <div style={styles.analyticsIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#dbeafe" />
              <path
                d="M16 48V28h8v20h-8zm12 0V16h8v32h-8zm12 0V32h8v16h-8z"
                fill="#2563eb"
              />
            </svg>
          </div>
        </Section>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Digest administrateur
        </Text>

        {/* Period */}
        <Text style={styles.paragraph}>
          Période : <strong>{periodLabel}</strong>
        </Text>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Stats Card */}
        <Section style={styles.statsCard}>
          <Text style={styles.statsTitle}>Résumé de l'activité</Text>
          <table style={styles.statsTable}>
            <tbody>
              <tr>
                <td style={styles.statsLabel}>📊 Total actions</td>
                <td style={styles.statsValue}>{totalActions}</td>
              </tr>
              <tr>
                <td style={styles.statsLabel}>❌ Erreurs</td>
                <td style={{...styles.statsValue, color: totalErrors > 0 ? '#ef4444' : '#16a34a'}}>
                  {totalErrors}
                </td>
              </tr>
              <tr>
                <td style={styles.statsLabel}>✅ Taux de succès</td>
                <td style={{...styles.statsValue, color: successRate >= 95 ? '#16a34a' : successRate >= 80 ? '#f59e0b' : '#ef4444'}}>
                  {successRate}%
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* Activity List */}
        <Text style={styles.sectionTitle}>Activité récente</Text>

        {items.length === 0 ? (
          <Section style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Aucune action enregistrée dans cette période.
            </Text>
          </Section>
        ) : (
          <Section style={styles.activityList}>
            {items.map((item, index) => {
              const isError = item.statusCode && item.statusCode >= 400
              const isSuccess = item.statusCode && item.statusCode >= 200 && item.statusCode < 300

              return (
                <Section
                  key={`${item.timestamp}-${index}`}
                  style={{
                    ...styles.activityItem,
                    ...(index === items.length - 1 ? styles.activityItemLast : {})
                  }}
                >
                  {/* Timestamp */}
                  <Text style={styles.activityTimestamp}>
                    {new Date(item.timestamp).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    })}
                  </Text>

                  {/* Summary with Status Badge */}
                  <Section style={styles.activityHeader}>
                    <Text style={styles.activitySummary}>
                      {isError && '🔴 '}
                      {isSuccess && '🟢 '}
                      {!isError && !isSuccess && '⚪ '}
                      {item.summary}
                    </Text>
                  </Section>

                  {/* Metadata */}
                  <table style={styles.metaTable}>
                    <tbody>
                      {item.statusCode && (
                        <tr>
                          <td style={styles.metaLabel}>Statut</td>
                          <td style={{
                            ...styles.metaValue,
                            color: isError ? '#ef4444' : isSuccess ? '#16a34a' : '#6b7280'
                          }}>
                            {item.statusCode}
                          </td>
                        </tr>
                      )}
                      {item.actionType && (
                        <tr>
                          <td style={styles.metaLabel}>Action</td>
                          <td style={styles.metaValue}>{item.actionType}</td>
                        </tr>
                      )}
                      {item.userEmail && (
                        <tr>
                          <td style={styles.metaLabel}>Utilisateur</td>
                          <td style={styles.metaValue}>{item.userEmail}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={styles.metaLabel}>Route</td>
                        <td style={styles.metaValueCode}>{item.path}</td>
                      </tr>
                      {typeof item.durationMs === 'number' && (
                        <tr>
                          <td style={styles.metaLabel}>Durée</td>
                          <td style={styles.metaValue}>{Math.round(item.durationMs)} ms</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Section>
              )
            })}
          </Section>
        )}

        {/* Separator */}
        <Hr style={styles.separator} />

        {/* CTA Button */}
        <Section style={styles.buttonContainer}>
          <Button href={logsUrl} style={styles.button}>
            Consulter le journal complet
          </Button>
        </Section>

        {/* Footer Message */}
        <Text style={styles.footerText}>
          Ce digest est envoyé automatiquement pour surveiller l'activité administrative de la plateforme.
        </Text>
      </Section>
    </EmailLayout>
  )
}

export default AdminDigestEmail

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
  analyticsIcon: {
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
  statsCard: {
    backgroundColor: '#dbeafe',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  statsTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  statsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  statsLabel: {
    fontSize: '14px',
    color: '#1e40af',
    paddingBottom: '12px',
    verticalAlign: 'top',
    width: '60%',
    fontWeight: 600,
  },
  statsValue: {
    fontSize: '18px',
    color: '#111827',
    fontWeight: 700,
    paddingBottom: '12px',
    verticalAlign: 'top',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
    color: '#111827',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '32px',
    marginBottom: '24px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0',
    textAlign: 'center',
  },
  activityList: {
    marginBottom: '24px',
  },
  activityItem: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  },
  activityItemLast: {
    marginBottom: '0',
  },
  activityTimestamp: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '0 0 8px 0',
    fontFamily: 'monospace',
  },
  activityHeader: {
    marginBottom: '12px',
  },
  activitySummary: {
    fontSize: '15px',
    color: '#111827',
    fontWeight: 600,
    margin: '0',
  },
  metaTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  metaLabel: {
    fontSize: '13px',
    color: '#6b7280',
    paddingBottom: '6px',
    paddingRight: '12px',
    verticalAlign: 'top',
    width: '30%',
  },
  metaValue: {
    fontSize: '13px',
    color: '#111827',
    paddingBottom: '6px',
    verticalAlign: 'top',
  },
  metaValueCode: {
    fontSize: '12px',
    color: '#111827',
    fontFamily: 'monospace',
    paddingBottom: '6px',
    verticalAlign: 'top',
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
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.6',
  },
}
