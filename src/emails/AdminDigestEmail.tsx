import * as React from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'

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

export function AdminDigestEmail({
  periodLabel,
  totalActions,
  totalErrors,
  items,
  logsUrl,
}: AdminDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Digest administrateur — {periodLabel}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.section}>
            <Text style={styles.heading}>Digest administrateur</Text>
            <Text style={styles.paragraph}>
              Période&nbsp;: <strong>{periodLabel}</strong>
            </Text>
            <Text style={styles.paragraph}>
              Total actions&nbsp;: <strong>{totalActions}</strong><br />
              Actions en erreur&nbsp;: <strong>{totalErrors}</strong>
            </Text>
            <Text style={styles.paragraph}>
              <Link href={logsUrl} style={styles.link}>
                Consulter le journal complet
              </Link>
            </Text>
            <div style={styles.list}>
              {items.length === 0 ? (
                <Text style={styles.paragraph}>Aucune action enregistrée dans cette période.</Text>
              ) : (
                items.map((item, index) => (
                  <div key={`${item.timestamp}-${index}`} style={styles.item}>
                    <Text style={styles.itemHeader}>
                      {new Date(item.timestamp).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </Text>
                    <Text style={styles.itemSummary}>{item.summary}</Text>
                    <Text style={styles.itemMeta}>
                      <span>Statut&nbsp;: {item.statusCode ?? '—'}</span>
                      {item.userEmail ? <span>Utilisateur&nbsp;: {item.userEmail}</span> : null}
                      {item.actionType ? <span>Action&nbsp;: {item.actionType}</span> : null}
                      <span>Route&nbsp;: {item.path}</span>
                      {typeof item.durationMs === 'number' ? (
                        <span>Durée&nbsp;: {Math.round(item.durationMs)} ms</span>
                      ) : null}
                    </Text>
                  </div>
                ))
              )}
            </div>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AdminDigestEmail

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#111827',
    fontFamily: 'Arial, sans-serif',
    color: '#f9fafb',
    padding: '24px 0',
  },
  container: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '640px',
    border: '1px solid #374151',
  },
  section: {
    lineHeight: '1.6',
  },
  heading: {
    fontSize: '26px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#f9fafb',
  },
  paragraph: {
    fontSize: '16px',
    marginBottom: '14px',
    color: '#e5e7eb',
  },
  link: {
    display: 'inline-block',
    backgroundColor: '#f97316',
    color: '#111827',
    padding: '12px 20px',
    borderRadius: '9999px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  list: {
    marginTop: '24px',
    borderTop: '1px solid #374151',
  },
  item: {
    padding: '16px 0',
    borderBottom: '1px solid #374151',
  },
  itemHeader: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '6px',
  },
  itemSummary: {
    fontSize: '16px',
    color: '#f9fafb',
    marginBottom: '6px',
  },
  itemMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '13px',
    color: '#cbd5f5',
  },
}
