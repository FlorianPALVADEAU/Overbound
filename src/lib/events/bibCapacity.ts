/** Normalise une capacité de dossards saisie en admin : entier > 0, sinon null (non configuré). */
export const parseBibCapacity = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/** Les dossards RANKED réservés ne peuvent pas dépasser la capacité totale de l'événement. */
export const isRankedCapacityWithinTotal = (total: number, ranked: number | null): boolean =>
  ranked === null || ranked <= total

export interface BibConfigChangeInput {
  next: { capacity: number; ranked: number | null }
  current: { capacity: number; ranked: number | null }
  /** Plus haut dossard RANKED attribué (inscriptions non annulées), null si aucun. */
  maxRankedBib: number | null
  /** Plus haut dossard attribué tous formats confondus, null si aucun. */
  maxBib: number | null
  hasOpenBib: boolean
}

/**
 * Plage unique : OPEN commence à ranked+1. Modifier ranked alors que des
 * dossards OPEN existent les décalerait ; baisser une capacité sous un
 * dossard déjà attribué est impossible. Renvoie un message d'erreur ou null.
 */
export const validateBibConfigChange = ({
  next,
  current,
  maxRankedBib,
  maxBib,
  hasOpenBib,
}: BibConfigChangeInput): string | null => {
  if (!isRankedCapacityWithinTotal(next.capacity, next.ranked)) {
    return 'Les dossards RANKED ne peuvent pas dépasser la capacité totale.'
  }
  if (hasOpenBib && (next.ranked ?? 0) !== (current.ranked ?? 0)) {
    return 'Des dossards OPEN sont déjà attribués : le nombre de dossards RANKED ne peut plus changer.'
  }
  if (maxRankedBib !== null && (next.ranked ?? 0) < maxRankedBib) {
    return `Un dossard RANKED n°${maxRankedBib} est déjà attribué : minimum ${maxRankedBib}.`
  }
  if (maxBib !== null && next.capacity < maxBib) {
    return `Le dossard n°${maxBib} est déjà attribué : la capacité totale doit être au moins ${maxBib}.`
  }
  return null
}
