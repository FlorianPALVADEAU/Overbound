// Départage reproductible : le « hasard » dépend uniquement de l’identifiant et de la zone, donc
// relancer la répartition ne change jamais un résultat déjà obtenu (hash FNV-1a).
export class TieBreaker {
  rank(volunteerId: string, zoneKey: string): number {
    const value = `${volunteerId}:${zoneKey}`
    let hash = 2166136261
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  }
}
