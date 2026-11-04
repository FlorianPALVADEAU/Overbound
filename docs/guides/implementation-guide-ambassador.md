# Implementation Guide: Ambassador Program

**Pour** : développeurs qui touchent aux points, aux récompenses, au dashboard ou au lien de parrainage
**Voir aussi** : [FDR-0006](../fdr/FDR-0006-ambassador-program-points-and-rewards.md) (décisions, amendements 2026-11-01 et 2026-11-02), [rpc-reference.md](./rpc-reference.md)

Dernière mise à jour : 2026-11-03. Ce guide décrit le code tel qu'il est. L'ancien système (10 paliers codés en dur, année civile, billets bonus tous les 3 points) n'existe plus.

---

## Vue d'ensemble

1. Un ambassadeur a un ou plusieurs codes promo (`ambassador_promotional_codes`).
2. Un ami s'inscrit avec le code, tapé à la main ou appliqué par le lien `/?ref=CODE`.
3. La commande payée déclenche `award_ambassador_points_for_order` (triggers SQL, plus un appel redondant du webhook Stripe et de `registrations/create`). Le ledger reçoit une ligne par inscription.
4. `ambassador_sync_points` recalcule l'agrégat de la saison, `ambassador_reconcile_rewards` crée les récompenses de chaque palier atteint.
5. L'ambassadeur voit l'avancement sur `/ambassadors/dashboard`, réclame ses récompenses, l'équipe les remet à la main (statut `fulfilled`).
6. Un email de relance part quand l'ambassadeur est à 2 points ou moins du palier suivant.

---

## Saison

Il n'y a plus d'année civile. `program_year` (sur les événements de points, les agrégats et les récompenses) est la clé d'une **saison**, lue dans la table à ligne unique `ambassador_program_season`.

| Colonne | Rôle |
|---|---|
| `current_season` | Valeur de `program_year` de la saison en cours (2027 aujourd'hui) |
| `started_at` | Une commande créée avant cet instant ne donne aucun point (pas de rétroactivité) |
| `ends_at` | Copiée dans `ambassador_rewards.expires_at` au moment où une récompense est gagnée. Vide : pas d'expiration |

Lecture côté application : `loadCurrentSeason(admin)` dans [season.ts](../../src/lib/ambassadors/season.ts). Ne jamais dériver la saison de la date du jour.

### Remettre les compteurs à zéro (nouvelle saison)

1. Sauvegarder la base.
2. Copier les totaux dans `ambassador_season_archive` (`season`, `ambassador_id`, totaux).
3. Passer les récompenses `earned` de l'ancienne saison en `cancelled` avec un motif, et écrire l'événement d'audit. Les récompenses `claimed` et `fulfilled` restent : le dashboard les montre en lecture seule dans "Édition précédente".
4. Supprimer ledger, corrections et agrégats de l'ancienne saison.
5. Ajouter une échelle avec un nouvel `effective_year`, puis mettre à jour `current_season`, `started_at`, `ends_at`.
6. Modèle complet : `supabase/migrations/20261102120000_ambassador_season_reset.sql`. Elle s'applique avant le déploiement du code (FDR-0009).

---

## Points

| Table / fonction | Rôle |
|---|---|
| `ambassador_points_events` | Ledger. Une ligne par couple (ambassadeur, inscription). Jamais supprimée : une révocation pose `revoked_at` |
| `ambassador_points_adjustments` | Corrections admin, avec motif et clé d'idempotence |
| `ambassador_points_years` | Agrégat par saison (`total_points`, `recruits_open`, `recruits_ranked`). Écrit **uniquement** par `ambassador_sync_points` |
| `award_ambassador_points_for_order` | Attribution. Ignore : commande antérieure à `started_at`, commande à 0 €, auto-parrainage, inscription annulée |
| `revoke_ambassador_points` | Appelée par les triggers sur `registrations.cancelled_at` et `orders.status` (`refunded`, `cancelled`) |
| `admin_adjust_ambassador_points`, `admin_credit_manual_referral` | Corrections et parrainages hors ligne, tous deux via `ambassador_sync_points` |

Points par format : OPEN = 1, RANKED = 2 (`tickets.race_format`). Ne jamais insérer dans les agrégats, ne jamais détecter le format par ID.

### Reconnaître un code ambassadeur

Un code est ambassadeur s'il est lié à un ambassadeur par `ambassadors.promotional_code_id` (ancien lien, un seul code) **ou** par `ambassador_promotional_codes` (plusieurs codes). Un ambassadeur à plusieurs codes n'a ses codes supplémentaires que dans la seconde table.

Toute requête qui doit savoir si un code est ambassadeur sélectionne `AMBASSADOR_LINK_SELECT` et teste `isAmbassadorPromoRow(row)` ([mappers.ts](../../src/lib/orderPricing/mappers.ts)). Ne pas réécrire `ambassadors:ambassadors(id)` à la main : c'est le bug qui a fait ignorer des codes valides (validation, règle "un seul code ambassadeur", référence dans le webhook).

---

## Paliers et récompenses

Les paliers vivent en base, versionnés par `effective_year` : `ambassador_reward_levels` (palier, points, nom, description, `kind`) et `ambassador_program_rules` (dossard bonus : `bonus_base_points`, `bonus_interval_points`, `bonus_reward_name`). Une saison utilise les lignes de l'`effective_year` le plus récent inférieur ou égal à sa clé. Changer l'échelle, c'est ajouter des lignes, jamais modifier celles de la saison en cours.

Échelle de la saison 2027 (modifiable en base) : 1 badge, 3 code -50 %, 5 T-shirt, 8 dossard Open, 12 mise en avant réseaux, 20 dossard Ranked, 25 pack média, 30 Ambassadeur Or. Au-dessus de 30 : un dossard offert tous les 5 points, sans plafond.

Code de lecture :

| Fichier | Rôle |
|---|---|
| [programRules.ts](../../src/lib/ambassadors/programRules.ts) | `loadProgramRules(admin, season)` : seule source des paliers |
| [program.ts](../../src/lib/ambassadors/program.ts) | Fonctions pures : `buildProgramRules`, `getNextReward`, `getCurrentRewardLevel`, `getExtraTicketsEarned`, `getRewardKind` |

### Cycle de vie d'une récompense

`earned` (gagnée, `expires_at` = fin de saison) puis `claimed` (réclamée par l'ambassadeur) puis `fulfilled` (remise par l'équipe). `cancelled` : annulée par le système (révocation de points, reset). `ambassador_reconcile_rewards` annule les `earned` devenues injustifiées et rouvre celles qu'elle avait annulées si les points reviennent. Les `claimed` et `fulfilled` ne sont jamais touchées.

Réclamation : `POST /api/ambassadors/rewards/claim` avec `{ reward_level }`, logique dans [rewardClaims.ts](../../src/lib/ambassadors/rewardClaims.ts). Échecs : `NOT_FOUND` (404), `EXPIRED` (409, "expiré à la fin de la saison"), `NOT_CLAIMABLE` (409). Si l'email à l'équipe échoue, la réclamation est relâchée (`releaseAmbassadorRewardClaim`) pour pouvoir réessayer.

---

## Dashboard

Route : `GET /api/ambassadors/dashboard` (paramètre `view_as` réservé aux admins). Chargement : [loadAmbassadorDashboard.ts](../../src/lib/ambassadors/dashboard/loadAmbassadorDashboard.ts). Page : `src/app/ambassadors/dashboard/page.tsx` (client, session puis dashboard).

Logique pure, sans accès base, avec tests :

| Fichier | Rôle |
|---|---|
| `dashboard/goal.ts` | Objectif en cours, amis nécessaires, résumé du dossard bonus |
| `dashboard/ladder.ts` | Échelle avec état de chaque palier, récompenses réclamables et expiration |
| `dashboard/leaderboard.ts` | Top 3, rang, écart à combler (`chase`) |
| `dashboard/recruits.ts` | Filleuls de la saison (filtre `started_at` ou événement du ledger) |
| `dashboard/previousEdition.ts` | Totaux archivés et récompenses réclamées des éditions closes |

Composants sous `src/components/ambassadors/` : `AmbassadorDashboard` (orchestre), `AmbassadorGoalCard`, `AmbassadorShareCard`, `AmbassadorClaimable`, `AmbassadorLadder`, `AmbassadorLeaderboard`, `AmbassadorActivity`, `AmbassadorPreviousEdition`, `AmbassadorRules`. Primitives du design system uniquement (voir [design-system.md](../design/design-system.md)). Hooks : `useClaimAmbassadorReward`, `usePointsSinceLastVisit`.

Page de référence avec données fixes : `/design/ambassadeur` (404 en production). Elle sert aux tests de mise en page et à la revue de design.

---

## Lien de parrainage

Le bouton "Partager" envoie `https://…/?ref=CODE` ([referral.ts](../../src/lib/attribution/referral.ts)).

- `UtmCapture` (layout racine) garde le code 30 jours dans `localStorage` (`overbound-referral`), en majuscules. Dernier lien gagnant. Un code mal formé est ignoré.
- `usePromoCode` lit ce code à l'ouverture du tunnel, le valide par `/api/promotions/validate` et l'applique s'il répond `is_ambassador: true`. Le code est effacé après la tentative. Un code invalide ou non ambassadeur est écarté sans message, le champ reste libre.
- Le paramètre est `ref` et non `code` : le callback OAuth utilise déjà `code`.

---

## Email de relance

[pointsNudge.ts](../../src/lib/ambassadors/pointsNudge.ts), appelé par `rewardsNotifications.ts` après une attribution, seulement si aucun email de récompense n'est parti. Seuil : `NUDGE_MAX_POINTS_REMAINING` (2). Une relance par palier et par saison : la ligne `ambassador_nudges (ambassador_id, season, points_required)` est réservée avant l'envoi et supprimée si l'envoi échoue. Une erreur de relance ne bloque jamais l'attribution des points.

---

## Admin

Back-office : une liste, une fiche par ambassadeur (`/dashboard/ambassadors` et `/dashboard/ambassadors/[id]`). La liste lit une ligne par ambassadeur (`GET /api/admin/ambassadors?year=`). La fiche charge la saison, l'échelle avec chaque récompense et les dossards bonus (`GET /api/admin/ambassadors/[id]?year=`) ; les filleuls, les codes et l'historique ne se chargent qu'à l'ouverture de leur onglet.

| Route | Rôle |
|---|---|
| `GET /api/admin/ambassadors` | Liste de la saison : totaux, code actif, récompenses à réclamer et à remettre |
| `GET /api/admin/ambassadors/[id]` | Fiche : totaux, paliers, dossards bonus, code actif |
| `GET, POST /api/admin/ambassadors/[id]/referrals` | Filleuls de la saison en cours ; crédit d'un filleul manuel |
| `GET /api/admin/ambassadors/[id]/history` | Corrections de points et décisions sur les récompenses |
| `PATCH /api/admin/ambassadors/[id]/points` | Correction des totaux (motif et clé d'idempotence obligatoires) |
| `/api/admin/ambassadors/[id]/promo-codes…` | Codes d'un ambassadeur |
| `PATCH /api/admin/ambassador-rewards/[id]` | Statut d'une récompense, ou annulation et réouverture avec motif |

Logique pure et testée : `src/lib/admin/ambassadors/` (`sheetLadder`, `rewardCounts`, `currentCode`). Contrat partagé route et navigateur : `types.ts` du même dossier. Les corrections passent par `admin_adjust_ambassador_points`, jamais par un `UPDATE` direct.

---

## Tests

- Vitest : `src/lib/ambassadors/**/*.test.ts` (paliers, objectif, échelle, classement, filleuls, réclamation, relance, notifications), `src/lib/attribution/referral.test.ts`, `src/lib/orderPricing/mappers.test.ts`, `src/app/api/promotions/validate/route.test.ts`.
- Playwright : `e2e/ambassador-dashboard.spec.ts` (contrat responsive sur 12 tailles d'écran), `e2e/ambassador-dashboard-flow.spec.ts` (accès, réclamation, partage, classement), `e2e/ambassador-referral.spec.ts` (lien `?ref=`). Les API y sont simulées : ils prouvent le comportement du front, pas celui de la base.
- Le comportement SQL (attribution, non-rétroactivité, idempotence, remboursement, expiration) se vérifie sur la base de dev, dans une transaction annulée.

---

## Requêtes de contrôle

```sql
-- Saison en cours
SELECT current_season, started_at, ends_at FROM ambassador_program_season;

-- Points d'un ambassadeur dans la saison
SELECT total_points, recruits_open, recruits_ranked
FROM ambassador_points_years
WHERE ambassador_id = 'AMB_ID' AND program_year = (SELECT current_season FROM ambassador_program_season);

-- Ledger d'un ambassadeur (les lignes révoquées ont revoked_at)
SELECT registration_id, points, race_format, created_at, revoked_at, revoked_reason
FROM ambassador_points_events WHERE ambassador_id = 'AMB_ID' ORDER BY created_at DESC;

-- Récompenses
SELECT reward_level, reward_name, status, earned_at, expires_at, claimed_at, fulfilled_at
FROM ambassador_rewards WHERE ambassador_id = 'AMB_ID' ORDER BY reward_level;

-- Récompenses déjà remises mais plus justifiées par les points (décision humaine)
SELECT * FROM ambassador_rewards_over_granted;

-- Codes d'un ambassadeur, avec l'ancien lien
SELECT pc.code, apc.is_current, (a.promotional_code_id = pc.id) AS legacy_link
FROM ambassador_promotional_codes apc
JOIN promotional_codes pc ON pc.id = apc.promotional_code_id
JOIN ambassadors a ON a.id = apc.ambassador_id
WHERE apc.ambassador_id = 'AMB_ID';
```

---

## Pièges

- Ne pas écrire dans `ambassador_points_years` ni dans l'ancienne table `ambassador_points` (dépréciée).
- Ne pas coder un palier en dur : tout vient de la base.
- Ne pas dériver `program_year` de la date.
- Ne pas tester `ambassadors:ambassadors(id)` pour savoir si un code est ambassadeur : utiliser `isAmbassadorPromoRow`.
- Les migrations s'appliquent avant le déploiement du code qui les lit : `20261101120000`, `20261102120000`, `20261103120000` (toutes trois appliquées en production le 2026-11-03).
