export interface AmbassadorCodeLink {
  promotional_code_id: string
  is_current: boolean
}

/**
 * The code an ambassador shares. Multi-code ambassadors are described by their junction rows only; the
 * legacy single code on the ambassador row is used when there is no junction row.
 */
export function pickCurrentCodeId(links: readonly AmbassadorCodeLink[], legacyCodeId: string | null): string | null {
  if (links.length === 0) return legacyCodeId
  return (links.find((link) => link.is_current) ?? links[0]).promotional_code_id
}

/** Every promo code id of an ambassador, with the same rule as `pickCurrentCodeId`. */
export function listAmbassadorCodeIds(links: readonly AmbassadorCodeLink[], legacyCodeId: string | null): string[] {
  if (links.length > 0) return links.map((link) => link.promotional_code_id)
  return legacyCodeId ? [legacyCodeId] : []
}
