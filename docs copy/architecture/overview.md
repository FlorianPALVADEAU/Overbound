# Architecture Overview

## Style

Architecture hexagonale stricte.

- `domain`: entités, value objects, règles métier pures.
- `application`: use-cases, ports, orchestration métier.
- `infrastructure`: adapters (Supabase, Resend, Push, IA).
- `presentation`: API routes, DTO, validation, UI mapping.

Sous-règle `presentation`:
- `presentation/components` pour les blocs UI réutilisables.
- `presentation/hooks` pour la logique d'interaction UI réutilisable.
- `modules/shared/presentation` pour les helpers visuels transverses (formatage, styles de stage/relance).

## Règles

- Aucun accès DB direct depuis UI ou routes.
- Les use-cases dépendent uniquement de ports.
- Les adapters implémentent les ports.
- Les types de domaine ne dépendent pas de frameworks.

## Cibles techniques

- Front/API: Next.js (App Router).
- Persistance/auth/storage: Supabase.
- Email: Resend.
- UI: Tailwind + shadcn/ui.

## Multi-utilisateur

- `organization_id` dans les agrégats métier pertinents.
- Auth user lié à organization.
- RLS activée sur tables métier.
