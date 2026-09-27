# FDR-0014 — Lucky Wheel (roue de la chance)

- **Statut** : Proposed
- **Date** : 2026-09-20
- **Owner produit** : à désigner
- **Owner technique** : à désigner
- **Périmètre** : nouveau domaine — mécanisme de conversion par roue de la chance (capture email,
  tirage server-side, récompense appliquée au checkout), admin dédiée, emails, analytics.
- **Dépendances** : [FDR-0006](./FDR-0006-ambassador-program-points-and-rewards.md) (pattern points/récompenses
  proche, réutiliser le vocabulaire "reward"/"claim"), [FDR-0007](./FDR-0007-email-distribution-and-preferences.md)
  (email lifecycle, opt-in marketing distinct de la capture), [FDR-0009 §1.1/§1.2](./FDR-0009-maintainability-refactor.md)
  (RPC versionnées, verrouillage explicite obligatoire — précédent direct à ne pas reproduire),
  [FDR-0010](./FDR-0010-ticket-financial-correction-policy.md) (politique financière des remises billet),
  [docs/security/rate-limiting.md](../security/rate-limiting.md) (contrainte 1 règle Firewall, plan Hobby)
- **Source** : spec produit fournie par l'utilisateur (`overbound-lucky-wheel-spec.md`), reprise ici
  adaptée à l'architecture réelle du repo (voir [ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md)
  et [AUDIT-2026-09-15](../audit/AUDIT-2026-09-15-full-codebase-review.md)).

> Périmètre V1 de cette FDR = §22 de la spec source en intégral. Les phases commerciales dynamiques
> avancées et l'A/B experimentation restent hors scope V1 (spec §8 reste documentée comme cible, mais
> l'implémentation V1 ne couvre que LAUNCH/STANDARD/HIGH_DEMAND en configuration manuelle, pas en bascule
> automatique par cron).

---

## 0. Guide de reprise autonome

1. Lire cette FDR en entier avant de coder. Elle est dense — ne pas sauter aux sections
   Implémentation sans lire §3 (concurrence) et §6 (anti-abus), qui contraignent tout le reste.
2. Lire [FDR-0009 §1.2](./FDR-0009-maintainability-refactor.md) — le repo a **déjà** un précédent de
   race condition sur un chemin non atomique (groupe ancré). Ne pas répéter cette erreur ici : le tirage
   de récompense avec stock limité est structurellement le même problème que l'assignation de SAS
   (§4 de FDR-0012). Le tirage **doit** passer par une RPC PostgreSQL avec verrouillage de ligne
   explicite dès le premier commit, jamais un `SELECT` puis `UPDATE` séparé côté application.
3. Toute RPC créée pour cette feature est **versionnée dans `supabase/migrations/`** dès l'écriture —
   pas de fonction ajoutée seulement en base puis rétro-documentée (c'est précisément le problème
   identifié en FDR-0009 §1.1 pour les RPC existantes).
4. Ce domaine est nouveau (pas de code existant à étendre) : suivre le découpage `src/lib/luckyWheel/*`
   pour la logique métier, `src/app/api/lucky-wheel/*` (public) et `src/app/api/admin/lucky-wheel/*`
   (admin) pour les routes, `src/components/lucky-wheel/*` (widget public) et
   `src/components/admin/lucky-wheel/*` (admin), sur le modèle de `src/lib/ambassadors/*` +
   `src/app/api/ambassadors/*` (domaine le plus proche par la forme : points, récompenses, claim).
5. Ne jamais faire confiance au frontend pour le résultat du tirage, l'inventaire restant, ou le
   temps restant avant expiration — voir §3 et §5. C'est répété plusieurs fois dans cette FDR parce
   que c'est la règle la plus facile à violer par accident (ex : un compte à rebours qui recalcule
   `expiresAt` côté client au lieu de l'afficher tel quel).
6. Cette feature ne remplace ni ne modifie `promotional_codes` (programme codes promo existant) ni
   `ambassador_promotional_codes`. Une récompense de type remise génère un code promo **dédié à
   l'allocation**, à usage unique, jamais un code réutilisable du catalogue existant. Ne pas coupler
   les deux systèmes au-delà de la réutilisation du mécanisme d'application au checkout (§7).

## 1. Besoin métier

Reprend spec source §1 telle quelle : mécanisme de conversion (pas de remise), objectif = augmenter
visiteur → participant et revenu par participant, réduire dépendance aux campagnes de remise publiques
larges, protéger le prix moyen du billet. Priorité aux récompenses à forte valeur perçue et faible coût
marginal (patch, avantage photo) plutôt qu'à la remise billet directe. Voir spec §1, §4, §21 pour le
détail des principes produit — non reproduit ici, cette FDR y renvoie directement plutôt que de
dupliquer.

## 2. Décision fonctionnelle

**DECISION** — Le tirage de récompense est **entièrement server-side**. Le frontend anime une roue dont
le résultat final est déterminé avant le début de l'animation ; il ne calcule jamais lui-même quelle
case gagner.

**DECISION** — Une participation est liée à un email, une campagne, et une allocation de récompense
(`RewardAllocation`), sur le modèle `WheelEntry` de la spec §15. Une seule participation par email par
campagne active (règle de base, §6).

**DECISION** — Le stock/inventaire de chaque récompense est décrémenté de façon atomique dans la même
transaction que la création de l'allocation, via RPC PostgreSQL verrouillée — jamais en lecture-puis-
écriture séparée côté application (voir §3).

**DECISION** — Les récompenses de type remise (`TICKET_PERCENT_DISCOUNT`, `TICKET_FIXED_DISCOUNT`,
`PRODUCT_DISCOUNT`, `PHOTO_DISCOUNT`) génèrent un **code promo dédié à l'allocation**, à usage unique,
appliqué automatiquement au checkout quand la session/email correspond, jamais un code du catalogue
`promotional_codes` réutilisable partagé. Les récompenses de type billet gratuit (`FREE_TICKET`)
consomment un mécanisme équivalent à une remise 100% avec plafond au prix du billet (pas de virement,
pas de génération de billet hors flux Stripe standard).

**DECISION** — Les phases commerciales (`LAUNCH`, `STANDARD`, `HIGH_DEMAND`) sont configurées
manuellement par l'admin en V1 (spec §22 point 1-2 : "Campaign configuration", "Configurable rewards").
La bascule *automatique* par règle (`remainingTickets <= 50 || daysBeforeEvent <= 30`) est **hors
scope V1** — seule la config manuelle de la phase active et de ses règles d'éligibilité par récompense
est livrée. Voir spec §22 dernière ligne : "Dynamic commercial phases [...] can be introduced
progressively after the core conversion loop is reliable."

**DECISION Q-1 (validé par le produit, 2026-09-20)** — Une campagne peut cibler **plusieurs
événements**. `lucky_wheel_campaigns` n'a pas de `event_id` unique : table de jonction
`lucky_wheel_campaign_events (campaign_id, event_id)` à la place. Une récompense de type
`FREE_TICKET`/`TICKET_PERCENT_DISCOUNT`/`TICKET_FIXED_DISCOUNT` doit préciser à quel(s) événement(s) de
la campagne elle s'applique au moment de la rédemption (le code promo dédié généré en §7 est scopé à un
`event_id` précis choisi par l'utilisateur au checkout, pas à toute la campagne). Voir §4 pour le schéma
révisé.

**DECISION Q-2 (validé par le produit, 2026-09-20)** — Toute récompense reste inutilisable tant qu'aucune
commande n'est passée. Le code promo dédié ne s'applique qu'au panier d'une commande Stripe existante ;
il n'existe pas de flux de retrait "récompense seule" sans achat, y compris pour `FREE_PRODUCT`/
`FREE_PHOTO_PACK` (patch, pack photo) — ces récompenses sont livrées/débloquées uniquement en marge d'un
achat de billet, jamais en retrait indépendant.

## 3. Concurrence et intégrité de l'inventaire

Point le plus sensible, identique en nature au problème déjà documenté en FDR-0009 §1.2 et traité en
FDR-0012 §4 pour les SAS : plusieurs utilisateurs peuvent spinner simultanément sur une récompense à
stock quasi épuisé (ex : jackpot `FREE_OPEN_TICKET`, `maxWins: 1`).

**REQUIREMENT** — Le tirage passe par une RPC unique avec verrouillage de ligne explicite :

```sql
CREATE FUNCTION lucky_wheel_spin(
  p_campaign_id uuid,
  p_wheel_entry_id uuid
) RETURNS json
```

Comportement transactionnel :

1. Verrouiller les lignes `lucky_wheel_rewards` éligibles pour cette campagne (`SELECT ... FOR UPDATE`),
   filtrées par phase commerciale active, `enabled = true`, `valid_from`/`valid_until`, et
   `stock IS NULL OR stock > 0` / `maxWins` non atteint.
2. Si aucune récompense éligible : renvoyer un résultat structuré `NO_REWARD_AVAILABLE` — ne jamais
   laisser un utilisateur spinner sans résultat possible (produit doit toujours garder au moins une
   récompense à stock non-limité type petite remise ou "rien" explicite selon budget, voir §7 spec).
3. Tirage pondéré parmi les récompenses verrouillées (poids/probabilité explicite selon config).
4. Décrémenter `stock`/incrémenter compteur `maxWins` de la récompense tirée, dans la même transaction.
5. Créer la `reward_allocation` (`won_at`, `expires_at` calculé serveur, code de rédemption si
   applicable).
6. Retourner l'allocation complète au frontend.

**Le budget de campagne** (`maximumDiscountBudget`, spec §7) est vérifié dans la même transaction :
si l'attribution de cette récompense dépasserait le budget de remise cumulé, elle est retirée du pool
éligible avant tirage (étape 1), pas après (pas de rollback post-tirage visible à l'utilisateur).

**REQUIREMENT** — Toute future implémentation de cette RPC est commitée dans
`supabase/migrations/` dès le premier commit (pas de fonction créée directement en base puis
documentée après coup — c'est exactement le problème que FDR-0009 §1.1 corrige rétroactivement pour
les RPC existantes, ne pas le recréer ici).

## 4. Modèle de données

Reprend le modèle de spec §15 (`Campaign`, `WheelEntry`, `Reward`, `RewardAllocation`), traduit en
tables Postgres, RLS activée dès la création (jamais en rattrapage — voir FDR-0009 §2.2 sur la RLS
tardive déjà constatée sur 5 tables). Campagne **multi-événements** (Q-1) : pas de `event_id` unique sur
`lucky_wheel_campaigns`, table de jonction dédiée à la place.

```sql
lucky_wheel_campaigns (
  id uuid primary key,
  name text not null,
  enabled boolean not null default false,
  paused boolean not null default false,        -- PAUSE CAMPAIGN (§9), distinct de enabled
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  trigger_rules jsonb not null default '{}',     -- délai, scroll%, exit intent, CTA manuel, pages ciblées
  commercial_phase text not null default 'STANDARD',  -- LAUNCH | STANDARD | HIGH_DEMAND
  reward_expiration_hours integer not null default 48,
  max_discount_budget numeric,                   -- cumulative estimated_cost cap, null = illimité (§3/§7)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)

lucky_wheel_campaign_events (
  campaign_id uuid not null references lucky_wheel_campaigns(id) on delete cascade,
  event_id uuid not null references events(id),
  primary key (campaign_id, event_id)
)
-- Un event_id ne doit apparaître que dans UNE campagne active à la fois (contrainte applicative,
-- vérifiée à l'activation/enabled=true en admin — pas de contrainte DB simple pour "au plus une
-- campagne active par event_id" sans predicate sur enabled, donc vérifiée côté RPC admin plutôt
-- qu'en contrainte SQL déclarative).

lucky_wheel_rewards (
  id uuid primary key,
  campaign_id uuid not null references lucky_wheel_campaigns(id) on delete cascade,
  name text not null,
  type text not null,               -- RewardType enum, voir §5
  weight numeric,
  probability numeric,
  stock integer,                    -- null = illimité
  max_wins integer,
  wins_count integer not null default 0,
  public_value numeric,
  estimated_cost numeric,
  minimum_basket numeric,
  valid_from timestamptz,
  valid_until timestamptz,
  commercial_phases text[] not null default '{LAUNCH,STANDARD,HIGH_DEMAND}',  -- phases où éligible
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)

lucky_wheel_entries (
  id uuid primary key,
  campaign_id uuid not null references lucky_wheel_campaigns(id),
  event_id uuid not null references events(id),   -- événement où le widget a été ouvert (attribution),
                                                    -- doit appartenir à lucky_wheel_campaign_events
  email text not null,
  session_id text,                  -- identifiant anonyme, anti-rejoue
  marketing_consent boolean not null default false,  -- distinct de la capture email (spec §3.2)
  spun_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)       -- une participation par email par campagne, tous événements confondus (§6)
)

lucky_wheel_reward_allocations (
  id uuid primary key,
  wheel_entry_id uuid not null references lucky_wheel_entries(id),
  reward_id uuid not null references lucky_wheel_rewards(id),
  redemption_code text unique,      -- non-prédictible, null si récompense non-code (ex: patch physique)
  redemption_event_id uuid references events(id),  -- event ciblé par le code promo dédié (§7), choisi au
                                                     -- checkout parmi lucky_wheel_campaign_events, pas
                                                     -- figé au moment du tirage
  won_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  order_id uuid references orders(id)   -- rempli à l'application au checkout
)
```

RLS : `lucky_wheel_entries`/`lucky_wheel_reward_allocations` lisibles par leur propriétaire
(`email` matché à `auth.uid()` si connecté, sinon accès via `redemption_code` côté API seulement,
jamais de `SELECT` direct client anonyme) ou admin. `lucky_wheel_campaigns`/`lucky_wheel_rewards` :
lecture publique restreinte aux champs non sensibles nécessaires au widget (pas de `estimated_cost`
exposé publiquement), écriture admin uniquement.

## 5. Modèle de récompense (frontend/API)

Reprend spec §5 telle quelle (`WheelReward` interface, `RewardType` union) — pas de changement de
contrat, seulement adaptation TypeScript stricte (pas de `any`, cohérent avec CLAUDE.md) :

```ts
type RewardType =
  | 'TICKET_PERCENT_DISCOUNT'
  | 'TICKET_FIXED_DISCOUNT'
  | 'FREE_TICKET'
  | 'FREE_PRODUCT'
  | 'PRODUCT_DISCOUNT'
  | 'PHOTO_DISCOUNT'
  | 'FREE_PHOTO_PACK'
  | 'CUSTOM'

interface WheelReward {
  id: string
  name: string
  type: RewardType
  weight?: number
  probability?: number
  stock?: number
  maxWins?: number
  value?: number
  estimatedCost?: number
  minimumBasket?: number
  validFrom?: string
  validUntil?: string
  expirationHours?: number
  enabled: boolean
}
```

## 6. Anti-abus

Reprend spec §10. Règle de base : une participation par email par campagne (contrainte `unique` §4).
Protections supplémentaires V1 :

- Unicité email par campagne (contrainte DB, pas seulement applicative).
- Cookie/session identifiant pour limiter la réouverture immédiate du widget après refus/fermeture
  (confort UX, pas une garantie anti-abus — la garantie reste l'unicité email en base).
- Rate limiting IP sur `POST /api/lucky-wheel/spin` — voir contrainte plan Hobby
  ([docs/security/rate-limiting.md](../security/rate-limiting.md)) : pas de nouvelle règle Vercel
  Firewall disponible sans upgrade de plan. Utiliser `src/lib/rateLimit.ts` (in-memory, déjà utilisé
  ailleurs dans le repo) en mitigation applicative de premier niveau, documenté comme protection
  best-effort (reset au redeploy, pas distribué) plutôt que garantie forte.
- `redemption_code` : non-prédictible (UUID v4 ou équivalent cryptographique), usage unique, invalidé
  après rédemption (`redeemed_at` non-null = définitivement inutilisable, jamais réinitialisé).
- Refresh de page après spin ne permet pas de rejouer : l'état "déjà spinné" est dérivé de
  `lucky_wheel_entries.spun_at IS NOT NULL` en base, jamais d'un état local (`localStorage` seul serait
  contournable en navigation privée — acceptable comme confort mais l'email reste la garantie réelle).

Pas de fingerprinting navigateur en V1 (spec §10 : "avoid invasive browser fingerprinting unless
genuinely necessary" — aucune nécessité identifiée pour V1).

## 7. Application de la récompense au checkout

**DECISION (révisée 2026-09-21, remplace le design auto-apply initial ci-dessous)** — Réutilise le
mécanisme d'application de code promo existant
([src/lib/registration.ts](../../../src/lib/registration.ts),
[src/lib/pricing.ts](../../../src/lib/pricing.ts)) plutôt que d'inventer un second système parallèle,
mais **sans tentative d'auto-application**. Une allocation de type remise génère une ligne dans
`promotional_codes` (`usage_limit = 1`, préfixe `LWHEEL-`) **immédiatement au moment du tirage**
(dans `src/lib/luckyWheel/spin.ts`, pas au checkout) — liée à l'allocation
(`lucky_wheel_reward_allocations.redemption_code` = le code créé, ce champ contient désormais le vrai
code au lieu du jeton opaque généré par le RPC pour les récompenses de type remise). Le code est
affiché immédiatement sur l'écran de résultat (copiable) et envoyé par email
(`LuckyWheelRewardEmail.tsx`). L'utilisateur le saisit manuellement dans le tunnel d'inscription,
comme n'importe quel code promo — flux `/api/promotions/validate` inchangé, aucune logique
d'auto-application dans le tunnel.

**Raison de l'abandon de l'auto-application** : le design initial (voir historique ci-dessous)
générait le code paresseusement au checkout, en s'appuyant sur un pointeur `localStorage` écrit par
le navigateur ayant remporté le tirage pour le retrouver. Ce mécanisme casse dès que l'achat se fait
sur un appareil/navigateur/session différent de celui du tirage (spin sur mobile depuis une pub,
achat plus tard sur desktop — cas courant), et a été signalé comme "les récompenses ne marchent pas
du tout" en test. Un code promo saisi manuellement, email à l'appui, n'a aucune dépendance à
l'appareil ni au compte utilisateur.

**DECISION (Q-1, campagne multi-événements)** — Le code promo dédié généré en `promotional_codes`
n'est **rattaché à aucun événement** (`promotional_code_events` reste vide pour ce code) — il est donc
valide sur tous les événements liés à la campagne de l'allocation, conformément à la nature
multi-événements de la campagne. `/api/promotions/validate` traite déjà un code sans ligne
`promotional_code_events` comme valide partout (absence de restriction), donc aucune règle de scope
supplémentaire n'a été ajoutée.

<details>
<summary>Design initial (2026-09-20, abandonné) — pour mémoire uniquement, ne pas implémenter</summary>

Le tunnel d'inscription appliquait le code automatiquement si l'email du panier correspondait à
`lucky_wheel_entries.email` d'une allocation non expirée et non rédemptée, via un pointeur
`localStorage` posé par le navigateur du tirage et un endpoint `/api/lucky-wheel/redeem` qui mintait
le code paresseusement au moment où le tunnel se montait — le code était alors scopé à l'événement
choisi par l'utilisateur au checkout (`redemption_event_id` écrit sur l'allocation à ce moment-là).
Ce mécanisme (route `/api/lucky-wheel/redeem`, hook `use-lucky-wheel-checkout-code.ts`) a été
entièrement supprimé au profit du flux ci-dessus.

</details>

**REQUIREMENT** — Cette règle de cumul (§ CLAUDE.md "Promo code cumulative") s'applique : un code
Lucky Wheel et un code tier existant (ex `LUOFF30`) ne sont cumulables que si la logique
`NON_CUMULABLE_WITH_TIER_CODES` de `src/lib/registration.ts` l'autorise explicitement. Par défaut,
traiter les codes Lucky Wheel comme **non cumulables** avec tout autre code promo tant que le produit
n'a pas explicitement demandé le contraire (protège le prix moyen du billet, principe spec §21.1).

À la confirmation de commande (webhook Stripe ou `registrations/create`, selon flux emprunté), marquer
`lucky_wheel_reward_allocations.redeemed_at` et `order_id` dans la même logique d'idempotence déjà en
place pour `orders` (voir FDR-0009 §2.2 — contrainte `UNIQUE` sur `orders`, gestion `23505`).

## 8. Phases commerciales et scarcity

V1 : phase active configurée manuellement par campagne (`lucky_wheel_campaigns.commercial_phase`), pas
de bascule automatique par cron/règle (voir DECISION §2). Chaque récompense déclare dans quelles phases
elle est éligible (`commercial_phases text[]`). En `HIGH_DEMAND`, l'admin désactive manuellement les
récompenses de type remise billet/billet gratuit en repassant leur `enabled` à `false` ou en retirant
`HIGH_DEMAND` de leur `commercial_phases` — pas d'automatisme V1, cohérent avec spec §22 point 11 vs
"Dynamic commercial phases [...] progressively after".

## 9. Emails

Reprend spec §11. Utilise l'infrastructure Resend existante
([docs/guides/email-conventions.md](../guides/email-conventions.md) — **obligatoire à lire avant tout
template HTML**, [src/lib/email/](../../../src/lib/email/)) :

- Email immédiat après spin (récompense + conditions + expiration + CTA), envoyé de façon non-bloquante
  (`Promise.allSettled` ou équivalent — pas le pattern bloquant identifié comme dette en FDR-0009 §3.2
  pour le webhook Stripe, ne pas reproduire cette dette dans du nouveau code).
- Séquence de rappel si non rédemptée : configurable en heures depuis `won_at`
  (`reward_expiration_hours` de la campagne comme référence), implémentée en cron/scheduled function
  sur le modèle des rappels d'abandon de panier déjà existants (`AbandonedCheckoutEmail`).
- Toute séquence de rappel s'arrête immédiatement après `redeemed_at` non-null — vérifier l'état avant
  chaque envoi programmé, pas seulement à la planification initiale.
- Ce nouveau flux email est **distinct** du consentement marketing général (FDR-0007 phase 3) — recevoir
  l'email de récompense ne dépend pas de `notification_preferences`, c'est une communication
  transactionnelle liée à la participation, pas une communication marketing soumise à opt-in séparé
  (spec §3.2 : "submitting an email does not automatically imply consent to unrelated marketing").

## 10. Administration

`Marketing → Lucky Wheel`, nouvel item dans `src/components/admin/adminNavItems.ts` (groupe Marketing,
aux côtés de `promocodes`/`promotions`/distribution-lists), page sous `src/app/dashboard/lucky-wheel/`.

Reprend spec §12 telle quelle pour le contenu (gestion campagne, gestion récompense, règles métier,
contrôle d'urgence). Le bouton **PAUSE CAMPAIGN** bascule uniquement `paused = true` — ne supprime ni
campagne ni allocations existantes (spec §12 : "without deleting campaign configuration or existing
reward allocations"). `POST /api/lucky-wheel/spin` doit vérifier `paused = false` en tout premier,
avant toute autre logique.

## 11. Analytics

Reprend spec §13/§14 telles quelles pour les événements et le funnel. Événements sans duplication de
PII au-delà du strict nécessaire (spec §13 : "avoid duplicating personal data unnecessarily in
analytics payloads") — utiliser un identifiant d'allocation/entry plutôt que l'email brut dans les
payloads analytics.

## 12. Implémentation

### 12.1 Fichiers

```
supabase/migrations/
  <timestamp>_lucky_wheel_schema.sql          # tables §4, RLS
  <timestamp>_lucky_wheel_spin_rpc.sql         # RPC §3

src/lib/luckyWheel/
  campaign.ts            # lecture campagne active, phase, règles trigger
  rewardCatalog.ts        # CRUD récompenses (admin)
  spin.ts                 # appel RPC lucky_wheel_spin, mapping résultat
  redemption.ts           # mintLuckyWheelPromoCode -- génère le code promo dédié au moment du tirage (§7)
  eligibility.ts          # filtre récompenses par phase/budget (miroir de la logique RPC, pour preview admin)

src/app/api/lucky-wheel/
  campaign/route.ts        # GET config publique campagne active (trigger rules, pas les coûts)
  entry/route.ts           # POST capture email (crée wheel_entry)
  spin/route.ts            # POST tirage (RPC §3)
  status/route.ts          # GET état participation courante (déjà spinné ? allocation active ?)

src/app/api/admin/lucky-wheel/
  campaigns/route.ts
  campaigns/[id]/route.ts
  campaigns/[id]/pause/route.ts
  rewards/route.ts
  rewards/[id]/route.ts

src/components/lucky-wheel/
  LuckyWheelWidget.tsx      # orchestrateur, triggers (spec §3.1)
  LuckyWheelEmailStep.tsx
  LuckyWheelSpinner.tsx     # animation, arrêt sur résultat serveur
  LuckyWheelResult.tsx

src/components/admin/lucky-wheel/
  LuckyWheelSection.tsx     # orchestrateur, ne concentre pas le rendu (engineering.md)
  CampaignForm.tsx
  RewardTable.tsx
  RewardForm.tsx
  PauseCampaignButton.tsx

src/hooks/lucky-wheel/
  use-lucky-wheel-trigger.ts   # convention hooks engineering.md
  use-lucky-wheel-spin.ts
```

### 12.2 Feature flag

Pas de système de feature flag applicatif existant dans le repo (vérifié : aucun `luckyWheel.enabled`
équivalent, tout est piloté par état DB — `event.status`, booléens de config). Suivre le même pattern :
`lucky_wheel_campaigns.enabled` **est** le flag. Le widget public ne rend rien tant qu'aucune campagne
`enabled = true` et `paused = false` n'est associée (via `lucky_wheel_campaign_events`) à l'événement
de la page courante — pas de variable d'environnement séparée à ajouter (cohérent avec le reste du
produit, évite un flag applicatif de plus à maintenir en double avec l'état DB).

### 12.3 Performance (spec §18)

Le widget est chargé en lazy (dynamic import, pas dans le bundle initial de la page événement). Un échec
de `GET /api/lucky-wheel/campaign` ou de tout appel Lucky Wheel ne doit jamais bloquer le rendu de la
page ni le tunnel d'inscription standard — fail silently (widget non affiché), jamais d'erreur bloquante
remontée à l'utilisateur sur le parcours d'achat principal (spec §18 : "failure of the wheel must never
prevent normal ticket purchases").

## 13. Tests (TDD, succès + échec par use-case)

Suit [docs/quality/testing-strategy.md](../quality/testing-strategy.md) et spec §20 :

- **Tirage** : sélection pondérée correcte ; récompense sans stock devient inéligible ; limite de
  campagne (budget) respectée ; transition de phase change le pool éligible ; récompense expirée ou
  désactivée exclue ; campagne désactivée/en pause refuse tout spin.
- **Concurrence** (le plus important, miroir FDR-0012 §7) : deux requêtes simultanées sur le dernier
  stock d'une récompense (`maxWins - wins_count = 1`) → une seule réussit, l'autre reçoit une réponse
  structurée sans écriture partielle. Test d'intégration avec vraie concurrence, pas mocké
  séquentiellement.
- **Anti-abus** : même email spin deux fois → refusé au niveau contrainte DB, message explicite ;
  refresh de page après spin ne permet pas un second tirage ; réutilisation d'un `redemption_code` déjà
  rédemmé → refusée ; `redemption_code` expiré → refusé.
- **Application checkout** : allocation valide appliquée automatiquement ; allocation expirée refusée ;
  cumul avec code promo existant respecte la règle de non-cumul par défaut (§7) ; idempotence sur double
  webhook (même pattern que FDR-0009 §2.2).
- **Emails** : envoi immédiat après spin ; séquence de rappel stoppée après `redeemed_at` ; timing
  configurable respecté.
- **Frontend** : mobile, desktop, `prefers-reduced-motion` (pas d'animation de rotation, affichage direct
  du résultat), connexion lente (le widget n'empêche pas le reste de la page de charger), échec API
  (widget disparaît silencieusement, spec §18), campagne expirée, état "déjà participé".

## 14. Critères d'acceptation

- Aucune double attribution possible sur une récompense à stock limité, prouvé par test de concurrence
  réelle (RPC verrouillée, pas de lecture-puis-écriture séparée).
- RPC `lucky_wheel_spin` versionnée dans `supabase/migrations/` dès le premier commit.
- Une participation par email par campagne, garantie par contrainte DB.
- Résultat du tirage toujours déterminé server-side ; le frontend ne fait qu'animer vers un résultat
  déjà connu.
- `PAUSE CAMPAIGN` stoppe immédiatement tout nouveau spin sans supprimer configuration ni allocations.
- Échec du service Lucky Wheel (API, DB) n'empêche jamais le tunnel d'inscription standard de
  fonctionner.
- Récompense de remise appliquée automatiquement au checkout sans saisie manuelle de code, dans le
  respect de la règle de non-cumul par défaut.
- Zod aux frontières de toutes les nouvelles routes API (`entry`, `spin`, admin campaigns/rewards).
- RLS activée dès la création des tables, pas en rattrapage.
- Tests succès + échec par règle de §13, suite complète passante, `tsc --noEmit` clean.

## 15. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Race condition sur récompense à stock limité (jackpot) | RPC atomique verrouillée dès le premier commit (§3), testée sous charge concurrente avant activation |
| RPC créée directement en base sans migration, reproduisant la dette FDR-0009 §1.1 | Interdiction explicite en §0.3 — toute RPC est commitée avant d'être appelée depuis l'application |
| Code promo dédié Lucky Wheel entre en conflit silencieux avec règle de cumul tier existante (LUOFF30/JUOFF50) | Non-cumulable par défaut tant que le produit n'a pas validé le contraire (§7) |
| Widget dégrade la performance ou bloque le tunnel d'achat principal en cas de panne | Lazy load, échec silencieux, jamais d'erreur bloquante sur le parcours d'achat (§12.3) |
| Rate limiting insuffisant sur `/api/lucky-wheel/spin` faute de règle Firewall disponible (plan Hobby) | Mitigation applicative best-effort via `src/lib/rateLimit.ts`, documentée comme non-garantie ; réévaluer si upgrade de plan (voir `docs/security/rate-limiting.md`) |
| Confusion entre consentement marketing et capture email de la roue | Champ `marketing_consent` distinct et explicite dans `lucky_wheel_entries`, jamais dérivé implicitement de la participation |
| Sur-engineering V1 (phases automatiques, A/B, fingerprinting) alors que spec elle-même les reporte | Périmètre V1 strictement limité à spec §22 (voir bandeau en tête de document) |
