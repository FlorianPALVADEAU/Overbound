/**
 * Browser side of the re-consent mail: calls POST/GET /api/admin/emails/reconsent.
 * The send always runs a dry run first, because the route refuses a send without a fresh token.
 */

const ENDPOINT = '/api/admin/emails/reconsent'

export interface ReconsentPreview {
  /** People who would receive the mail: still on an unproven subscription. */
  total: number
  /** People who already confirmed at least one list. */
  confirmed: number
  subject: string
}

export interface ReconsentSendReport {
  total: number
  sent: number
  failed: number
  remaining: number
  alreadyDone: number
  suppressed: number
  aborted: string | null
}

export type ReconsentResult<T> = { ok: true; data: T } | { ok: false; error: string }

/** A run is complete when nobody is left to mail and nothing failed. */
export function isReportComplete(report: ReconsentSendReport): boolean {
  return report.failed === 0 && report.remaining === 0 && !report.aborted
}

async function call(init: RequestInit): Promise<{ status: number; json: Record<string, unknown> }> {
  const response = await fetch(ENDPOINT, init)
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>
  return { status: response.status, json }
}

const post = (body: Record<string, unknown>) =>
  call({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

const errorOf = (json: Record<string, unknown>, fallback: string) =>
  typeof json.error === 'string' ? json.error : fallback

const toNumber = (value: unknown) => (typeof value === 'number' ? value : 0)

export async function fetchReconsentPreview(): Promise<ReconsentResult<ReconsentPreview>> {
  try {
    const { status, json } = await call({ method: 'GET' })
    if (status !== 200) return { ok: false, error: errorOf(json, 'Impossible de compter les destinataires.') }
    return {
      ok: true,
      data: {
        total: toNumber(json.total),
        confirmed: toNumber(json.confirmed),
        subject: typeof json.subject === 'string' ? json.subject : '',
      },
    }
  } catch {
    return { ok: false, error: 'Connexion impossible.' }
  }
}

/** One test copy, sent to the logged-in admin. */
export async function sendReconsentTest(): Promise<ReconsentResult<{ message: string }>> {
  try {
    const { status, json } = await post({ mode: 'self' })
    if (status !== 200) return { ok: false, error: errorOf(json, "Échec de l'envoi du test.") }
    return { ok: true, data: { message: typeof json.message === 'string' ? json.message : 'Test envoyé.' } }
  } catch {
    return { ok: false, error: 'Connexion impossible.' }
  }
}

/**
 * Sends the campaign. Rerunning resumes it: addresses already mailed are skipped by the server,
 * and the dry run is repeated each time so the token matches an audience that shrinks as people answer.
 */
export async function sendReconsentCampaign(): Promise<ReconsentResult<ReconsentSendReport>> {
  try {
    const dryRun = await post({ mode: 'dry_run' })
    if (dryRun.status !== 200 || typeof dryRun.json.dryRunToken !== 'string') {
      return { ok: false, error: errorOf(dryRun.json, 'Validation avant envoi impossible.') }
    }
    if (toNumber(dryRun.json.total) === 0) {
      return { ok: false, error: 'Aucun destinataire à contacter.' }
    }

    const { json } = await post({ mode: 'all', dryRunToken: dryRun.json.dryRunToken })
    if (typeof json.error === 'string') return { ok: false, error: json.error }

    return {
      ok: true,
      data: {
        total: toNumber(json.total),
        sent: toNumber(json.sent),
        failed: toNumber(json.failed),
        remaining: toNumber(json.remaining),
        alreadyDone: toNumber(json.alreadyDone),
        suppressed: toNumber(json.suppressed),
        aborted: typeof json.aborted === 'string' ? json.aborted : null,
      },
    }
  } catch {
    return { ok: false, error: 'Connexion impossible.' }
  }
}
