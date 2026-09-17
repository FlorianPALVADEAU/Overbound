---
title: "Audit technique complet — Overbound"
date: 2026-09-15
author: "Claude (audit assisté, 4 sous-agents parallèles + synthèse)"
scope: "Code réel du repo (pas la doc théorique) — architecture, composants, sécurité, RGPD, logique métier, tests, scalabilité, funnel d'acquisition"
status: "Draft — à relire, non validé par un tiers"
---

# Audit technique complet — Overbound

## 0. Préambule : la documentation ment sur le produit

`CLAUDE.md`, `docs/product/vision.md` et `docs/architecture/overview.md` décrivent un
**"CRM léger pour piloter les partenariats"** avec une **architecture hexagonale stricte**
(`domain/`, `application/`, `infrastructure/`, `presentation/`).

Ce produit n'existe pas dans le code. Le repo réel est un **site événementiel public complet** :
catalogue d'événements/courses, inscription multi-étapes avec paiement Stripe, gestion de groupes
avec ancrage de vague, programme ambassadeur, back-office admin, check-in bénévoles le jour J,
système d'emails RGPD à 4 phases, blog, bootcamps, volontariat. Il n'y a pas de domaine "partenaires"
fonctionnel — seulement une page marketing statique de logos sponsors (`src/datas/Partners.ts`).

`ADR-0004-architecture-reality-vs-hexagonal-theory.md` est le seul document qui reconnaît cet
écart honnêtement. Tous les autres documents (`vision.md`, `overview.md`, `engineering.md` dans ses
conventions de nommage de hooks) décrivent une cible qui n'a jamais été implémentée et qui induit en
erreur quiconque (humain ou IA) s'appuie dessus pour comprendre le projet.

**Action prise dans cet audit** : la mise à jour de `CLAUDE.md` (livrée séparément) reflète désormais
le produit réel. Ce rapport analyse le code tel qu'il existe.

---

## 1. Architecture & découpage des composants

### 1.1 Structure globale

`src/` a 20+ dossiers de premier niveau (`app`, `components`, `lib`, `hooks`, `store`, `types`,
`constants`, `emails`, `middlewares`, `utils`, `datas`, `sanity`). Organisation par domaine
technique/fonctionnel dans `src/lib/{domain}` (openSas, groups, ambassadors, email, pricing…),
sans séparation hexagonale. C'est cohérent avec ADR-0004, pas avec `overview.md`.

### 1.2 Fichiers surdimensionnés (top offenders)

| Lignes | Fichier | Problème |
|---|---|---|
| 1107 | `src/app/races/[id]/page.tsx` | Composant client qui définit son propre mapping de statuts métier, fait un `fetch` inline, et rend >1000 lignes de JSX sans extraction |
| 997 | `src/app/volunteers/page.tsx` | — |
| 981 | `src/components/ambassadors/AmbassadorDashboard.tsx` | Importe de la logique métier (`claimAmbassadorReward`) depuis `@/app/api/...` — couplage inversé UI→API — et calcule/rend tout dans un seul fichier |
| 783 | `src/app/events/[id]/page.tsx` | Orchestrateur de la page événement, porte le fetch + état + logique du formulaire "événement terminé" |
| 774 | `src/components/admin/registrations/RegistrationsSection.tsx` | Contient un sous-composant `UpsellSummaryPanel` avec son propre `fetch` caché dans le fichier |
| 667 | `src/components/admin/ambassadors/AmbassadorsSection.tsx` | 9 `useState` locaux dupliquant un pattern de filtre/pagination déjà présent ailleurs |
| 657 | `src/components/admin/VolunteerCheckin.tsx` | — |
| 639 | `src/components/registration/MultiStepEventRegistration.tsx` | Seul endroit du repo où les hooks sont correctement extraits (`src/hooks/registration/*`) |
| 524 | `src/components/admin/groups/GroupsSection.tsx` | — |
| 518 | `src/components/admin/logs/AdminLogsSection.tsx` | — |
| 517 | `src/components/admin/events/EventsSection.tsx` | — |

Violation systématique de la règle CLAUDE.md "pas de logique métier dans les composants UI" et de
`engineering.md` ("*Dashboard orchestre, ne concentre pas tout le rendu").

### 1.3 Conventions documentées mais jamais appliquées

- **Hooks `use-<feature>-form` / `use-<feature>-quick-*`** : convention kebab-case **totalement
  absente**. Tous les hooks du repo suivent le camelCase standard React (`useParticipants.ts`,
  `usePromoCode.ts`, `useAuthFlow.ts`...). La doc décrit une norme qui n'a jamais existé dans le code.
- **`shared/presentation/*`** : dossier inexistant. Zéro mutualisation des badges de statut, formatage
  de dates, etc. — chaque domaine (races, registrations, ambassadors, groups) réimplémente sa propre
  logique de couleur/label de statut indépendamment.
- **Duplication explicitement anticipée par le CLAUDE.md ("mutualiser entre partners et ambassadors")**
  : partners n'existe pas comme domaine actif, mais la duplication réelle existe ailleurs — entre
  `RegistrationsSection`, `AmbassadorsSection`, `GroupsSection`, qui répliquent chacun indépendamment
  le même triptyque state (search/filter/pagination) sans hook partagé.

**Point positif isolé** : `src/hooks/registration/*` (participants, ticket selections, promo code,
pricing, upsells, payment intent) est correctement découpé par responsabilité — probablement parce
que la taille de `MultiStepEventRegistration.tsx` l'a rendu nécessaire. C'est le seul endroit du repo
qui applique l'esprit (pas la lettre) de la convention documentée. À généraliser.

De même, `src/components/events/ultra-arena/` (12 fichiers, ~1764 lignes, découpé par section de
landing page) est un bon exemple de composants de présentation purs — `UltraArenaEventOver.tsx`
(le fichier ouvert dans l'IDE au moment de la demande) reçoit tout par props, n'a aucun accès
réseau, et n'a qu'un état local trivial (`showForm`). C'est l'exception, pas la norme.

### 1.4 État global

Deux stores Zustand seulement (`useRegistrationStore`, `useAdminDashboardStore`), bien scopés,
utilisés dans 6 fichiers au total. Tout le reste de l'état applicatif complexe (filtres admin,
dialogs, pagination) repose sur des `useState` locaux dispersés, combinés de façon incohérente
avec React Query par endroits. Pas de stratégie d'état unifiée.

### 1.5 Typage

**242 occurrences de `any`** dans `src/` alors que CLAUDE.md l'interdit explicitement. Concentration
sur des routes API critiques :
- `src/app/api/admin/registrations/route.ts` — 27 occurrences
- `src/app/api/admin/users/[id]/route.ts` — 9
- `src/app/api/registrations/create/route.ts` — 7 (route de paiement)
- `src/lib/registration.ts` — `Record<string, any>` sur les métadonnées d'upsells

### 1.6 Accès DB direct depuis l'UI (violation explicite CLAUDE.md)

Deux violations concrètes et non ambiguës :
- **`src/app/preferences/page.tsx`** — appel direct `supabase.from('profiles')...` dans le composant
  de page, au lieu de passer par `src/lib/`.
- **`src/app/events/[id]/layout.tsx`** — `fetchEventMeta` fait un `supabase.from('events')...`
  directement dans le layout, utilisé à la fois pour `generateMetadata` et le rendu. **Effet de bord** :
  cet appel est dupliqué deux fois par requête (voir §5.1, problème de performance funnel).

Aucune règle de lint n'existe pour empêcher cette classe d'erreur (pas d'ESLint custom rule malgré
la suggestion dans ADR-0004).

---

## 2. Sécurité, RLS et RGPD

### 2.1 CRITIQUE — déjà traité pendant cet audit

Un **dump complet de production** (table `auth.users` avec emails, mots de passe hashés, tokens de
recovery/session, plus toutes les tables `public`) a été commité dans l'historique git le 15 juillet
2026 (commit `e2bf6e8`), resté présent sur `main` jusqu'à ce jour. Cause racine : un pattern
`.gitignore` cassé (`./supabase/.db-dumps/*` avec préfixe `./`, qui ne matche rien en syntaxe
gitignore).

**Remédiation effectuée dans cette session** :
- `.gitignore` corrigé (patterns fonctionnels).
- Historique réécrit avec `git-filter-repo`, backup complet du repo pris avant l'opération.
- `origin/main` force-pushé avec l'historique nettoyé — vérifié : plus aucune trace du dump.
- Repo confirmé **privé**, donc pas de fuite publique active, mais tout collaborateur ayant eu accès
  au repo entre le 15 juillet et le 15 septembre 2026 a pu voir ces données.

**Reste à faire (hors scope de cette session, action utilisateur)** :
- Rotation/invalidation des sessions Supabase actives et des tokens de recovery, par prudence.
- Vérifier qu'aucun autre clone du repo (poste, CI, autre machine) ne garde l'ancien historique.
- Informer les collaborateurs ayant eu accès au repo si pertinent.

### 2.2 Élevé

- **RLS activée tardivement sur 5 tables** : `supabase/migrations/20260803_enable_rls_missing_tables.sql`
  (non commité au moment de l'audit) montre que `ambassador_manual_referrals`,
  `ambassador_promotional_codes`, `event_departure_reschedule_backups`, `event_waves`,
  `registration_upsells` étaient exposées sans RLS jusqu'à début août 2026. La migration doit être
  commitée pour que l'état de la base de prod soit reproductible depuis git — actuellement il y a un
  écart entre l'état réel de la prod et l'historique versionné.
- **Policies `USING (true)` en lecture** sur `promotional_codes`, `promotional_code_usage`,
  `promotional_code_events`, `upsells`, `event_price_tiers`. Légitime pour du catalogue public
  (events, tickets, obstacles), plus discutable pour `promotional_code_usage` qui peut permettre
  l'énumération de tous les codes promo actifs et leur taux d'usage via la clé anon. **À vérifier** :
  colonnes exposées (présence de `user_id`/`email` lisible publiquement ?).
- **Idempotence webhook Stripe** : vérification applicative (`SELECT` puis `INSERT` si absent) sur
  `stripe_payment_intent_id`, mais **pas de contrainte UNIQUE en base**. Fenêtre de race étroite mais
  réelle en cas de double livraison webhook Stripe.
- **Aucun rate limiting** détecté sur les routes sensibles : `/api/unsubscribe`,
  `/api/promotions/validate` (énumération de codes promo), `/api/registrations/create`,
  `/api/auth/account-exists` (énumération de comptes par email), `/api/checkin`.

### 2.3 Moyen

- **Validation Zod très partielle** : seulement 20 fichiers `route.ts` sur 118 l'utilisent. Routes
  sensibles sans validation runtime : `registrations/create` (inscription payante, ~950 lignes,
  body typé par simple cast TypeScript), `checkin`, `promotions/validate`, `ambassadors/dashboard`,
  `ambassadors/rewards/claim`, `admin/users`, `admin/promotional-codes`, `admin/groups`, `groups`.
  Contredit directement la règle CLAUDE.md "Zod aux frontières d'entrée".
- **Vérification auth/rôle dupliquée sans middleware centralisé** : le pattern `getUser()` +
  `SELECT role FROM profiles` + comparaison manuelle est copié-collé dans chaque route admin plutôt
  que factorisé. `src/middlewares/adminMiddlewares.ts` existe mais est **vide (0 octet)**. Le
  middleware Next.js protège les pages `/admin/*` mais explicitement pas les routes `/api/*` — chaque
  route API est individuellement responsable, sans filet structurel.
- **Consentement cookies "maison"** : bannière bloquante correcte (pas de dépôt avant consentement
  explicite — conforme CNIL sur ce point précis), mais stockage `localStorage` uniquement (pas de
  preuve de consentement horodatée côté serveur pour un audit CNIL), pas d'expiration/re-consentement
  périodique, granularité unique "analytics" alors que GA4/GTM/Meta Pixel sont 3 traceurs distincts.
- **Token unsubscribe** : HMAC-SHA256 bien conçu, expiration 90 jours correcte, mais comparaison de
  signature en `!==` standard plutôt que `crypto.timingSafeEqual` (faiblesse théorique mineure,
  timing attack).
- **DSAR / droit à l'oubli** : purement manuel (email à `contact@overbound-race.com`, traitement
  admin sous 30 jours). Conforme légalement mais pas de self-service — charge opérationnelle qui
  montera avec le volume.

### 2.4 Faible / points positifs

- Service role key : usage confirmé strictement server-side (3 fichiers, jamais dans un composant
  client ni préfixé `NEXT_PUBLIC_`).
- Logs contenant des identifiants/emails isolés dans quelques routes (webhook Stripe, création
  registration) — pas de fuite massive d'objets complets, mais pas de politique de rétention documentée
  côté plateforme d'hébergement.
- Signature webhook Stripe (`stripe.webhooks.constructEvent`) correctement implémentée.

---

## 3. Logique métier, tests, scalabilité

### 3.1 CRITIQUE — RPC métier non versionnées

**Aucune migration versionnée** ne définit `assign_open_wave_to_registration`,
`award_ambassador_points_for_order`, `sync_open_group_wave`, `increment_promo_code_usage`, etc.
`docs/guides/rpc-reference.md` le confirme lui-même. Ces fonctions n'existent que dans un dump
statique de la base de prod (`supabase/.db-dumps/prod-schema.sql`), pas dans du code rejouable.

**Conséquences concrètes** :
- Impossible de reconstruire l'environnement de prod depuis le repo seul.
- Aucune revue de code n'a jamais pu être faite sur ces fonctions avant déploiement.
- Tout changement de comportement métier critique (calcul de vague, points ambassadeur) est invisible
  en `git log`/`git diff` — c'est un angle mort total sur l'auditabilité du système le plus critique
  du produit.

À 3 jours de l'événement du 12 septembre, c'est le risque le plus élevé de tout l'audit : la seule
source de vérité du comportement réel de wave assignment est un fichier statique non versionné.

### 3.2 Élevé

- **Race condition confirmée, mais seulement sur le chemin "groupe"** : la RPC individuelle
  `assign_open_wave_to_registration` est correctement atomique
  (`FOR UPDATE SKIP LOCKED` + `UPDATE...RETURNING` en un seul statement, vérifié dans le dump prod).
  Mais dans `src/app/api/registrations/create/route.ts` (lignes ~621-647), le chemin "2e+ membre
  d'un groupe déjà ancré" **contourne la RPC** avec un read-then-write en deux requêtes séparées
  (`SELECT assigned_count` puis `UPDATE` calculé côté JS), sans lock ni transaction. Deux inscriptions
  de groupe concurrentes sur la même vague ancrée peuvent produire un **sous-comptage silencieux**
  de `event_waves.assigned_count`. Même pattern dans `src/lib/groups/syncOpenGroupWave.ts`.
- **Check-in sans lock** : `src/app/api/checkin/route.ts` fait lecture de `checked_in` puis `UPDATE`
  séparé — risque de double-scan accepté en cas de scan quasi simultané. Impact limité mais aucun
  test, aucune contrainte DB de filet.
- **Scripts SQL non trackés potentiellement dangereux s'ils sont rejoués** : `scripts/sql/*.sql`
  (non commités). Le seul lu en détail (`assign_open_1200_sas_by_emails.sql`) a un garde-fou
  dry-run par défaut et respecte l'ancrage de groupe — bien conçu, mais **aucune protection contre
  un rejeu après check-in** (pourrait réassigner la vague de quelqu'un déjà check-in). Les 3 autres
  scripts n'ont pas été audités en détail — à faire avant le jour J.
- **Couverture de tests avec trous critiques** : aucun test pour `src/lib/email.ts` (573 lignes,
  envoi de billets/reçus), `src/lib/groups/resolveGroupAnchor.ts` (logique d'ancrage — pourtant
  signalée comme piège dans le CLAUDE.md lui-même), les notifications ambassadeur, toute la couche
  "phase 3/4" du système email. Aucun test d'intégration sur les 3 points d'entrée les plus critiques
  du jour J : `registrations/create`, `webhooks/stripe`, `checkin`.
- **Pas de transaction englobante** sur le flux création registration → assignation vague → points
  ambassadeur → emails. Si l'assignation de vague échoue après création de la registration, l'erreur
  est catchée et re-throw, mais **la registration existe déjà en base sans vague** — pas de rollback
  ni de compensation automatique.
- **Webhook Stripe attend les emails de façon bloquante et séquentielle** (contrairement à
  `registrations/create` qui parallélise en `Promise.allSettled`) — si Resend est lent, risque de
  dépasser le timeout Stripe et provoquer un retry Stripe (double envoi d'email possible, mitigé côté
  registration dupliquée par le check `existingReg`).

### 3.3 Moyen

- **Duplication de logique entre `registrations/create/route.ts` (995 lignes) et
  `webhooks/stripe/route.ts` (648 lignes)** : calcul de prix, gestion promo codes, attribution
  ambassadeur, construction des emails — largement copié-collé plutôt que factorisé dans `src/lib/`.
  Risque de divergence silencieuse entre le flux synchrone et le flux webhook à chaque évolution
  d'une règle métier.
- **`ambassadors/dashboard/route.ts`** : 545 lignes dans une seule fonction `GET`, alors que le
  fichier de requêtes dédié ne fait que 28 lignes — logique d'agrégation restée inline.
- **Bon exemple à l'inverse** : `groups/join/route.ts` délègue proprement à
  `resolveGroupAnchorFromProfile` et `syncOpenRegistrationsToWave` — respecte la séparation.
- **Règle promo LUOFF30/JUOFF50** : contrairement à la crainte initiale, **bien implémentée** —
  nommée explicitement (`NON_CUMULABLE_WITH_TIER_CODES`), testée avec cas succès et échec. Seule
  dette mineure : liste en dur plutôt qu'un champ DB, donc un 3e code nécessite un déploiement.
- **Check-in sans pagination** sur le `GET` de liste (`checkin/route.ts`) — risque de dégradation
  de perf avec potentiellement des milliers de registrations par événement le jour J, bien que
  l'index sur `qr_code_token` (UNIQUE) garantisse que le lookup individuel scale bien.
- **Dépendances externes sans timeout explicite** (Resend, Meta CAPI) — mitigé par l'usage de
  `Promise.allSettled` dans `registrations/create`, mais pas dans le webhook Stripe (voir 3.2).
  Aucun appel OpenAI trouvé dans le code malgré la mention dans CLAUDE.md — fonctionnalité IA soit
  non implémentée, soit hors de ce repo.

---

## 4. Funnel d'acquisition et conversion

### 4.1 Impact fort

- **Tracking Meta Pixel/GA4/GTM entièrement bloqué tant que le consentement analytics n'est pas
  donné** (`src/components/consent/AnalyticsScripts.tsx`) : le composant ne charge aucun script tant
  que `hasConsent` (défaut `false`) n'est pas vrai. Pour tout visiteur qui n'accepte pas explicitement
  (typiquement 40-60% en UE), **aucun événement de conversion n'est envoyé à Meta**. Le code de
  tracking lui-même est bien fait (ViewContent, AddToCart, InitiateCheckout), mais l'algorithme Meta
  Ads optimise sur un échantillon biaisé — dégradation directe du coût d'acquisition sur les
  campagnes actives.
- **Double fetch Supabase non mutualisé** sur `events/[id]/layout.tsx` — `fetchEventMeta` appelé
  indépendamment dans `generateMetadata` et dans le composant layout ; comme c'est un appel Supabase
  direct (pas `fetch()` natif), le request memoization de Next.js ne le déduplique pas. Latence
  ajoutée sur la page la plus visitée depuis les pubs.
- **Aucune capture ni propagation UTM** trouvée dans le code (recherche exhaustive). Sur un événement
  avec budget pub Meta actif, c'est un angle mort total sur l'attribution par campagne/creative.
- **`<img>` natif au lieu de `next/image`** dans tout le funnel critique (page événement, landing
  Ultra Arena) — pénalise le LCP sur mobile, la majorité du trafic pub Instagram/Facebook.

### 4.2 Impact moyen

- Funnel d'inscription long mais avec bonne sauvegarde de progression (Zustand persisté,
  `hasHydrated`). Friction réelle : signature électronique + acceptation d'un règlement long +
  décharge de responsabilité, 3 conditions bloquantes cumulées avant paiement — nécessaire
  juridiquement (sport à risque) mais probable point d'abandon mobile vu la longueur du texte.
- Politique de non-remboursement affichée seulement via tooltip au survol dans le récap de paiement
  — un tooltip hover ne fonctionne pas nativement au tap sur mobile, risque de dispute post-achat
  plutôt que d'abandon en amont.
- Bascule automatique vers l'écran "événement terminé" (`UltraArenaEventOver.tsx`) correcte mais
  dépend à 100% d'un champ `status` mis à jour manuellement en base — si une pub reste active après
  la bascule tardive du statut, la landing de vente continue de s'afficher normalement.
- Popup de capture de leads bien conçue (anti-spam, rate limit), mais pas de flux de nurture dédié
  identifié pour convertir un lead popup en acheteur (contrairement à l'abandon de panier, qui a
  bien un système de relance : `AbandonedCheckoutEmail`, cron reminders).

### 4.3 Impact faible / points positifs

- Layout mobile-first correct sur le paiement et l'inscription (grille one-column par défaut,
  sidebar sticky seulement en desktop).
- Programme ambassadeur avec Web Share API native + fallback clipboard — bon pattern mobile.
- SEO globalement solide côté serveur : metadata complète, JSON-LD (Organization, Event, FAQPage,
  BlogPosting, Breadcrumb), sitemap, robots.txt, désindexation correcte des events `draft`/`cancelled`.

---

## 5. Synthèse et note globale

### 5.1 Grille de notation

| Axe | Note /20 | Justification courte |
|---|---|---|
| Architecture & découpage | 9 | Conventions documentées jamais appliquées, fichiers >900 lignes, duplication de pattern, mais quelques exceptions solides (hooks registration, ultra-arena) |
| Sécurité & RLS | 10 | Fuite historique critique déjà traitée, RLS globalement présente mais tardive sur 5 tables, pas de rate limiting, validation Zod partielle |
| RGPD | 12 | Bannière consentement conforme sur le principe, pages légales présentes, DSAR fonctionnel mais manuel, quelques trous de preuve d'audit |
| Logique métier & fiabilité | 8 | RPC critiques non versionnées (risque majeur), race condition confirmée sur un chemin réel, duplication entre 2 points d'entrée de paiement |
| Tests | 7 | Bons tests sur les modules "faciles" (pricing, slot assignment), zéro test sur email, ancrage de groupe, et les 3 routes les plus critiques du jour J |
| Scalabilité jour J | 11 | Index corrects sur les points chauds (QR code, event_id), mais pas de pagination sur le listing check-in, RPC individuelle bien conçue (atomique) |
| Funnel & acquisition | 10 | Tracking pub cassé par le consentement bloquant, pas d'UTM, mais fondations SEO et mobile-first solides |
| Documentation & cohérence | 6 | La doc "produit" ment sur ce qu'est le projet — coût de confusion élevé pour toute reprise future, humaine ou IA |

### **Note globale : 38/100**

Ce n'est pas un jugement sur la vitesse d'exécution (le produit est fonctionnellement riche et
manifestement livré vite, sous forte contrainte de délai avec un événement daté). C'est un jugement
sur la **maintenabilité et la résilience** telles que demandées : dette concentrée sur exactement les
points qui rendent une reprise par une autre IA ou par vous-même dans 6 mois coûteuse et risquée —
documentation trompeuse, logique dupliquée entre points d'entrée jumeaux, RPC invisibles en git,
composants god-object, et un incident de sécurité qui dormait depuis 2 mois.

Le score n'inclut pas de indulgence de circonstance ; si l'objectif prioritaire est de passer le
12 septembre sans incident, se concentrer sur §3.1 (RPC non versionnées) et §3.2 (race condition
groupe) avant tout le reste — ce sont les deux seuls points qui peuvent créer un incident visible
par les participants le jour J.

---

## 6. Recommandations priorisées (au-delà du FDR)

1. **Avant le 12 septembre** : extraire et commiter en migrations SQL versionnées les RPC critiques
   (`assign_open_wave_to_registration`, `award_ambassador_points_for_order`, `sync_open_group_wave`,
   `increment_promo_code_usage`) depuis le dump de prod. Sans ça, aucune correction de bug en urgence
   le jour J ne pourra être revue ni testée avant application.
2. **Avant le 12 septembre** : corriger le chemin groupe non atomique dans
   `registrations/create/route.ts` (le faire passer par la RPC ou ajouter un lock explicite).
3. **Avant le 12 septembre** : auditer en détail les 3 scripts SQL non encore lus
   (`transfer_ranked_to_open_by_emails.sql`, `seed_afternoon_open_waves.sql`,
   `set_event_capacity_355.sql`) pour vérifier qu'ils ont le même garde-fou dry-run et une protection
   contre le rejeu post-check-in.
4. **Post-événement, avant toute nouvelle feature** : mettre à jour la documentation produit/architecture
   pour refléter la réalité (fait pour CLAUDE.md dans cette session — `vision.md` et
   `overview.md` restent à corriger ou supprimer).
5. **Post-événement** : traiter le FDR ci-joint (`docs/fdr/FDR-0009-maintainability-refactor.md`) qui
   détaille le plan de refactoring structurel.
