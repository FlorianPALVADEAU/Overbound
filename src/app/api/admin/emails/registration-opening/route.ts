import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createHash } from 'node:crypto'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getEmailAssetsBaseUrl } from '@/lib/email/config'
import EventOpeningEmail from '@/emails/EventOpeningEmail'
import { renderEmail } from '@/lib/email/render'
import {
  buildUnifiedCampaignAudience,
  dispatchCampaign,
  type CampaignAudienceRecipient,
} from '@/lib/email/adminCampaigns'

export const runtime = 'nodejs'

const CAMPAIGN_EVENT_TITLE = 'Ultra Arena 2026'
const CAMPAIGN_EVENT_DATE = 'Samedi 12 septembre 2026'
const CAMPAIGN_EVENT_LOCATION = 'Base de loisirs de Saint-Quentin-en-Yvelines'
const SITE_URL = getEmailAssetsBaseUrl()
const CAMPAIGN_EVENT_URL = `${SITE_URL}/events/ultra-arena-2026`
const CAMPAIGN_HERO_IMAGE_URL =
  `${SITE_URL}/images/images/a-wave-of-runners-carrying-wooden-logs-on-their-shoulders-while-running.jpg`
const CAMPAIGN_OFFER_TITLE = '-25% sur les 35 premiers inscrits'
const CAMPAIGN_OFFER_DESCRIPTION =
  'Aucun code requis : la réduction s’applique automatiquement au checkout.'
const CAMPAIGN_FROM = "Florian d'Overbound <no-reply@overbound-race.com>"
const BULK_BATCH_SIZE = 20

const sendSchema = z.object({
  mode: z.enum(['dry_run', 'self', 'all']),
  dryRunToken: z.string().optional(),
})

const ensureAdmin = async () => {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: profile.full_name ?? user.user_metadata?.full_name ?? null,
    },
  }
}

const buildOpeningEmailHtml = async (recipient: CampaignAudienceRecipient) =>
  renderEmail(
    EventOpeningEmail({
      fullName: recipient.fullName,
      eventTitle: CAMPAIGN_EVENT_TITLE,
      eventDate: CAMPAIGN_EVENT_DATE,
      eventLocation: CAMPAIGN_EVENT_LOCATION,
      eventUrl: CAMPAIGN_EVENT_URL,
      heroImageUrl: CAMPAIGN_HERO_IMAGE_URL,
      offerTitle: CAMPAIGN_OFFER_TITLE,
      offerDescription: CAMPAIGN_OFFER_DESCRIPTION,
    }),
  )

const buildAudienceToken = (recipients: CampaignAudienceRecipient[]) => {
  const hash = createHash('sha256')
  for (const recipient of recipients) {
    hash.update(recipient.email)
    hash.update('|')
  }
  return hash.digest('hex')
}

export async function GET() {
  try {
    const adminCheck = await ensureAdmin()
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

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await ensureAdmin()
    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const body = await request.json().catch(() => ({}))
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Mode invalide.' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY manquante.' }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const subject = `Inscriptions ouvertes — ${CAMPAIGN_EVENT_TITLE}`

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

      const report = await dispatchCampaign({
        resend,
        recipients: [selfRecipient],
        buildMessage: async (recipient) => ({
          from: CAMPAIGN_FROM,
          to: recipient.email,
          subject,
          html: await buildOpeningEmailHtml(recipient),
        }),
        batchSize: 1,
        retries: 1,
      })

      if (report.sent !== 1) {
        return NextResponse.json(
          {
            error: `Échec envoi test: ${report.failures[0]?.error || 'Erreur inconnue.'}`,
            report,
          },
          { status: 502 },
        )
      }

      return NextResponse.json({
        success: true,
        mode,
        sent: report.sent,
        failed: report.failed,
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

    const report = await dispatchCampaign({
      resend,
      recipients,
      buildMessage: async (recipient) => ({
        from: CAMPAIGN_FROM,
        to: recipient.email,
        subject,
        html: await buildOpeningEmailHtml(recipient),
      }),
      batchSize: BULK_BATCH_SIZE,
      retries: 2,
    })

    if (report.sent === 0) {
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

    return NextResponse.json({
      success: report.failed === 0,
      mode: 'all',
      audienceStats: stats,
      total: report.total,
      sent: report.sent,
      failed: report.failed,
      failures: report.failures.slice(0, 20),
      message:
        report.failed > 0
          ? `Envoi partiel: ${report.sent} envoyés, ${report.failed} échec(s).`
          : `Envoi terminé. ${report.sent} email(s) envoyés.`,
    })
  } catch (error) {
    console.error('[admin registration opening] send error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
