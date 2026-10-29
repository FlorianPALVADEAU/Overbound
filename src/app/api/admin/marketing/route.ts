import type { CampaignReport } from '@/lib/email/campaign'
import { NextResponse, type NextRequest } from 'next/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  dispatchNewEventAnnouncement,
  dispatchPriceChangeReminder,
  dispatchPromoCampaign,
  getMarketingOptInRecipients,
  MarketingRecipient,
} from '@/lib/email/marketing'

type CampaignType = 'new_event' | 'price_change' | 'promo'

const handlePost = async (request: NextRequest) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email provider non configuré.' }, { status: 503 })
    }

    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const { type, payload, recipients, use_marketing_opt_in } = body as {
      type: CampaignType
      payload: Record<string, unknown>
      recipients?: MarketingRecipient[]
      use_marketing_opt_in?: boolean
    }

    if (!type || (type !== 'promo' && !payload)) {
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
    }

    let finalRecipients: MarketingRecipient[] = Array.isArray(recipients) ? recipients : []

    if (use_marketing_opt_in) {
      const optIn = await getMarketingOptInRecipients()
      if (optIn.length === 0 && finalRecipients.length === 0) {
        return NextResponse.json({ error: 'Aucun destinataire marketing.' }, { status: 400 })
      }
      finalRecipients = [...finalRecipients, ...optIn]
    }

    const normalizedRecipients = deduplicateRecipients(
      finalRecipients.map((recipient) => ({
        email: recipient.email,
        fullName: (recipient as any).fullName ?? (recipient as any).full_name ?? null,
        userId: recipient.userId ?? (recipient as any).user_id ?? null,
      })),
    )

    let report: CampaignReport | null = null

    switch (type) {
      case 'new_event':
        report = await dispatchNewEventAnnouncement({
          recipients: normalizedRecipients,
          eventTitle: String(payload.eventTitle ?? 'Nouvel événement'),
          eventDate: String(payload.eventDate ?? ''),
          eventLocation: String(payload.eventLocation ?? ''),
          eventUrl: String(payload.eventUrl ?? '#'),
          highlight: payload.highlight ? String(payload.highlight) : undefined,
        })
        break
      case 'price_change':
        report = await dispatchPriceChangeReminder({
          recipients: normalizedRecipients,
          eventTitle: String(payload.eventTitle ?? 'Événement'),
          eventDate: String(payload.eventDate ?? ''),
          deadlineLabel: String(payload.deadlineLabel ?? 'très bientôt'),
          eventUrl: String(payload.eventUrl ?? '#'),
          currentPriceLabel: String(payload.currentPriceLabel ?? ''),
          nextPriceLabel: payload.nextPriceLabel ? String(payload.nextPriceLabel) : undefined,
        })
        break
      case 'promo':
        report = await dispatchPromoCampaign({
          recipients: normalizedRecipients,
          title: String(payload.title ?? 'Offre OverBound'),
          message: String(payload.message ?? ''),
          ctaLabel: String(payload.ctaLabel ?? 'Découvrir'),
          ctaUrl: String(payload.ctaUrl ?? '#'),
          promoCode: payload.promoCode ? String(payload.promoCode) : undefined,
          promoDetails: payload.promoDetails ? String(payload.promoDetails) : undefined,
        })
        break
      default:
        return NextResponse.json({ error: 'Type de campagne inconnu.' }, { status: 400 })
    }

    if (!report) {
      return NextResponse.json({ error: 'Transport marketing non configuré.' }, { status: 500 })
    }

    return NextResponse.json({
      success: report.failed === 0 && report.remaining === 0 && !report.aborted,
      recipients: normalizedRecipients.length,
      sent: report.sent,
      failed: report.failed,
      remaining: report.remaining,
      alreadyDone: report.alreadyDone,
      suppressed: report.suppressed,
      aborted: report.aborted,
    })
  } catch (error) {
    console.error('[marketing] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const deduplicateRecipients = (recipients: MarketingRecipient[]): MarketingRecipient[] => {
  const seen = new Set<string>()
  const result: MarketingRecipient[] = []

  for (const recipient of recipients) {
    const emailLower = recipient.email?.toLowerCase()
    if (!emailLower || seen.has(emailLower)) {
      continue
    }
    seen.add(emailLower)
    result.push({ ...recipient })
  }

  return result
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Campagne marketing email',
})
