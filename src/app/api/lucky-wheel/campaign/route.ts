import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getActiveCampaignForEvent, getDisplayableRewardsForCampaign } from '@/lib/luckyWheel/campaign'

const querySchema = z.object({
  event_id: z.string().uuid('event_id invalide'),
})

// FDR-0014 §12.1/§18: public, read-only, cacheable-by-the-widget lookup.
// Never exposes estimated_cost or other admin-only fields (only what the
// widget needs to decide whether/when to trigger). A failure here must
// never block the page or the purchase tunnel -- callers should fail
// silently (widget just doesn't render).
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const parsed = querySchema.safeParse({ event_id: url.searchParams.get('event_id') })
    if (!parsed.success) {
      return NextResponse.json({ error: 'event_id invalide' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const campaign = await getActiveCampaignForEvent({ admin, eventId: parsed.data.event_id })

    if (!campaign) {
      return NextResponse.json({ campaign: null }, { status: 200 })
    }

    const rewards = await getDisplayableRewardsForCampaign({
      admin,
      campaignId: campaign.id,
      commercialPhase: campaign.commercialPhase,
    })

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        trigger_rules: campaign.triggerRules,
        rewards,
      },
    })
  } catch (error) {
    console.error('[lucky-wheel campaign] unexpected error', error)
    // Fail soft: the widget treats any error response as "no campaign" and
    // simply does not render (FDR-0014 §12.3/§18).
    return NextResponse.json({ campaign: null }, { status: 200 })
  }
}
