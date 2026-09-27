import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rateLimit'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  spinLuckyWheel,
  WheelEntryNotFoundError,
  AlreadySpunError,
  CampaignUnavailableError,
  type SpinResult,
} from '@/lib/luckyWheel/spin'
import { sendLuckyWheelRewardEmail } from '@/lib/email'

// FDR-0014 §11: fire-and-forget, never blocks the spin response (§18: a
// failure here must never affect the core conversion loop). No result.error
// check on the Resend response -- matches the existing convention for every
// other transactional sender in src/lib/email.ts (a known gap, tracked at
// repo level in FDR-0009 §4.2, not something this route should diverge on
// alone).
const sendRewardEmailInBackground = async (admin: ReturnType<typeof supabaseAdmin>, wheelEntryId: string, result: SpinResult) => {
  if (result.success === false) return

  const { data: entry, error } = await admin
    .from('lucky_wheel_entries')
    .select('email, event_id')
    .eq('id', wheelEntryId)
    .maybeSingle()

  if (error || !entry) {
    console.error('[lucky-wheel spin] could not load entry for reward email', error)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const expiresAtLabel = new Date(result.expiresAt).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  await sendLuckyWheelRewardEmail({
    to: entry.email,
    rewardName: result.rewardName,
    promoCode: result.promoCode,
    expiresAtLabel,
    registerUrl: `${baseUrl}/events/${entry.event_id}/register`,
  })
}

const spinSchema = z.object({
  wheel_entry_id: z.string().uuid('wheel_entry_id invalide'),
})

// FDR-0014 §3: the result is always determined by the lucky_wheel_spin RPC
// (row-locked draw + inventory decrement + allocation creation in one
// transaction). This route never computes or previews the outcome.
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = rateLimit(`lucky-wheel-spin:${ip}`, 10, 60_000)
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    const parsed = spinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const result = await spinLuckyWheel({ admin, wheelEntryId: parsed.data.wheel_entry_id })

    sendRewardEmailInBackground(admin, parsed.data.wheel_entry_id, result).catch((emailError) => {
      console.error('[lucky-wheel spin] reward email failed', emailError)
    })

    if (result.success === false) {
      return NextResponse.json({ success: false, error: result.error }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      allocation_id: result.allocationId,
      reward_id: result.rewardId,
      reward_name: result.rewardName,
      reward_type: result.rewardType,
      promo_code: result.promoCode,
      won_at: result.wonAt,
      expires_at: result.expiresAt,
    })
  } catch (error) {
    if (error instanceof WheelEntryNotFoundError) {
      return NextResponse.json({ error: 'WHEEL_ENTRY_NOT_FOUND' }, { status: 404 })
    }
    if (error instanceof AlreadySpunError) {
      return NextResponse.json({ error: 'ALREADY_SPUN' }, { status: 409 })
    }
    if (error instanceof CampaignUnavailableError) {
      return NextResponse.json({ error: 'CAMPAIGN_UNAVAILABLE' }, { status: 409 })
    }

    console.error('[lucky-wheel spin] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
