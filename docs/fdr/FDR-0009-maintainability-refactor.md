# FDR-0009 — Plan de refactoring maintenabilité (issu de l'audit 2026-09-15)

- **Statut** : Proposed
- **Date** : 2026-09-15
- **Owner produit** : Florian Palvadeau
- **Owner technique** : à désigner
- **Portée** : dette technique transverse (architecture, sécurité, tests, logique métier) identifiée
  par l'audit complet du 2026-09-15
- **Référence source** : [docs/audit/AUDIT-2026-09-15-full-codebase-review.md](../audit/AUDIT-2026-09-15-full-codebase-review.md)
  — lire ce document avant de commencer, il contient toutes les preuves (fichiers, lignes) derrière
  chaque décision ci-dessous.
- **Références croisées** : [ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md),
  [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md), [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md),
  [FDR-0008](./FDR-0008-admin-operations-workspace.md), [rpc-reference.md](../guides/rpc-reference.md),
  [critical-operations.md](../guides/critical-operations.md)

> **Document de cadrage.** Cette FDR ordonne un plan d'exécution multi-phases. Elle n'autorise pas à
> elle seule une migration RLS, une réécriture d'historique git, ou une modification de données de
> production. Chaque phase a ses propres critères d'acceptation à valider avant la suivante.

---

## 0. Guide de reprise pour un agent

### Contexte à assimiler avant toute action

1. Le projet **n'est pas** le "CRM léger partenariats" décrit historiquement dans certains documents
   produit. C'est un site événementiel public complet (inscriptions, paiement Stripe, ambassadeurs,
   admin, RGPD). `CLAUDE.md` a été corrigé le 2026-09-15 pour refléter cette réalité — s'y fier en
   priorité sur tout document plus ancien qui contredirait ce périmètre.
2. L'événement principal (Ultra Arena / Overbound) a lieu le **12 septembre 2026**. Si tu lis ce
   document après cette date, les priorités "avant le jour J" de la section 1 sont caduques —
   commence directement à la phase 2.
3. Un incident de sécurité (dump de production dans l'historique git) a été détecté et corrigé le
   2026-09-15 : historique réécrit, `.gitignore` corrigé, force-push effectué sur `origin/main`. Ne
   pas re-committer de fichier sous `supabase/.db-dumps/` ou `scripts/sql/*.sql` — ils sont maintenant
   correctement ignorés, garde-les ainsi.
4. Ce FDR découle d'un audit fait par 4 agents en parallèle sur des axes différents (architecture,
   sécurité/RGPD, logique métier/tests, funnel). Chaque affirmation ci-dessous est traçable dans le
   rapport source — si un point semble faux au moment de la reprise, vérifie dans le code avant de le
   croire sur parole : le code a pu évoluer depuis.

### Règles qui ne peuvent pas être contournées

- Ne jamais committer un fichier contenant des données de production réelles (dumps SQL, exports
  d'emails de participants) — vérifier `.gitignore` avant tout `git add -A`.
- Ne jamais réécrire l'historique git (`filter-repo`, `rebase -i` sur du commit déjà poussé) sans
  confirmation explicite de l'utilisateur, backup complet préalable, et vérification que le repo est
  privé ou que l'urgence le justifie.
- Toute modification touchant `wave_index`, `event_waves.assigned_count`, ou l'ancrage de groupe doit
  passer par la RPC officielle ou un mécanisme verrouillé équivalent — jamais un `SELECT` puis
  `UPDATE` séparés côté application (voir §2, risque déjà identifié).
- Pas de `any` dans le nouveau code. Zod à toute nouvelle frontière d'entrée API.
- Un refactoring de composant ne doit jamais changer de comportement fonctionnel observable sans
  ticket/validation séparée — ce FDR couvre la forme du code, pas de nouvelles règles métier.

### Ce qu'un agent ne doit pas faire sans validation humaine explicite

- Supprimer ou réécrire des migrations SQL déjà appliquées en prod.
- Changer une policy RLS en production sans test préalable sur un environnement de dev/staging.
- Fusionner `registrations/create/route.ts` et `webhooks/stripe/route.ts` en un seul point d'entrée
  sans avoir d'abord écrit des tests de non-régression couvrant les deux chemins actuels.
- Toucher au dossier `docs/legal/` ou aux pages `cgu`/`cgv`/`privacy-policies` sans passer par
  `docs/guides/legal.md` (revue juridique obligatoire pour ce type de contenu).

---

## 1. Priorité 0 — avant tout événement daté (bloquant, sécurité/fiabilité jour J)

Ces points ne sont pas du refactoring de confort : ce sont des risques d'incident opérationnel
visible par les participants. À traiter en premier, indépendamment du reste du plan.

### 1.1 Versionner les RPC métier critiques

**Problème** : `assign_open_wave_to_registration`, `award_ambassador_points_for_order`,
`sync_open_group_wave`, `increment_promo_code_usage`, `resolve_group_anchor`, `check_wave_full`
n'existent dans aucune migration commitée — uniquement dans un dump statique
(`supabase/.db-dumps/prod-schema.sql`). Impossible de reconstruire l'environnement, impossible de
faire une revue de code sur ces fonctions, impossible de corriger un bug en urgence de façon
auditable.

**Action** : extraire la définition SQL exacte de chaque RPC depuis `prod-schema.sql`, créer une
migration versionnée dans `supabase/migrations/` par fonction (ou groupées par domaine), et vérifier
via `supabase db diff` (ou équivalent) que la migration produit un schéma identique à la prod.

**Critère d'acceptation** : `supabase/migrations/` contient la définition complète de toutes les RPC
listées dans `docs/guides/rpc-reference.md`. Un environnement Supabase local recréé from scratch avec
ces migrations expose les mêmes signatures de fonction que la prod.

### 1.2 Corriger la race condition sur le chemin groupe

**Problème** : dans `src/app/api/registrations/create/route.ts` (~lignes 621-647), le chemin "membre
de groupe déjà ancré" fait un `SELECT assigned_count` puis un `UPDATE` calculé côté JS, sans lock —
contrairement à la RPC individuelle qui utilise `FOR UPDATE SKIP LOCKED`. Deux inscriptions
concurrentes sur la même vague ancrée peuvent produire un sous-comptage silencieux de
`event_waves.assigned_count`. Même pattern dans `src/lib/groups/syncOpenGroupWave.ts`.

**Action** : soit router ce chemin vers une RPC dédiée avec le même verrouillage que
`assign_open_wave_to_registration`, soit envelopper le `SELECT`+`UPDATE` dans une transaction
Postgres avec verrou de ligne explicite (`SELECT ... FOR UPDATE`) côté RPC plutôt que côté client
Supabase REST (qui ne supporte pas nativement les transactions multi-requêtes).

**Critère d'acceptation** : un test d'intégration simule 2+ inscriptions concurrentes de membres du
même groupe ancré et vérifie que `assigned_count` final est exact (pas de perte d'incrément). Voir
`docs/quality/testing-strategy.md` pour le format attendu (test succès + test échec).

### 1.3 Auditer les scripts SQL non trackés restants

**Problème** : `scripts/sql/transfer_ranked_to_open_by_emails.sql`, `seed_afternoon_open_waves.sql`,
`set_event_capacity_355.sql` n'ont pas été lus en détail pendant l'audit (contrainte de temps). Le
seul script vérifié (`assign_open_1200_sas_by_emails.sql`) a un garde-fou dry-run correct mais
**aucune protection contre un rejeu après check-in** — un admin qui relance ce script par erreur
après le début de l'événement pourrait déplacer la vague de quelqu'un déjà check-in.

**Action** : lire chaque script, vérifier (a) présence d'un mode dry-run par défaut, (b) protection
explicite contre la modification d'une registration avec `checked_in = true`, (c) idempotence si
rejoué deux fois par erreur. Ajouter la protection manquante si absente.

**Critère d'acceptation** : chaque script sous `scripts/sql/` a un commentaire d'en-tête documentant
son mode d'emploi sûr, et refuse explicitement de modifier une registration déjà check-in.

---

## 2. Priorité 1 — sécurité et conformité (post-événement, avant nouvelle feature)

### 2.1 Rate limiting sur les routes sensibles

Aucun rate limiting détecté sur `/api/unsubscribe`, `/api/promotions/validate`,
`/api/registrations/create`, `/api/auth/account-exists`, `/api/checkin`. Ajouter un rate limiter
(Upstash Ratelimit ou équivalent compatible Vercel Edge) au minimum sur les routes d'énumération
(`account-exists`, `promotions/validate`).

**Critère d'acceptation** : un test envoyant N+1 requêtes en séquence rapide sur une route protégée
reçoit un 429 à partir du seuil configuré.

### 2.2 Idempotence commande — ~~DONE (correction du diagnostic initial)~~

**Le diagnostic initial de ce FDR était faux** — vérifié en base prod (2026-09-16) : un
`stripe_payment_intent_id` correspond légitimement à **plusieurs** lignes `registrations`
(inscription groupe multi-participants, jusqu'à 7 lignes constatées pour un seul paiement).
Une contrainte `UNIQUE` sur `registrations.stripe_payment_intent_id` aurait cassé toute
inscription de groupe en production.

La vraie protection d'idempotence existe déjà en base : `orders_provider_provider_order_id_key`,
contrainte `UNIQUE (provider, provider_order_id)` sur la table `orders`. Le vrai gap identifié :
en cas de webhook Stripe rejoué (retry) ou de requête concurrente, l'insert dans `orders` échouait
sur cette contrainte avec un `throw` générique (500) au lieu d'un traitement idempotent propre.

**Corrigé** : `src/app/api/webhooks/stripe/route.ts` et `src/app/api/registrations/create/route.ts`
catchent maintenant `orderError.code === '23505'` et retournent une réponse idempotente (200/409)
au lieu de propager l'erreur.

### 2.3 Généraliser Zod aux frontières d'entrée

Actuellement 20/118 routes API utilisent Zod. Prioriser dans cet ordre (routes les plus sensibles
d'abord) : `registrations/create`, `checkin`, `promotions/validate`, `ambassadors/rewards/claim`,
`admin/users`, `admin/promotional-codes`, `admin/groups`, `groups`.

**Critère d'acceptation** : chaque route listée valide son body avec un schéma Zod explicite, retourne
une 400 structurée en cas d'échec de validation (pas de cast `as {...}` non validé en amont d'une
opération d'écriture).

### 2.4 Factoriser la vérification auth/rôle admin

`src/middlewares/adminMiddlewares.ts` existe mais est vide. Le pattern `getUser()` +
`SELECT role FROM profiles` + comparaison est dupliqué dans chaque route admin. Extraire un helper
unique (`requireAdmin(request)` ou équivalent) dans `src/lib/auth/` et le faire utiliser par toutes
les routes `src/app/api/admin/**`.

**Critère d'acceptation** : zéro route sous `src/app/api/admin/` ne réimplémente sa propre vérification
de rôle — toutes appellent le helper commun. Un test vérifie qu'un utilisateur non-admin reçoit 403
sur un échantillon représentatif de ces routes.

### 2.5 Commiter la migration RLS manquante

`supabase/migrations/20260803_enable_rls_missing_tables.sql` doit être commité pour que l'état RLS de
la prod soit reproductible depuis git (actuellement décalage entre prod réelle et historique
versionné).

### 2.6 Renforcer le consentement cookies

Ajouter une expiration/re-consentement périodique (6-13 mois), une preuve de consentement
horodatée côté serveur (au minimum un log applicatif), et évaluer si une granularité par finalité
(analytics / marketing / réseaux sociaux) est nécessaire plutôt qu'un seul toggle "analytics"
regroupant GA4 + GTM + Meta Pixel.

---

## 3. Priorité 2 — architecture et maintenabilité du code

### 3.1 Documentation produit — déjà partiellement traitée

`CLAUDE.md` corrigé le 2026-09-15 pour refléter le produit réel. `docs/product/vision.md` et
`docs/architecture/overview.md` décrivent toujours le "CRM partenariats" hexagonal fictif — soit les
réécrire pour décrire le produit réel (recommandé, cohérent avec ADR-0004), soit les marquer
explicitement `[ARCHIVÉ — cible jamais implémentée]` en tête de fichier pour éviter toute confusion
future.

### 3.2 Créer `src/lib/shared/presentation/`

Ce dossier est référencé par `docs/guidelines/engineering.md` mais n'existe pas. Y regrouper :
mapping couleur/label de statut (dupliqué actuellement entre `races/[id]/page.tsx`,
`admin/registrations`, `admin/ambassadors`, `admin/groups`), formatage de dates, badges partagés.

### 3.3 Découper les fichiers >600 lignes en priorité

Ordre suggéré (impact maintenabilité × fréquence de modification probable) :
1. `src/components/ambassadors/AmbassadorDashboard.tsx` (981 lignes) — extraire en sous-composants
   de présentation + supprimer l'import de logique depuis `@/app/api/...` (couplage inversé).
2. `src/app/races/[id]/page.tsx` (1107 lignes) — extraire le fetch dans un hook dédié, le mapping de
   statut dans `shared/presentation/`.
3. `src/components/admin/registrations/RegistrationsSection.tsx` (774 lignes) — extraire
   `UpsellSummaryPanel` (avec son fetch caché) en composant fichier séparé avec son propre hook de
   data-fetching.
4. `src/app/events/[id]/page.tsx` (783 lignes).

**Ne pas tout faire en un seul PR** — un fichier par PR, avec tests de non-régression avant/après si
des tests existent, ou un test de snapshot minimal sinon.

### 3.4 Supprimer les 2 accès DB directs restants dans l'UI

- `src/app/preferences/page.tsx` : extraire l'appel `supabase.from('profiles')` vers `src/lib/`.
- `src/app/events/[id]/layout.tsx` : extraire `fetchEventMeta`, et dédupliquer l'appel entre
  `generateMetadata` et le rendu (utiliser `React.cache()` ou passer les données du layout à la page
  via un mécanisme de partage plutôt que deux appels Supabase indépendants — ce point corrige aussi
  un problème de performance funnel documenté en §4 de l'audit).

### 3.5 Réduire les `any`

Prioriser `src/app/api/admin/registrations/route.ts` (27 occurrences) et
`src/app/api/registrations/create/route.ts` (7, route de paiement) avant les fichiers moins critiques
(SEO structured data, tests).

---

## 4. Priorité 3 — tests

Suivre `docs/quality/testing-strategy.md` (TDD, un test succès + un test échec par use-case). Modules
sans aucun test actuellement, par ordre de criticité :

1. `src/lib/groups/resolveGroupAnchor.ts` — signalé comme piège explicite dans `CLAUDE.md`, aucun test.
2. `src/lib/email.ts` (573 lignes, `sendTicketEmail`, `sendReceiptEmail`) — chemin critique de chaque
   inscription payée.
3. Tests d'intégration pour `registrations/create`, `webhooks/stripe`, `checkin` — les 3 points
   d'entrée les plus critiques du jour J n'en ont aucun.
4. `src/lib/ambassadors/rewardsNotifications.ts`, `src/lib/ambassadors/email.ts`.
5. Couche email phase 3/4 : `eventUpdates.ts`, `eventOpenings.ts`, `engagement.ts`, `reactivation.ts`,
   `emailLogs.ts`, `marketing.ts`, `adminDigest.ts`.

---

## 5. Priorité 4 — funnel d'acquisition (impact business, pas urgence technique)

### 5.1 Découpler le tracking analytics du chargement des pixels

**Problème** : `AnalyticsScripts.tsx` ne charge Meta Pixel/GA4/GTM qu'après consentement explicite —
conforme RGPD, mais signifie qu'un visiteur qui n'accepte pas ne génère aucun signal de conversion
pour l'optimisation publicitaire.

**Action possible** (à valider avec le responsable marketing avant implémentation — c'est un
arbitrage produit, pas juste technique) : évaluer un "consent mode" dégradé (Google/Meta supportent
des modes où des signaux anonymisés/agrégés sont envoyés même sans consentement individuel complet),
ou a minima s'assurer que le taux d'acceptation de la bannière est mesuré pour quantifier l'ampleur
réelle du biais.

### 5.2 Ajouter la capture et propagation UTM

Aucune capture UTM trouvée dans le funnel ni dans le système d'emails. Ajouter la capture des
paramètres UTM à l'entrée du funnel (query params sur la landing), les persister dans le
`RegistrationDraft` (store Zustand existant) ou en cookie de courte durée, et les propager jusqu'à
l'order Stripe (metadata) pour permettre l'attribution par campagne.

### 5.3 Remplacer `<img>` par `next/image` dans le funnel critique

Pages concernées : `events/[id]/page.tsx`, tout `src/components/events/ultra-arena/*.tsx`.

### 5.4 Vérifier le processus opérationnel de bascule de statut événement

S'assurer qu'il existe une checklist ou une alerte pour basculer `event.status` vers
`completed`/`closed` en cohérence avec l'arrêt des campagnes publicitaires actives — actuellement
un processus manuel sans garde-fou technique.

---

## 6. Ce qui n'est PAS dans ce FDR (hors périmètre)

- Rotation des secrets/sessions suite à l'incident de sécurité du 2026-09-15 — action opérationnelle
  immédiate pour l'utilisateur, pas un refactoring de code.
- Décisions produit sur le funnel (ex : simplifier le tunnel de signature électronique) — nécessite
  un arbitrage légal (obligation de décharge signée pour un sport à risque), pas une décision
  purement technique. Voir `docs/guides/legal.md` avant toute modification de ce flux.
- Le contenu de FDR-0008 (espace opérations admin) — perimètre distinct, déjà en cours.

## 7. Critères d'acceptation globaux du FDR

- Chaque section (1 à 5) est traitée comme une série de PR indépendantes et review-able séparément —
  ne pas tenter un unique méga-refactoring.
- Avant de clore une section, mettre à jour ce FDR : passer son statut de `Proposed` à une note de
  progression par sous-section (`[ ]` / `[x]`), pour qu'une IA reprenant plus tard sache où s'arrêter.
- Aucune section de priorité N ne doit être commencée avant que toutes les sections de priorité N-1
  soient closes, sauf instruction explicite contraire de l'utilisateur.

## 8. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Réécrire une RPC (§1.1) introduit une régression silencieuse vs le comportement prod actuel | Comparer le schéma généré avec `prod-schema.sql` ligne par ligne avant de considérer la migration complète ; ne jamais appliquer en prod sans test sur un projet Supabase de staging |
| Refactoring de composant (§3.3) casse un comportement UI non testé | Capturer manuellement le comportement actuel (captures d'écran ou description) avant modification si aucun test n'existe |
| Rate limiting (§2.1) bloque des utilisateurs légitimes en heure de pointe le jour de l'événement | Configurer des seuils généreux d'abord, avec monitoring, avant de durcir |
| Toucher au funnel de paiement (§3.4, §5) introduit une régression sur le taux de conversion | Déployer derrière feature flag si possible, ou en heures creuses, avec rollback prêt |
