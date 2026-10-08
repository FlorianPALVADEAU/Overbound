// Règle du planning bénévoles non respectée (zone inconnue, effectif invalide…).
// Les routes la traduisent en réponse 422, tout le reste reste une erreur serveur.
export class PlanningError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanningError'
  }
}
