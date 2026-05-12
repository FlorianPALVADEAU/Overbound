# Testing Strategy

## Approche

TDD par défaut sur:

- règles de domaine
- use-cases

## Pyramide

- Tests unitaires domaine/application (priorité haute)
- Tests d'intégration adapters (Supabase, Resend)
- E2E sur parcours critiques

## Parcours critiques V1

- créer partenaire -> planifier relance
- changer de statut pipeline -> historiser
- générer brouillon IA -> envoyer email avec pièce jointe

## Règles qualité

- Un bug reproduit doit avoir un test.
- Chaque use-case a au moins un test succès + un test échec.
