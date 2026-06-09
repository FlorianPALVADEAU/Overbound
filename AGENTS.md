# AGENTS.md

**Gateway central** de la documentation Overbound — index, règles, domaines métier, et rituels IA.

Objectif: fournir un contexte **stable, lisible, modulaire** pour les agents IA (et humains) sans monolithe documentaire.

---

## 🎯 Règles d'or

Ces règles s'appliquent **sans exception** à tout agent lisant ce fichier.

- **Droit à l'ignorance** : Si tu ne sais pas ou si le contexte est insuffisant, dis-le explicitement. Demande les infos manquantes ou refuse d'agir. Ne fabrique pas une réponse pour paraître compétent.
- **Pas de complaisance** : Ne valide pas une demande juste pour faire plaisir. Sois direct, franc, professionnel. Si une approche est mauvaise, dis-le clairement avec les raisons.
- **Refus explicite plutôt que silence** : Mieux vaut un refus motivé qu'une action approximative ou incorrecte.

---

## 📖 Règle de lecture

**Toujours lire dans cet ordre** :

1. Ce fichier (`AGENTS.md`)
2. La catégorie / domaine métier lié à ta tâche
3. Les références explicitement indiquées dans cette catégorie

**Ne pas charger toute la documentation** si ce n'est pas nécessaire.

---

## 🏗️ Règles transverses

À appliquer dans tout travail sur ce projet :

- **Stack cible** : Next.js App Router, TypeScript strict, Tailwind + shadcn/ui, Supabase (auth, DB, RLS), Resend (email).
- **Architecture** : Hexagonale stricte — `domain/` (métier pur) → `application/` (use-cases) → `infrastructure/` (adapters) → `presentation/` (API/UI).
  - **Réalité actuelle** : Organisation par `lib/{domain}` — voir [ADR-0004](docs/adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md) pour clarification hexagonal vs. réalité.
- **TDD obligatoire** : Logique métier et use-cases couverts par tests. Chaque use-case = min 1 test succès + 1 test échec. Bug trouvé = test d'abord.
- **Décisions structurelles** → ADR. **Décisions fonctionnelles** → FDR. Jamais de "magic" non documenté.
- **Multi-utilisateur dès V1** : `organization_id` + RLS Supabase sur tables métier clés.

---

## 📋 Domaines métier & documentation

| Domaine | FDR | Implementation Guide | Status |
|---------|-----|---------------------|--------|
| **Wave Assignment** (OPEN vs RANKED) | [FDR-0004](docs/fdr/FDR-0004-wave-assignment-open-vs-ranked.md) | [implementation-guide-wave-assignment.md](docs/guides/implementation-guide-wave-assignment.md) | ✅ Production |
| **Group Membership** + Wave Anchor | [FDR-0005](docs/fdr/FDR-0005-group-membership-and-wave-anchoring.md) | [implementation-guide-groups.md](docs/guides/implementation-guide-groups.md) | ✅ Production |
| **Ambassador Program** (Points + Rewards) | [FDR-0006](docs/fdr/FDR-0006-ambassador-program-points-and-rewards.md) | [implementation-guide-ambassador.md](docs/guides/implementation-guide-ambassador.md) | ✅ Production |
| **Email Distribution** (4 phases) | [FDR-0007](docs/fdr/FDR-0007-email-distribution-and-preferences.md) | [implementation-guide-email.md](docs/guides/implementation-guide-email.md) | ✅ Production |
| **Pipeline Partenaires** | [FDR-0001](docs/fdr/FDR-0001-pipeline-stages-and-transitions.md) | — | ✅ Production |
| **Follow-up Reminders** | [FDR-0002](docs/fdr/FDR-0002-follow-up-reminders-and-prioritization.md) | — | ✅ Production |
| **Email Drafting (IA)** | [FDR-0003](docs/fdr/FDR-0003-email-drafting-and-sending-workflow.md) | — | ✅ Production |

**Plus de docs** :

| Type | Fichier | Usage |
|------|---------|-------|
| **Reference** | [docs/guides/critical-operations.md](docs/guides/critical-operations.md) | Opérations dangereuses (transfer RANKED→OPEN, override ambassador points) |
| **Reference** | [docs/guides/rpc-reference.md](docs/guides/rpc-reference.md) | Tous les RPCs critiques, signatures, side effects |
| **Architecture** | [docs/adr/ADR-0001](docs/adr/ADR-0001-hexagonal-architecture-baseline.md) | Hexagonal style (théorique) |
| **Architecture** | [docs/adr/ADR-0004](docs/adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md) | Réalité vs. théorie : pourquoi `lib/{domain}` au lieu de hexagonal strict |
| **Fondations** | [docs/architecture/overview.md](docs/architecture/overview.md) | Vue d'ensemble structure codebase |
| **Fundations** | [docs/guidelines/engineering.md](docs/guidelines/engineering.md) | Clean Code, conventions, nommage, responsabilités |
| **Quality** | [docs/quality/testing-strategy.md](docs/quality/testing-strategy.md) | TDD, pyramide tests, critères validation |
| **Security** | [docs/security/data-and-rls.md](docs/security/data-and-rls.md) | Multi-user, RLS Supabase, RGPD minimum |
| **Operations** | [docs/operations/runbooks.md](docs/operations/runbooks.md) | Setup local, env vars, workflows |
| **Legal / Juridique** | [docs/guides/legal.md](docs/guides/legal.md) | Guide pour rédactions sensibles, disclaimers et processus de revue |
| **Product** | [docs/product/vision.md](docs/product/vision.md) | But métier, acteurs, périmètre V1/V2 |
| **Roadmap** | [docs/roadmap/mvp-plan.md](docs/roadmap/mvp-plan.md) | Plan implémentation V1/V2 |

---

## ⚠️ Warning Zone

**Opérations critiques** demandant **attention particulière** et contexte préalable :

### Scripts SQL "dangereux"

- **[transfer_ranked_to_open.sql](scripts/sql/transfer_ranked_to_open.sql)** : Déplace une registration RANKED → OPEN. **Respecte l'anchor du groupe** si le user est member. Voir [critical-operations.md](docs/guides/critical-operations.md) pour workflow complet + dry-run checklist.
- **Manual ambassador points override** : Modification directe via `/admin/ambassadors/points/[id]` PATCH — peut impacter rewards claiming, leaderboard. Voir [critical-operations.md](docs/guides/critical-operations.md).

### APIs complexes (>300 lignes)

- **`POST /api/registrations/create`** : Multi-step. Wave assignment conditionnel (OPEN vs RANKED), group anchor check, tier progression. Lire FDR-0004 + guide-wave avant modification.
- **`POST /api/groups/join`** : Anchor initialization logic. Voir FDR-0005 + guide-groups.
- **`GET /api/ambassadors/dashboard`** : Complex JOINs, points aggregation. Voir guide-ambassador.md.

### Patterns fragiles

- **Format detection** : Regex case-insensitive sur "open"/"ranked" dans ticket.name ou race.name. Jamais faire confiance aux IDs seuls.
- **Group anchor sync** : Si un OPEN member rejoint un groupe avec anchor, **TOUS** ses OPEN registrations sur cet event sont **forcées** à la vague d'anchor. Pas de compromis.
- **Promo code cumulative** : Codes `['LUOFF30', 'JUOFF50']` ne peuvent pas être cumulés — exception implicite. Voir [registration.ts](src/lib/registration.ts) pour logique.

---

## 📅 Cadence de collaboration IA

### Rythme recommandé

**Quotidien (léger — 10-15 min)**
- État actuel (branche, scope, commits)
- Blocages identifiés
- Prochaine action claire (1-3 items max)

**Hebdomadaire (complet — 30-45 min)**
- Bilan technique (architecture decisions, refactoring needs)
- Quality review (tests coverage, lint, build status)
- Priorisation sprint suivant

### Template de check-in quotidien

```markdown
## Contexte
- Branche: [nom]
- Scope: [feature / bugfix / refactor]

## Livré aujourd'hui
1. [Quoi + où]
2. [Quoi + où]

## Qualité
- Tests passés: ✅/❌
- Build: ✅/❌
- Risques restants: [liste ou "none"]

## Blocages
1. [Quoi + pourquoi + prochaine action]

## Prochaines actions proposées (priorité)
1. [Action]
2. [Action]
3. [Action]
```

### Rituels utiles avec IA

1. **`Review` ciblée avant merge**
   - Demander review orientée : régression risk + technical debt
   - Check : RLS policies, type safety, test coverage

2. **`Diff briefing` après session**
   - Résumé des fichiers changés
   - Impacts fonctionnels (quoi change pour l'utilisateur?)
   - Impacts data (migrations, RLS, breaking changes?)

3. **`Test gap check` en fin de feature**
   - Quels tests unitaires/route-level/E2E manquent?
   - Coverage sur happy path vs. edge cases

4. **`Release readiness` avant prod**
   - Checklist go/no-go concise
   - Données à migrer? Rollback plan?

---

## 🗺️ Mapping rapide tâche → docs

**"Je dois..."** → **Lire d'abord** → **Ensuite**

| Tâche | Étape 1 | Étape 2 | Étape 3 |
|-------|---------|---------|---------|
| Implémenter l'assignement de vagues | AGENTS.md (warning zone) | [FDR-0004](docs/fdr/FDR-0004-wave-assignment-open-vs-ranked.md) | [guide-wave-assignment.md](docs/guides/implementation-guide-wave-assignment.md) |
| Gérer une jointure de groupe | [FDR-0005](docs/fdr/FDR-0005-group-membership-and-wave-anchoring.md) | [guide-groups.md](docs/guides/implementation-guide-groups.md) | [critical-operations.md](docs/guides/critical-operations.md) (si transfer RANKED→OPEN) |
| Ajouter une feature ambassadeur | [FDR-0006](docs/fdr/FDR-0006-ambassador-program-points-and-rewards.md) | [guide-ambassador.md](docs/guides/implementation-guide-ambassador.md) | [rpc-reference.md](docs/guides/rpc-reference.md) (RPCs) |
| Générer un email HTML | [email-conventions.md](docs/guides/email-conventions.md) ← **lire en premier** | [FDR-0007](docs/fdr/FDR-0007-email-distribution-and-preferences.md) | [guide-email.md](docs/guides/implementation-guide-email.md) |
| Envoyer un email marketing (système) | [FDR-0007](docs/fdr/FDR-0007-email-distribution-and-preferences.md) | [guide-email.md](docs/guides/implementation-guide-email.md) | — |
| Créer une nouvelle feature métier | [vision.md](docs/product/vision.md) → [FDR appropriée](docs/fdr/README.md) | [engineering.md](docs/guidelines/engineering.md) | [testing-strategy.md](docs/quality/testing-strategy.md) |
| Décider architecture | [overview.md](docs/architecture/overview.md) → [ADR-0004](docs/adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md) | Écrire ADR | [guidelines.md](docs/guidelines/engineering.md) |
| Debugger une opération critique | [critical-operations.md](docs/guides/critical-operations.md) | [rpc-reference.md](docs/guides/rpc-reference.md) | FDR pertinent + code |
| Setup local ou opérationnel | [runbooks.md](docs/operations/runbooks.md) | [docs/guides/README.md](docs/guides/README.md) (si email) | — |

---

## ✅ Définition of Done (DoD)

Avant de considérer une tâche terminée :

- ✅ Tests pertinents ajoutés et **passants** (unit + integration si métier critique)
- ✅ **Zéro contournement** des couches (pas de DB direct depuis UI, logique métier dans domain/)
- ✅ Type safety : pas de `any` non justifié, Zod aux frontières d'entrée
- ✅ Documentation mise à jour (FDR/ADR si impactful, sinon code comments)
- ✅ Critères d'acceptation feature **vérifiés manuellement** (happy path + 1 edge case)
- ✅ Build ✅, Lint ✅, Tests ✅ (pas de workarounds mergés)

---

## 🚀 Prompt recommandé (début de session)

```
Lis AGENTS.md et charge uniquement les catégories nécessaires à la tâche.
Si opération critique (warning zone), demande confirmation contexte avant d'agir.
```

Ou plus spécifique :

```
Je dois [implémenter X / debugger Y / ajouter Z].
Lis AGENTS.md, fais le mapping tâche → docs, et propose plan.
```

---

## 📚 Index complet des répertoires

- **[docs/fdr/](docs/fdr/)** : Décisions fonctionnelles (6 FDRs)
- **[docs/guides/](docs/guides/)** : Guides d'implémentation (4 guides) + opérations critiques + RPC reference
- **[docs/adr/](docs/adr/)** : Décisions architecturales (4 ADRs)
- **[docs/architecture/](docs/architecture/)** : Vue d'ensemble structure
- **[docs/guidelines/](docs/guidelines/)** : Standards code, conventions
- **[docs/quality/](docs/quality/)** : Stratégie tests, TDD
- **[docs/security/](docs/security/)** : RLS, auth, RGPD
- **[docs/operations/](docs/operations/)** : Runbooks, env setup, guides opérationnels
- **[docs/product/](docs/product/)** : Vision produit, objectifs
- **[docs/roadmap/](docs/roadmap/)** : Plan implémentation V1/V2

---

**Dernier update** : 12 mai 2026 — documentation complète basée sur logique métier réelle + patterns production
