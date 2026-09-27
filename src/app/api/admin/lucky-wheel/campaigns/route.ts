import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

// FDR-0014 §10/§12: campaign config. Multi-event via event_ids (Q-1) --
// same junction-table pattern as promotional_code_events.
const campaignSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  enabled: z.boolean().optional(),
  paused: z.boolean().optional(),
  starts_at: z.string().min(1, 'La date de début est requise'),
  ends_at: z.string().min(1, 'La date de fin est requise'),
  trigger_rules: z.record(z.string(), z.unknown()).optional(),
  commercial_phase: z.enum(['LAUNCH', 'STANDARD', 'HIGH_DEMAND']).optional(),
  reward_expiration_hours: z.number().int().positive().optional(),
  max_discount_budget: z.number().nonnegative().nullable().optional(),
  event_ids: z.array(z.string().uuid()).min(1, 'Au moins un événement est requis'),
})

function sanitizePayload(body: z.infer<typeof campaignSchema>) {
  return {
    name: body.name,
    enabled: body.enabled ?? false,
    paused: body.paused ?? false,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    trigger_rules: body.trigger_rules ?? {},
    commercial_phase: body.commercial_phase ?? 'STANDARD',
    reward_expiration_hours: body.reward_expiration_hours ?? 48,
    max_discount_budget: body.max_discount_budget ?? null,
  }
}

async function fetchCampaign(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('lucky_wheel_campaigns')
    .select(
      `*,
      events:lucky_wheel_campaign_events(event_id),
      rewards:lucky_wheel_rewards(id, name, type, enabled, stock, max_wins, wins_count)`,
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const admin = supabaseAdmin()
    const { data: campaigns, error } = await admin
      .from('lucky_wheel_campaigns')
      .select(
        `*,
        events:lucky_wheel_campaign_events(event_id),
        rewards:lucky_wheel_rewards(id)`,
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Erreur GET lucky wheel campaigns:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const parsed = campaignSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }
    const payload = parsed.data

    if (new Date(payload.starts_at) >= new Date(payload.ends_at)) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { data: campaign, error: insertError } = await admin
      .from('lucky_wheel_campaigns')
      .insert(sanitizePayload(payload))
      .select()
      .single()

    if (insertError) throw insertError

    const { error: linkError } = await admin.from('lucky_wheel_campaign_events').insert(
      payload.event_ids.map((eventId) => ({ campaign_id: campaign.id, event_id: eventId })),
    )
    if (linkError) throw linkError

    const data = await fetchCampaign(campaign.id)

    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST lucky wheel campaign:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création campagne Lucky Wheel',
})
