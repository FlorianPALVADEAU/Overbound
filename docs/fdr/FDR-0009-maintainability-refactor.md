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

### 2.1 Rate limiting sur les routes sensibles — DONE (2026-09-16)

**Fait** : 1 règle Vercel Firewall (dashboard, hors code — voir
`docs/security/rate-limiting.md`) couvrant `/api/auth/account-exists`,
`/api/promotions/validate`, `/api/registrations/create`, `/api/unsubscribe`
(conditions `OR`, 10 req/60s par IP, 429). Plan Hobby limite à 1 règle active,
donc seuils regroupés au plus bas commun plutôt que différenciés par route.

`/api/checkin` **explicitement exclu** — pas de protection possible sans 2e
règle (plan payant requis), et ne doit de toute façon jamais bloquer un
bénévole en plein scan le jour J. Risque accepté, documenté.

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

### 2.6 Renforcer le consentement cookies — partiellement fait (2026-09-16)

**Fait** : expiration à 12 mois (`src/components/consent/consent.ts`, `CONSENT_MAX_AGE_MS`) —
`readConsent()` purge le consentement expiré et rouvre automatiquement la bannière (aucun
changement UI nécessaire). Preuve serveur horodatée via une nouvelle table
`cookie_consent_logs` (migration `supabase/migrations/20260916_cookie_consent_logs.sql`,
**non appliquée en prod — à appliquer manuellement**, `supabase db push` ou dashboard SQL editor)
et un endpoint `POST /api/consent/log` appelé en fire-and-forget (`keepalive: true`, jamais
bloquant) depuis `writeConsent()`.

**Non fait, hors scope de cette itération** : granularité par finalité (analytics / marketing /
réseaux sociaux séparés au lieu du toggle unique "analytics" qui regroupe GA4 + GTM + Meta Pixel).
Décision explicite : ce point change l'UI vue par l'utilisateur (nouvelles cases à cocher) et
mérite un arbitrage produit séparé plutôt qu'un durcissement silencieux — cf. audit §2.3 pour le
détail du problème (biais de mesure publicitaire quand le refus groupe les 3 traceurs).

---

## 3. Priorité 2 — architecture et maintenabilité du code — DONE (2026-09-16)

### 3.1 Documentation produit — fait

`docs/product/vision.md` et `docs/architecture/overview.md` réécrits pour décrire le produit réel
(catalogue courses, inscription Stripe, wave assignment, groupes/ancrage, ambassadeurs, emails
RGPD), avec la cible hexagonale démotée en section explicitement labellisée "Cible théorique (non
implémentée)" renvoyant vers ADR-0004. `docs/roadmap/mvp-plan.md` reste à corriger séparément (hors
scope de cette passe, toujours la cible CRM).

### 3.2 Créer `src/lib/shared/presentation/` — fait

`src/lib/shared/presentation/eventStatus.ts` créé (mapping variant/label de statut événement),
utilisé par `races/[id]/page.tsx` et `events/[id]/page.tsx`. Duplication restante identifiée mais
hors scope de cette passe : `admin/registrations`, `admin/ambassadors`, `admin/groups` ont chacun
leur propre mapping de statut différent (registration/ambassador reward status, pas event status) —
pas de règle visuelle commune évidente à mutualiser sans risque de sur-abstraction.

### 3.3 Découper les fichiers >600 lignes — fait (les 4 fichiers)

1. `AmbassadorDashboard.tsx` (981→154 lignes) — 11 composants de section sous
   `src/components/ambassadors/`, couplage inversé corrigé (`rewardQueries.ts` déplacé de
   `src/app/api/` vers `src/lib/ambassadors/rewardsClient.ts` + hook
   `src/hooks/ambassadors/useClaimAmbassadorReward.ts`).
2. `races/[id]/page.tsx` — mapping de statut migré vers `shared/presentation/eventStatus.ts`.
3. `RegistrationsSection.tsx` (774 lignes) — `UpsellSummaryPanel` extrait en composant + hook
   dédié (`upsellsSummaryQueries.ts`), même pattern que `registrationsQueries.ts`.
4. `events/[id]/page.tsx` — bloc analytics (dataLayer/gtag/fbq, scroll depth, sticky CTA) extrait
   dans `src/hooks/events/useEventAnalytics.ts`, mapping de statut migré vers le helper partagé.

### 3.4 Supprimer les 2 accès DB directs restants dans l'UI — fait

- `src/app/preferences/page.tsx` : extrait vers `src/lib/preferences/profile.ts`
  (`getMarketingPreferencesProfile`).
- `src/app/events/[id]/layout.tsx` : extrait vers `src/lib/events/eventMeta.ts` (`fetchEventMeta`),
  enveloppé dans `React.cache()` pour dédupliquer l'appel entre `generateMetadata` et le rendu du
  layout (1 seul aller-retour Supabase par requête au lieu de 2).

### 3.5 Réduire les `any` — fait (les 2 fichiers prioritaires)

`src/app/api/admin/registrations/route.ts` (27→0) et `src/app/api/registrations/create/route.ts`
(7→0) : interfaces explicites pour la ligne RPC, les relations Supabase (event/ticket/order en
array-ou-objet), et les maps intermédiaires, au lieu de `any`. Comportement identique, `tsc
--noEmit` et suite de tests complète passants après chaque fichier. Fichiers moins critiques
(structured data SEO, tests) non traités — hors scope de cette passe.
(SEO structured data, tests).

---

## 4. Priorité 3 — tests — DONE (2026-09-16)

Suivre `docs/quality/testing-strategy.md` (TDD, un test succès + un test échec par use-case). Les 5
sous-sections ci-dessous sont toutes traitées :

1. **`src/lib/groups/resolveGroupAnchor.ts`** — fait. `resolveGroupAnchor.test.ts` (4 tests) :
   sélection du premier OPEN (skip RANKED), retour null si aucun OPEN, relation ticket/race en array
   vs objet, propagation d'erreur DB.
2. **`src/lib/email.ts`** (`sendTicketEmail`, `sendReceiptEmail`) — fait. `email.test.ts` (9 tests).
   Gap réel identifié (non corrigé, hors scope tests) : ni l'une ni l'autre fonction ne vérifie
   `result.error` après l'appel Resend — un échec Resend (destinataire invalide, rate limit) est
   silencieusement absorbé si l'appelant ne le vérifie pas lui-même.
3. **Tests d'intégration `registrations/create`, `webhooks/stripe`, `checkin`** — fait, les 3.
   `checkin` (9 tests) : auth/rôle, 404/409 selon état, succès checkin/undo, échec update.
   `webhooks/stripe` (8 tests) : signature invalide, création complète (RANKED), idempotence
   (registration existante + race 23505 sur orders), métadonnées manquantes, flow multi, event type
   non géré, échec insert registration.
   `registrations/create` (8 tests) : validation, signature/décharge manquante, mismatch auth,
   idempotence 409, PaymentIntent non confirmé/pending, succès (commande gratuite + Stripe payé).
4. **`src/lib/ambassadors/rewardsNotifications.ts`, `email.ts`** — fait (14 tests à eux deux).
   Gap identifié (non corrigé) : `rewardsNotifications.ts` caste `(ambassador as any)?.promo` —
   `any` non couvert par la passe §3.5 (qui ciblait spécifiquement les 2 routes au plus fort taux).
5. **Couche email phase 3/4** — fait : `emailLogs.ts`, `engagement.ts`, `eventOpenings.ts`,
   `eventUpdates.ts`, `marketing.ts`, `reactivation.ts`, `adminDigest.ts` (54 tests à eux sept).
   Gap identifié (non corrigé) : `marketing.ts::filterRecipientsByDigestFrequency` envoie à
   **tout le monde** par défaut si la lecture de `notification_preferences` échoue ("backward
   compatibility"), donc une panne de cette table désactive silencieusement le filtrage plutôt que
   de bloquer l'envoi.

**Total** : ~100 tests ajoutés cette session, suite complète passant à 475 tests (0 régression),
`tsc --noEmit` clean.

---

## 5. Priorité 4 — funnel d'acquisition (impact business, pas urgence technique)

### 5.1 Découpler le tracking analytics du chargement des pixels — hors scope (arbitrage produit)

**Problème** : `AnalyticsScripts.tsx` ne charge Meta Pixel/GA4/GTM qu'après consentement explicite —
conforme RGPD, mais signifie qu'un visiteur qui n'accepte pas ne génère aucun signal de conversion
pour l'optimisation publicitaire.

**Non traité par une IA en autonomie** : explicitement marqué dans ce FDR comme nécessitant une
validation du responsable marketing avant implémentation (choix d'un "consent mode" dégradé
Google/Meta). Reste à faire par un humain avec ce mandat.

### 5.2 Ajouter la capture et propagation UTM — fait (2026-09-16)

`src/lib/attribution/utm.ts` capture `utm_source/medium/campaign/term/content` depuis l'URL
d'entrée dans `localStorage` (last-touch, expiration 30 jours), monté sans dépendre du consentement
analytics (donnée first-party, aucun cookie tiers). Propagé jusqu'au PaymentIntent Stripe (`metadata.utm_params`)
et au `freeOrderMetadata` pour les commandes gratuites, même mécanisme que `fbp`/`fbc` déjà en place.

### 5.3 Remplacer `<img>` par `next/image` dans le funnel critique — fait (2026-09-16)

Converti les 4 images de fond/hero de la landing Ultra Arena (assets statiques locaux) :
`UltraArenaHero.tsx`, `UltraArenaComeTogether.tsx`, `UltraArenaFormats.tsx`, `UltraArenaProjection.tsx`
(background uniquement). Laissés en `<img>` : `event.image_url` (`events/[id]/page.tsx`) et la
galerie de `UltraArenaProjection.tsx`, qui peuvent porter des URLs externes hors de l'allowlist
`images.remotePatterns` de `next.config.ts` (actuellement seulement `images.unsplash.com`) —
convertir ces deux-là planterait au runtime pour toute autre source d'image.

### 5.4 Vérifier le processus opérationnel de bascule de statut événement — hors scope (process humain)

S'assurer qu'il existe une checklist ou une alerte pour basculer `event.status` vers
`completed`/`closed` en cohérence avec l'arrêt des campagnes publicitaires actives — actuellement
un processus manuel sans garde-fou technique. Ce n'est pas une tâche de code, mais une procédure
opérationnelle à mettre en place par l'utilisateur.

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
