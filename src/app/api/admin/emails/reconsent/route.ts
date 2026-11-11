import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import ReconsentEmail from '@/emails/ReconsentEmail'
import { renderEmail } from '@/lib/email/render'
import { resolveReconsentAudience } from '@/lib/email/audience'
import { runCampaign } from '@/lib/email/campaign'
import { countConfirmedPeople } from '@/lib/email/reconsentStore'
import {
  deliverMarketingMail,
  getMarketingTransportName,
  isMarketingTransportConfigured,
} from '@/lib/email/transport'
import { generateMarketingUnsubscribeUrl, generateReconsentUrl } from '@/lib/email/unsubscribe'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import type { MarketingRecipient } from '@/lib/email/marketing'

export const runtime = 'nodejs'
// Paced sending stops on its time budget; running the campaign again resumes it.
export const maxDuration = 60

const CAMPAIGN_KEY = 'reconsent:2026-11'
const BULK_BATCH_SIZE = 20
const SEND_SUBJECT = "Choisis les emails que tu veux recevoir d'Overbound"

const sendSchema = z.object({
  mode: z.enum(['dry_run', 'self', 'all']),
  dryRunToken: z.string().optional(),
})

const buildMessage = async (recipient: MarketingRecipient) => {
  const unsubscribeUrl = generateMarketingUnsubscribeUrl({ email: recipient.email, userId: recipient.userId })
  const confirmUrl = generateReconsentUrl({ email: recipient.email, userId: recipient.userId })
  const html = await renderEmail(
    ReconsentEmail({ firstName: recipient.firstName, confirmUrl, unsubscribeUrl }),
  )
  return { to: recipient.email, subject: SEND_SUBJECT, html, unsubscribeUrl }
}

const buildAudienceToken = (recipients: MarketingRecipient[]) => {
  const hash = createHash('sha256')
  for (const recipient of recipients) {
    hash.update(recipient.email)
    hash.update('|')
  }
  return hash.digest('hex')
}

/** GET: how many addresses the re-consent mail would reach. Sends nothing. */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const [recipients, confirmed] = await Promise.all([resolveReconsentAudience(), countConfirmedPeople()])
    return NextResponse.json({ success: true, total: recipients.length, confirmed, subject: SEND_SUBJECT })
  } catch (error) {
    console.error('[admin reconsent] preview error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response
    const { user } = auth
    if (!user.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const parsed = sendSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Mode invalide.' }, { status: 400 })
    }

    if (!isMarketingTransportConfigured()) {
      return NextResponse.json(
        { error: `Transport marketing "${getMarketingTransportName()}" non configuré.` },
        { status: 500 },
      )
    }

    const { mode } = parsed.data

    if (mode === 'self') {
      const result = await deliverMarketingMail(await buildMessage({ email: user.email, userId: user.id }))
      if (!result.ok) {
        return NextResponse.json(
          { error: `Échec envoi test: ${result.error.code} ${result.error.message}` },
          { status: 502 },
        )
      }
      return NextResponse.json({ success: true, mode, sent: 1, failed: 0, message: `Email de test envoyé à ${user.email}.` })
    }

    const recipients = await resolveReconsentAudience()

    if (mode === 'dry_run') {
      const estimatedBatches = Math.ceil(recipients.length / BULK_BATCH_SIZE)
      return NextResponse.json({
        success: true,
        mode,
        total: recipients.length,
        batchSize: BULK_BATCH_SIZE,
        estimatedBatches,
        dryRunToken: buildAudienceToken(recipients),
        sample: recipients.slice(0, 10).map((recipient) => ({ email: recipient.email })),
        message: `Validation OK: ${recipients.length} destinataire(s), ${estimatedBatches} batch(es).`,
      })
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Aucun destinataire trouvé.' }, { status: 400 })
    }
    if (!parsed.data.dryRunToken || parsed.data.dryRunToken !== buildAudienceToken(recipients)) {
      return NextResponse.json(
        {
          error: "Validation dry-run requise ou expirée. Lance d'abord la validation sans envoi.",
          total: recipients.length,
        },
        { status: 409 },
      )
    }

    const report = await runCampaign({
      campaignKey: CAMPAIGN_KEY,
      provider: getMarketingTransportName(),
      recipients,
      send: async (recipient) => deliverMarketingMail(await buildMessage(recipient)),
    })

    if (report.sent === 0 && report.alreadyDone === 0) {
      return NextResponse.json({ error: "Aucun email n'a pu être envoyé.", mode, report }, { status: 502 })
    }

    const complete = report.failed === 0 && report.remaining === 0 && !report.aborted
    return NextResponse.json({
      success: complete,
      mode,
      total: report.total,
      sent: report.sent,
      failed: report.failed,
      remaining: report.remaining,
      alreadyDone: report.alreadyDone,
      suppressed: report.suppressed,
      aborted: report.aborted,
      failures: report.failures.slice(0, 20),
      message: complete
        ? `Envoi terminé. ${report.sent} email(s) envoyés, ${report.alreadyDone} déjà servis.`
        : `Envoi partiel: ${report.sent} envoyés, ${report.failed} échec(s), ${report.remaining} restants. Relance l'envoi pour continuer.`,
    })
  } catch (error) {
    console.error('[admin reconsent] send error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Envoi campagne re-consentement admin',
})
