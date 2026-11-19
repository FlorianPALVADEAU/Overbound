/**
 * Marketing consent provenance (FDR-0007, amendement 2026-11-08).
 *
 * A subscription may receive marketing mail only when we can say where the consent came from.
 * `list_subscriptions.source` carries that origin; rows the migration could not trace are marked
 * with the legacy marker and stay out of every send until the person confirms again.
 */

export const LEGACY_UNPROVEN_SOURCE = 'legacy-unproven'

/** Source written when a person confirms their choices from the re-consent mail. */
export const RECONSENT_SOURCE = 'reconsent'

/**
 * Rows the newsletter popup wrote before the provenance rule. Owner decision 2026-11-19: a person who
 * typed their address in the popup asked for marketing mail, so these rows stay sendable.
 */
const LEGACY_POPUP_PREFIX = `${LEGACY_UNPROVEN_SOURCE}:popup`

export function hasProvenConsent(source: string | null | undefined): boolean {
  const value = source?.trim()
  if (!value) return false
  if (value.startsWith(LEGACY_POPUP_PREFIX)) return true
  return !value.startsWith(LEGACY_UNPROVEN_SOURCE)
}
