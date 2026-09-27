import { findCampaignConflicts, type CampaignConflict } from './campaignConflicts'

type AdminClient = any

/**
 * DB-backed wrapper around findCampaignConflicts (FDR-0015 §7.3 layers
 * 2/3). Only meaningful to call when the campaign being written is
 * activated (enabled=true, paused=false) -- a disabled or paused campaign
 * can never actually open on the front end, so it can't conflict with
 * anything yet.
 */
export const checkCampaignActivationConflicts = async ({
  admin,
  candidateId,
  eventIds,
  startsAt,
  endsAt,
}: {
  admin: AdminClient
  candidateId: string
  eventIds: string[]
  startsAt: string
  endsAt: string
}): Promise<CampaignConflict[]> => {
  const { data: otherCampaigns, error: campaignsError } = await admin
    .from('lucky_wheel_campaigns')
    .select('id, name, starts_at, ends_at, lucky_wheel_campaign_events(event_id)')
    .eq('enabled', true)
    .eq('paused', false)
    .neq('id', candidateId)

  if (campaignsError) throw campaignsError

  const { data: popupPromotions, error: promotionsError } = await admin
    .from('site_promotions')
    .select('id, title, starts_at, ends_at')
    .eq('is_active', true)
    .eq('type', 'popup')

  if (promotionsError) throw promotionsError

  return findCampaignConflicts({
    candidate: { id: candidateId, event_ids: eventIds, starts_at: startsAt, ends_at: endsAt },
    otherActiveCampaigns: (otherCampaigns ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      event_ids: (c.lucky_wheel_campaign_events ?? []).map((e: any) => e.event_id),
    })),
    activePopupPromotions: (popupPromotions ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      starts_at: p.starts_at,
      ends_at: p.ends_at,
    })),
  })
}
