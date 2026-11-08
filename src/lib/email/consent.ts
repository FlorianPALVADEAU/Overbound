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

export function hasProvenConsent(source: string | null | undefined): boolean {
  const value = source?.trim()
  if (!value) return false
  return !value.startsWith(LEGACY_UNPROVEN_SOURCE)
}
