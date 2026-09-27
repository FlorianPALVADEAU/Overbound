import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rateLimit'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getActiveCampaignForEvent } from '@/lib/luckyWheel/campaign'
import { isDevUnlimitedSpinEmail, resetLuckyWheelEntryForDevTesting } from '@/lib/luckyWheel/testResetPolicy'

// FDR-0014 §3.2/§6: email capture before spin. Consent to unrelated
// marketing is a separate explicit field, never implied by participation
// (spec §3.2).
const entrySchema = z.object({
  event_id: z.string().uuid('event_id invalide'),
  email: z.string().trim().min(1, "L'adresse email est requise").email('Email invalide'),
  marketing_consent: z.boolean().optional().default(false),
  session_id: z.string().trim().max(200).optional(),
  website: z.string().optional(), // honeypot
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = rateLimit(`lucky-wheel-entry:${ip}`, 10, 60_000)
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    const parsed = entrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })
    }

    const { event_id: eventId, session_id: sessionId } = parsed.data
    const email = parsed.data.email.toLowerCase().trim()
    const marketingConsent = parsed.data.marketing_consent

    if (parsed.data.website?.trim()) {
      // Honeypot: pretend success, write nothing.
      return NextResponse.json({ success: true, wheel_entry_id: null, already_participated: true })
    }

    const admin = supabaseAdmin()

    const campaign = await getActiveCampaignForEvent({ admin, eventId })
    if (!campaign) {
      return NextResponse.json({ error: 'CAMPAIGN_UNAVAILABLE' }, { status: 404 })
    }

    // Dev-only exception (src/lib/luckyWheel/testResetPolicy.ts): clears any
    // prior entry/allocation for this one named email so the unique
    // participation rule below never fires for it. Everyone else, and this
    // same email outside NODE_ENV=development, is unaffected.
    if (isDevUnlimitedSpinEmail(email)) {
      await resetLuckyWheelEntryForDevTesting({ admin, campaignId: campaign.id, email })
    }

    // One participation per email per campaign, across all events it spans
    // (FDR-0014 §6, enforced by the lucky_wheel_entries unique constraint
    // too -- this pre-check just returns a clean 409 instead of a raw
    // constraint violation).
    const { data: existingEntry, error: existingError } = await admin
      .from('lucky_wheel_entries')
      .select('id, spun_at')
      .eq('campaign_id', campaign.id)
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('[lucky-wheel entry] lookup error', existingError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (existingEntry) {
      return NextResponse.json(
        {
          success: true,
          wheel_entry_id: existingEntry.id,
          already_participated: existingEntry.spun_at !== null,
        },
        { status: 200 },
      )
    }

    const { data: created, error: insertError } = await admin
      .from('lucky_wheel_entries')
      .insert({
        campaign_id: campaign.id,
        event_id: eventId,
        email,
        session_id: sessionId ?? null,
        marketing_consent: marketingConsent,
      })
      .select('id')
      .single()

    if (insertError) {
      // Race: two concurrent entry requests for the same (campaign, email).
      // The unique constraint is the real guarantee; treat 23505 as a
      // clean "already participated" rather than a 500.
      if (insertError.code === '23505') {
        const { data: raceEntry } = await admin
          .from('lucky_wheel_entries')
          .select('id, spun_at')
          .eq('campaign_id', campaign.id)
          .eq('email', email)
          .maybeSingle()
        return NextResponse.json({
          success: true,
          wheel_entry_id: raceEntry?.id ?? null,
          already_participated: raceEntry?.spun_at !== null,
        })
      }
      console.error('[lucky-wheel entry] insert error', insertError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, wheel_entry_id: created.id, already_participated: false },
      { status: 201 },
    )
  } catch (error) {
    console.error('[lucky-wheel entry] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
