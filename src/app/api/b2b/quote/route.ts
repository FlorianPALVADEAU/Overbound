import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rateLimit'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/security/turnstile'
import { sendB2bQuoteConfirmationEmail, sendB2bQuoteRequestEmail } from '@/lib/email'
import { captureException } from '@/lib/sentry'
import { loadNextEdition } from '@/lib/seo/loadNextEdition'
import {
  isHoneypotTriggered,
  labelOf,
  PROJECT_TYPES,
  quoteRequestSchema,
  TEAM_SIZES,
  toQuoteRow,
} from '@/lib/b2b/quoteRequest'

export const runtime = 'nodejs'

const B2B_INBOX = process.env.B2B_INBOX ?? process.env.SUPPORT_INBOX ?? 'contact@overbound-race.com'

const summarizeUtm = (utm: Record<string, string> | null) =>
  utm
    ? Object.entries(utm)
        .map(([key, value]) => `${key}=${value}`)
        .join(' · ')
    : null

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`b2b-quote:${getClientIp(request)}`, 3, 10 * 60_000)
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans quelques minutes.' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    const parsed = quoteRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    // A bot gets the same answer as a person and nothing is stored.
    if (isHoneypotTriggered(parsed.data)) {
      return NextResponse.json({ ok: true }, { status: 201 })
    }

    const verdict = await verifyTurnstileToken(parsed.data.turnstileToken, getClientIp(request))
    if (!verdict.ok) {
      return NextResponse.json(
        { error: 'La vérification anti-spam a échoué. Rechargez la page et réessayez.' },
        { status: 403 },
      )
    }

    const row = toQuoteRow(parsed.data)
    const { error: insertError } = await supabaseAdmin().from('b2b_quote_requests').insert(row)
    if (insertError) {
      console.error('[b2b quote] insert failed', insertError)
      captureException(new Error(insertError.message), { route: '/api/b2b/quote', step: 'insert' })
      return NextResponse.json(
        { error: 'Envoi impossible pour le moment. Écrivez-nous à contact@overbound-race.com.' },
        { status: 500 },
      )
    }

    // The request is saved: a mail failure is reported but never turned into an error for the visitor.
    const teamSizeLabel = labelOf(TEAM_SIZES, row.team_size)
    const projectTypeLabel = labelOf(PROJECT_TYPES, row.project_type)
    const edition = await loadNextEdition()
    const emails = await Promise.allSettled([
      sendB2bQuoteRequestEmail({
        to: B2B_INBOX,
        replyTo: row.email,
        companyName: row.company_name,
        fullName: row.full_name,
        phone: row.phone,
        teamSizeLabel,
        projectTypeLabel,
        message: row.message,
        utmSummary: summarizeUtm(row.utm),
        submittedAt: new Date().toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Europe/Paris',
        }),
      }),
      sendB2bQuoteConfirmationEmail({
        to: row.email,
        contactName: row.full_name,
        companyName: row.company_name,
        teamSizeLabel,
        projectTypeLabel,
        editionWindow: edition.window,
        editionStatus: edition.detailsStatus,
      }),
    ])
    emails.forEach((result, index) => {
      if (result.status === 'rejected') {
        const step = index === 0 ? 'notify_team' : 'confirm_requester'
        console.error(`[b2b quote] ${step} failed`, result.reason)
        captureException(result.reason as Error, { route: '/api/b2b/quote', step })
      }
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('[b2b quote] unexpected error', error)
    captureException(error as Error, { route: '/api/b2b/quote', method: 'POST' })
    return NextResponse.json({ error: 'Une erreur est survenue. Réessayez plus tard.' }, { status: 500 })
  }
}
