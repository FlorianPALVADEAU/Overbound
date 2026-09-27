// FDR-0014 §6 exception: allows one specific email to respin an unlimited
// number of times, dev-only. Deliberately not a DB row/admin toggle --
// this is a single named developer's own testing convenience, scoped by
// environment, not a product feature. If this needs to extend to other
// testers or environments, promote it to a DB-backed allowlist instead of
// widening this constant.
//
// Isolated in its own module (not inlined in the route) so the rule is
// independently testable and the route stays a thin orchestrator -- one
// named export, one reason to change.

const DEV_UNLIMITED_SPIN_EMAIL = 'florian.plvd@gmail.com'

export const isDevUnlimitedSpinEmail = (email: string): boolean =>
  process.env.NODE_ENV === 'development' && email.trim().toLowerCase() === DEV_UNLIMITED_SPIN_EMAIL

/**
 * Deletes any prior entry (and its reward allocations, which have no
 * ON DELETE CASCADE -- lucky_wheel_reward_allocations.wheel_entry_id is a
 * plain NOT NULL FK, see 20260920190000_lucky_wheel_schema.sql) for this
 * email on this campaign, so a fresh entry can be created. The *only*
 * honest way to bypass the (campaign_id, email) unique constraint short of
 * relaxing it for everyone. The constraint itself is untouched; this
 * clears its own path before insert, exclusively for
 * isDevUnlimitedSpinEmail() callers.
 */
export const resetLuckyWheelEntryForDevTesting = async ({
  admin,
  campaignId,
  email,
}: {
  admin: any
  campaignId: string
  email: string
}): Promise<void> => {
  const { data: existingEntries, error: lookupError } = await admin
    .from('lucky_wheel_entries')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('email', email)

  if (lookupError) {
    throw lookupError
  }

  const entryIds = (existingEntries ?? []).map((entry: { id: string }) => entry.id)
  if (entryIds.length === 0) {
    return
  }

  const { error: allocationsError } = await admin
    .from('lucky_wheel_reward_allocations')
    .delete()
    .in('wheel_entry_id', entryIds)

  if (allocationsError) {
    throw allocationsError
  }

  const { error: entriesError } = await admin
    .from('lucky_wheel_entries')
    .delete()
    .in('id', entryIds)

  if (entriesError) {
    throw entriesError
  }
}
