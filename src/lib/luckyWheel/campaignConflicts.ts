// FDR-0015 §7.3 layers 2/3: pure conflict detection, no DB access, so the
// admin route and its tests can both call it against plain data. Two kinds
// of conflict:
//
// - Layer 3 (hard refusal, 409): another Lucky Wheel campaign already
//   active on the SAME event with an overlapping [starts_at, ends_at]
//   window. This is the one case the runtime arbiter (PopupArbiterProvider)
//   cannot resolve on its own -- getActiveCampaignForEvent picks exactly
//   one campaign per event deterministically (§7.2), so two campaigns
//   both "active" on the same event at once is a genuine admin mistake,
//   not a situation the front end can gracefully juggle.
// - Layer 2 (warning only): an overlapping active popup promotion. Never a
//   refusal -- the runtime arbiter (§7.3 layer 1) guarantees only one
//   automatic popup ever opens per session, so configuring both is a
//   legitimate choice, just one worth flagging.
//
// Promotions (src/types/Promotion.ts) carry no event association -- they
// are global by design (PopupPromotion.tsx has no event filter) -- so a
// promotion is "shared" with every event's campaigns; the only relevant
// question for layer 2 is whether their date windows overlap at all.

export interface DateWindow {
  starts_at: string
  ends_at: string
}

export interface CampaignConflictCandidate extends DateWindow {
  id: string
  name: string
  event_ids: string[]
}

export interface PromotionConflictCandidate extends DateWindow {
  id: string
  title: string
}

export type CampaignConflict =
  | { severity: 'refuse'; kind: 'campaign'; conflict: CampaignConflictCandidate }
  | { severity: 'warn'; kind: 'promotion'; conflict: PromotionConflictCandidate }

const windowsOverlap = (a: DateWindow, b: DateWindow) =>
  new Date(a.starts_at).getTime() < new Date(b.ends_at).getTime() &&
  new Date(b.starts_at).getTime() < new Date(a.ends_at).getTime()

/**
 * Checks a campaign about to be activated (enabled=true) against other
 * already-active campaigns and active popup promotions. Returns every
 * conflict found, most severe first (refusals before warnings) -- the
 * caller decides whether any `refuse`-severity entry blocks the write.
 */
export const findCampaignConflicts = ({
  candidate,
  otherActiveCampaigns,
  activePopupPromotions,
}: {
  candidate: DateWindow & { id: string; event_ids: string[] }
  otherActiveCampaigns: CampaignConflictCandidate[]
  activePopupPromotions: PromotionConflictCandidate[]
}): CampaignConflict[] => {
  const conflicts: CampaignConflict[] = []

  for (const other of otherActiveCampaigns) {
    if (other.id === candidate.id) continue
    if (!windowsOverlap(candidate, other)) continue
    const sharesEvent = other.event_ids.some((eventId) => candidate.event_ids.includes(eventId))
    if (sharesEvent) {
      conflicts.push({ severity: 'refuse', kind: 'campaign', conflict: other })
    }
  }

  for (const promotion of activePopupPromotions) {
    if (windowsOverlap(candidate, promotion)) {
      conflicts.push({ severity: 'warn', kind: 'promotion', conflict: promotion })
    }
  }

  return conflicts
}
