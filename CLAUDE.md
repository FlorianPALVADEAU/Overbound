# CLAUDE.md

CRM léger pour piloter les partenariats de l'événement **Overbound** (course à obstacles, septembre 2026). Single-user au démarrage, multi-utilisateur dès V1.

## Comportement attendu

- Si le contexte est insuffisant, demande les informations manquantes plutôt que de fabriquer une réponse.
- Ne valide pas une mauvaise approche pour faire plaisir — sois direct et donne les raisons.
- Préfère un refus motivé à une action approximative.

## Stack

- Next.js App Router, TypeScript strict
- Tailwind + shadcn/ui
- Supabase (auth, DB, RLS, storage)
- Resend (email), OpenAI (IA via port interchangeable)

## Architecture

- Réalité actuelle : organisation par `src/lib/{domain}` avec logique métier, helpers de requête et appels Supabase parfois colocalisés.
- Cible théorique : séparation hexagonale stricte (`domain/`, `application/`, `infrastructure/`, `presentation/`) décrite dans [ADR-0004](docs/adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md).

Pas d'accès DB direct depuis l'UI ou les routes quand une alternative centralisée existe. Les use-cases et helpers de domaine restent dans `src/lib/` jusqu'à refactoring explicite.

## Conventions

- Pas de `any`, Zod aux frontières d'entrée, nommage orienté métier
- Pas de logique métier dans les composants UI
- Une responsabilité principale par module

## Tests

TDD sur domaine et use-cases. Chaque use-case : au moins un test succès + un test échec. Un bug reproduit = un test.

## Definition of Done

- Tests pertinents ajoutés et passants
- Séparation des couches respectée
- ADR si décision technique structurante, FDR si décision fonctionnelle structurante

## Domaines métier clés

| Domaine | Summary | Fichiers clés |
|---------|---------|--------------|
| **Wave Assignment** | 24 vagues OPEN (08h-11h50) vs départ unique RANKED (15h). Format detection via noms ticket/race. | src/lib/openSas.ts, src/lib/slotAssignment.ts, src/app/api/registrations/create/route.ts |
| **Group Membership** | Packs entreprise (captain + members) avec synchronisation d'ancre de vague. Anchor init via creator/member_join/admin. | src/lib/groups/*, migrations/20260416_groups.sql, migrations/20260512_groups_anchor_source.sql |
| **Ambassador Program** | Points (1pt OPEN, 2pts RANKED), 10 reward levels, extra tickets. Multi-promo codes. | src/lib/ambassadors/program.ts, api/ambassadors/* |
| **Email System** | 4 phases : unsubscribe → distribution lists → granular prefs → admin interface. RLS strict. | src/lib/email/*, api/admin/distribution-lists/* |
| **Registration State** | État parallèles : claim_status + approval_status + checked_in. Workflow complexe d'approbation. | src/types/Registration.ts, api/checkin/* |
| **Pricing & Tiers** | Prix dynamiques par tier (discount %), auto-activation. Promo codes (cumulative rules). | src/lib/pricing.ts, src/types/EventPriceTier.ts |

## Pièges courants

### Format detection
⚠️ **TOUJOURS** utiliser `isOpenFormatTicket(ticket, race)` au lieu de vérifier les IDs.
- Regex case-insensitive sur `ticket.name` ou `race.name`
- Dans SQL : `POSITION('open' IN LOWER(name)) > 0`
- **Jamais** faire confiance aux IDs seuls.

### Group anchor sync
⚠️ Quand un OPEN member rejoint un groupe **avec anchor**, ses OPEN registrations doivent être **forcées** vers la vague d'ancrage.
- Respecter la source d'init : `anchor_initialized_by` (creator / member_join / admin_manual)
- Transfer RANKED→OPEN doit **checker le groupe** avant d'assigner la vague
- Voir [critical-operations.md](docs/guides/critical-operations.md) pour dry-run

### Promo code cumulative
⚠️ `['LUOFF30', 'JUOFF50']` ne peuvent **PAS** être cumulés — exception implicite.
- Check logique dans [src/lib/registration.ts](src/lib/registration.ts#L50)
- Open ticket promos (suffix `OPENTICKET`) ont règles spéciales

### Wave counter maintenance
⚠️ Après chaque wave assignment/reassignment, **TOUJOURS** rafraîchir `event_waves.assigned_count`.
- Query : `SELECT COUNT() WHERE wave_index = X`
- Risk : wave_full checks invalides si counter out-of-sync

### Email preferences consistency
⚠️ Trigger PostgreSQL `sync_notification_prefs_to_lists` couple `notification_preferences` ↔ `list_subscriptions`.
- Jamais updater une table sans l'autre
- RLS strict : SELECT = auth.uid() OR is_admin()

### Ambassador points awarded
⚠️ Points awarded via RPC `award_ambassador_points_for_order()` — ne jamais insérer directly.
- Cherche `promotional_code_id` dans l'order
- If code ∈ `ambassador_promotional_codes`, UPDATE ambassador_points
- Points par format : OPEN=1, RANKED=2 (detecté via registration.race_format)

## Docs de référence

| Tâche | Docs |
|---|---|
| Feature métier | @docs/product/vision.md, @docs/fdr/README.md, @docs/quality/testing-strategy.md |
| Décision technique | @docs/architecture/overview.md, @docs/adr/README.md |
| Sécurité / RLS | @docs/security/data-and-rls.md |
| Standards de code | @docs/guidelines/engineering.md |
| Roadmap | @docs/roadmap/mvp-plan.md |
| **Wave Assignment** | @docs/fdr/FDR-0004-wave-assignment-open-vs-ranked.md + @docs/guides/implementation-guide-wave-assignment.md |
| **Groups & Anchor** | @docs/fdr/FDR-0005-group-membership-and-wave-anchoring.md + @docs/guides/implementation-guide-groups.md |
| **Ambassadors** | @docs/fdr/FDR-0006-ambassador-program-points-and-rewards.md + @docs/guides/implementation-guide-ambassador.md |
| **Email** | @docs/fdr/FDR-0007-email-distribution-and-preferences.md + @docs/guides/implementation-guide-email.md |
| **Critical Ops** | @docs/guides/critical-operations.md, @docs/guides/rpc-reference.md |
| **Legal / Juridique** | @docs/guides/legal.md |

