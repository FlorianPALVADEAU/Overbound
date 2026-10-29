import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import EventOpeningEmail from '@/emails/EventOpeningEmail'
import { renderEmail } from '@/lib/email/render'
import {
  buildUnifiedCampaignAudience,
  type CampaignAudienceRecipient,
} from '@/lib/email/adminCampaigns'
import { runCampaign } from '@/lib/email/campaign'
import {
  deliverMarketingMail,
  getMarketingTransportName,
  isMarketingTransportConfigured,
} from '@/lib/email/transport'
import { generateMarketingUnsubscribeUrl } from '@/lib/email/unsubscribe'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export const runtime = 'nodejs'
// Paced sending stops on its time budget; running the campaign again resumes it.
export const maxDuration = 60

const CAMPAIGN_EVENT_TITLE = 'Ultra Arena 2026'
const CAMPAIGN_EVENT_DATE = 'Samedi 12 septembre 2026'
const CAMPAIGN_EVENT_LOCATION = 'Base de loisirs de Saint-Quentin-en-Yvelines'
const SITE_URL = getEmailAssetsBaseUrl()
const CAMPAIGN_EVENT_URL = `${SITE_URL}/events/ultra-arena-2026`
const CAMPAIGN_HERO_IMAGE_URL =
  `${SITE_URL}/images/og/crowd.jpg`
const CAMPAIGN_OFFER_TITLE = '-25% sur les 35 premiers inscrits'
const CAMPAIGN_OFFER_DESCRIPTION =
  'Aucun code requis : la réduction s’applique automatiquement au checkout.'
const CAMPAIGN_KEY = 'registration-opening:ultra-arena-2026'
const BULK_BATCH_SIZE = 20
const SEND_SUBJECT = `Inscriptions ouvertes — ${CAMPAIGN_EVENT_TITLE}`

const sendSchema = z.object({
  mode: z.enum(['dry_run', 'self', 'all']),
  dryRunToken: z.string().optional(),
})

const ensureAdmin = async (request?: NextRequest) => {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return { error: auth.response }
  }

  const { user } = auth
  if (!user.email) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const supabase = await createSupabaseServer()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    },
  }
}

const buildOpeningMessage = async (recipient: CampaignAudienceRecipient) => {
  const unsubscribeUrl = generateMarketingUnsubscribeUrl({
    email: recipient.email,
    userId: recipient.userId,
  })
  const html = await renderEmail(
    EventOpeningEmail({
      fullName: recipient.fullName,
      eventTitle: CAMPAIGN_EVENT_TITLE,
      eventDate: CAMPAIGN_EVENT_DATE,
      eventLocation: CAMPAIGN_EVENT_LOCATION,
      eventUrl: CAMPAIGN_EVENT_URL,
      heroImageUrl: CAMPAIGN_HERO_IMAGE_URL,
      offerTitle: CAMPAIGN_OFFER_TITLE,
      offerDescription: CAMPAIGN_OFFER_DESCRIPTION,
      unsubscribeUrl,
    }),
  )
  return { to: recipient.email, subject: SEND_SUBJECT, html, unsubscribeUrl }
}

const buildAudienceToken = (recipients: CampaignAudienceRecipient[]) => {
  const hash = createHash('sha256')
  for (const recipient of recipients) {
    hash.update(recipient.email)
    hash.update('|')
  }
  return hash.digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin(request)
    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const { recipients, stats } = await buildUnifiedCampaignAudience()

    return NextResponse.json({
      success: true,
      total: recipients.length,
      recipients,
      audienceStats: stats,
      campaign: {
        title: CAMPAIGN_EVENT_TITLE,
        date: CAMPAIGN_EVENT_DATE,
        location: CAMPAIGN_EVENT_LOCATION,
        url: CAMPAIGN_EVENT_URL,
      },
    })
  } catch (error) {
    console.error('[admin registration opening] preview error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin(request)
    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const body = await request.json().catch(() => ({}))
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Mode invalide.' }, { status: 400 })
    }

    if (!isMarketingTransportConfigured()) {
      return NextResponse.json(
        { error: `Transport marketing "${getMarketingTransportName()}" non configuré.` },
        { status: 500 },
      )
    }

    const mode = parsed.data.mode

    if (mode === 'dry_run') {
      const { recipients, stats } = await buildUnifiedCampaignAudience()
      const estimatedBatches = Math.ceil(recipients.length / BULK_BATCH_SIZE)
      return NextResponse.json({
        success: true,
        mode,
        total: recipients.length,
        batchSize: BULK_BATCH_SIZE,
        estimatedBatches,
        audienceStats: stats,
        dryRunToken: buildAudienceToken(recipients),
        sample: recipients.slice(0, 10).map((recipient) => ({
          email: recipient.email,
          sources: recipient.sources,
        })),
        message: `Validation OK: ${recipients.length} destinataire(s), ${estimatedBatches} batch(es).`,
      })
    }

    if (mode === 'self') {
      const selfRecipient: CampaignAudienceRecipient = {
        email: adminCheck.user.email,
        userId: adminCheck.user.id,
        fullName: adminCheck.user.fullName,
        sources: ['auth'],
      }

      const result = await deliverMarketingMail(await buildOpeningMessage(selfRecipient))
      if (!result.ok) {
        return NextResponse.json(
          { error: `Échec envoi test: ${result.error.code} ${result.error.message}` },
          { status: 502 },
        )
      }

      return NextResponse.json({
        success: true,
        mode,
        sent: 1,
        failed: 0,
        message: `Email de test envoyé à ${adminCheck.user.email}.`,
      })
    }

    const { recipients, stats } = await buildUnifiedCampaignAudience()
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'Aucun destinataire trouvé.' }, { status: 400 })
    }
    const currentAudienceToken = buildAudienceToken(recipients)
    if (!parsed.data.dryRunToken || parsed.data.dryRunToken !== currentAudienceToken) {
      return NextResponse.json(
        {
          error:
            "Validation dry-run requise ou expirée. Lance d'abord 'Valider la campagne (sans envoi)'.",
          total: recipients.length,
        },
        { status: 409 },
      )
    }

    const report = await runCampaign({
      campaignKey: CAMPAIGN_KEY,
      provider: getMarketingTransportName(),
      recipients,
      send: async (recipient) => deliverMarketingMail(await buildOpeningMessage(recipient)),
    })

    if (report.sent === 0 && report.alreadyDone === 0) {
      return NextResponse.json(
        {
          error: "Aucun email n'a pu être envoyé.",
          mode: 'all',
          audienceStats: stats,
          report,
        },
        { status: 502 },
      )
    }

    const complete = report.failed === 0 && report.remaining === 0 && !report.aborted
    return NextResponse.json({
      success: complete,
      mode: 'all',
      audienceStats: stats,
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
    console.error('[admin registration opening] send error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Envoi campagne ouverture inscriptions admin',
})
