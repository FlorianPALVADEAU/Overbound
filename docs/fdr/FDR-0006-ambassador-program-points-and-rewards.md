# FDR-0006 - Ambassador Program: Points & Rewards

**Status**: Accepted, amendé le 2026-11-03 (saison continue, paliers en base). Lire les amendements avant le corps du document.
**Date**: May 2026  
**References**: [implementation-guide-ambassador.md](../guides/implementation-guide-ambassador.md)

---

## Reprise / état vérifié localement — 2026-09-20

| Élément | Statut | Constat local / suite nécessaire |
|---|---|---|
| Programme de points, niveaux et rewards | **fait localement** | Les helpers, dashboard et routes de claim sont présents; la migration `20260706_fix_ambassador_points_all_codes.sql` met à jour les points pour les codes historiques. |
| Attribution par format | **partiel** | La règle 1 point OPEN / 2 points RANKED demeure métier, mais les nouveaux parcours ne doivent pas inférer le format depuis un libellé. La source exacte de `race_format` et son contrat live sont à vérifier. |
| Isolation organisation / événement | **à faire** | Les structures historiques de points et rewards ne sont pas documentées comme tenant-scopées. Audit live et décision de migration requis avant exposition multi-organisation. |
| Ledger, justification et idempotence des corrections admin | **à faire** | Les modifications manuelles restent une opération critique; aucune preuve locale d'un ledger robuste avec motif obligatoire et outbox n'est établie par cette FDR. |
| RLS et grants effectifs | **à faire (live)** | L'activation RLS existe localement pour certaines tables ambassadeur, sans inventaire ni vérification de la base cible. |

Ne pas déduire de ce tableau que les migrations sont appliquées en production ou que les données distantes ont été contrôlées.

## Amendement 2026-11-01 : règles en base, points révocables

Migration : `supabase/migrations/20261101120000_ambassador_program_rules_and_revocation.sql` (appliquée en production le 2026-11-03 avant le déploiement du code, avec la suivante).

| Sujet | Décision |
|---|---|
| Source des règles | Tables `ambassador_reward_levels` et `ambassador_program_rules`, versionnées par `effective_year` : une année utilise la ligne la plus récente dont l'année est inférieure ou égale. Le SQL (`ambassador_reconcile_rewards`), l'API et l'UI lisent la même source. Plus de constante TS, plus de liste SQL en dur. |
| Dossards bonus | Un dossard par tranche de 5 points au-dessus de 30 à partir de 2027. 2026 reste à 3 points. Pas de plafond (décision produit : un plafond démotive le meilleur recruteur). Pour changer l'intervalle, ajouter une ligne `effective_year`, ne jamais modifier l'année en cours. |
| Pas de rétroactivité | Événements, points et récompenses existants ne sont pas modifiés. `ambassador_rewards.points_required` fige le seuil au moment du gain, donc une règle changée ne rend jamais une récompense déjà gagnée « injustifiée ». |
| Pas de points | Auto-parrainage (l'email du participant est l'email du compte de l'ambassadeur), commande à 0 €, inscription annulée. Un ambassadeur qui achète des places pour d'autres avec son code reste un parrainage normal. |
| Révocation | Triggers sur `registrations.cancelled_at` et `orders.status` (`refunded`, `cancelled`) appellent `revoke_ambassador_points`. Les événements ne sont jamais supprimés, seulement marqués `revoked_at`. |
| Récompenses et révocation | `ambassador_reconcile_rewards` annule les récompenses `earned` non justifiées (audit append-only, acteur système) et rouvre celles que le système avait annulées si les points reviennent. Les récompenses `claimed` ou `fulfilled` ne sont jamais touchées : la vue `ambassador_rewards_over_granted` les liste pour décision humaine. |
| Un seul écrivain | `ambassador_sync_points` recalcule l'agrégat annuel depuis le ledger plus les corrections admin auditées. Attribution, révocation, correction admin et crédit manuel passent tous par lui. La table `ambassador_points` (cumul à vie) est dépréciée et n'est plus écrite. |
| Attribution | Les triggers `orders_award_ambassador_points_trigger` et `registrations_award_ambassador_points_trigger` n'existaient qu'en production ; ils sont maintenant versionnés. Les appels RPC applicatifs du webhook Stripe et de `registrations/create` sont redondants (idempotents) : à retirer après un test sur staging. |

Reste ouvert : le niveau 8 « Remboursement total » et les niveaux 2, 5 et 7 (avantages non définis) sont conservés tels qu'ils étaient en base, par décision de ne pas changer le contenu commercial sans arbitrage.

## Amendement 2026-11-02 : une saison continue, reset de l'édition 2026

Migration : `supabase/migrations/20261102120000_ambassador_season_reset.sql` (appliquée en production le 2026-11-03 après sauvegarde de la base, avant le déploiement du code). Pour un prochain reset : sauvegarde de la base obligatoire avant, migration appliquée avant le code.

| Sujet | Décision |
|---|---|
| Année civile | Abandonnée. `program_year` devient la clé d'une **saison** lue dans `ambassador_program_season` (`current_season`, `started_at`). Elle ne change que par un reset volontaire. Les décisions « expiration le 31 décembre » et « rewards annuelles » de la section Decision sont caduques. |
| Expiration | Plus au 31 décembre, mais à la **fin de la saison** : `ambassador_program_season.ends_at` (31 décembre 2027, 23:59:59 Europe/Paris pour la première saison) est copiée dans `expires_at` quand une récompense est gagnée. Une récompense gagnée non réclamée à cette date n'est plus réclamable (cumuler des dossards pour remplir un événement est ainsi impossible). `ends_at` vide : pas d'expiration tant que l'équipe n'a pas fixé de date. |
| Reset | Édition 2026 (Ultra Arena V1) archivée : totaux copiés dans `ambassador_season_archive`, récompenses `claimed` et `fulfilled` conservées (historique en lecture seule), récompenses `earned` non réclamées passées en `cancelled` (non réclamables, aucune période de grâce : décision du 2026-11-02), ledger, corrections et agrégats supprimés. |
| Pas de rétroactivité | `award_ambassador_points_for_order` ignore toute commande créée avant `started_at`. |
| Échelle | 8 paliers, lignes `effective_year = 2027` : 1 badge, 3 code -50 %, 5 T-shirt, 8 dossard Open, 12 mise en avant réseaux, 20 dossard Ranked, 25 pack média (photos et vidéos de l'événement), 30 Ambassadeur Or. Plus de palier vague ni de remboursement. Pas de sweat : le design, l'impression et l'envoi coûtent plus que sa valeur. Un dossard offert tous les 5 points au-dessus de 30, sans plafond. |
| Dashboard | Refait mobile first : objectif en cours et amis nécessaires, partage du code, récompenses à réclamer, échelle, classement avec écart à combler, filleuls, édition précédente. |

Pour une prochaine remise à zéro : archiver les totaux, incrémenter `current_season`, mettre `started_at`, ajouter une échelle avec un nouvel `effective_year`.

## Amendement 2026-11-03 : lien de parrainage, relance, codes multiples

Migration : `supabase/migrations/20261103120000_ambassador_nudges.sql` (table `ambassador_nudges`).

| Sujet | Décision |
|---|---|
| Lien de parrainage | Le bouton "Partager" envoie `/?ref=CODE`. Le code est gardé 30 jours dans le navigateur (`overbound-referral`) puis appliqué à l'ouverture du tunnel d'inscription, seulement si c'est un code ambassadeur. Sinon le champ reste libre, sans message. Le paramètre est `ref` car `code` est pris par le callback OAuth. |
| Relance | Un email unique par palier et par saison quand l'ambassadeur est à 2 points ou moins du palier suivant (`NUDGE_MAX_POINTS_REMAINING`). Pas de relance si un email de récompense part déjà pour la même commande. Une panne d'envoi ne bloque jamais l'attribution. |
| Détection d'un code ambassadeur | Un code est ambassadeur s'il est lié par `ambassadors.promotional_code_id` **ou** par `ambassador_promotional_codes`. Avant cet amendement, la validation, le prix serveur (règle "un seul code ambassadeur"), le webhook et `registrations/create` ne lisaient que l'ancien lien : 34 des 59 liens de la base de dev n'étaient pas reconnus. Désormais un seul helper (`AMBASSADOR_LINK_SELECT`, `isAmbassadorPromoRow`). Effet de bord assumé : la règle "un seul code ambassadeur par commande" s'applique aussi aux ambassadeurs à codes multiples. |
| Page de référence | `/design/ambassadeur` (données fixes, 404 en production) sert aux tests de mise en page. |

Les sections "Decision", "Entities", "Rules" et "Consequences" ci-dessous sont l'état de mai 2026. Les paliers, l'expiration, les billets bonus et la révocation y sont **remplacés** par les amendements ci-dessus. Pour le code actuel : [implementation-guide-ambassador.md](../guides/implementation-guide-ambassador.md).

---

## Decision

### Décisions de reprise — 2026-09-21

- ~~Le programme de rewards est annuel.~~ **Caduc depuis le 2026-11-02** : `program_year` est la clé d'une saison, lue dans `ambassador_program_season`.
- ~~Chaque reward expire le 31 décembre.~~ **Caduc depuis le 2026-11-02** : une reward expire à `ends_at` de la saison (31 décembre 2027 pour la première). Une reward expirée reste visible dans l'historique.
- Une reward peut être annulée puis rouverte. Ces transitions ne suppriment ni les dates historiques ni le motif : elles exigent une commande idempotente, un auteur et un audit métier append-only.
- La conservation des événements d'audit métier est de **24 mois**. La purge est une opération séparée, vérifiable et ne doit jamais s'appuyer sur les logs HTTP bruts.
- Ces décisions ne modifient pas les tables historiques globales. Elles seront appliquées via une migration d'extension après inventaire live des contraintes, RLS, fonctions et organisation propriétaire des données existantes.

Overbound includes an **Ambassador Referral Program** where ambassadors earn points based on registrations they refer, unlock rewards on a ladder stored in the database (8 levels in 2027), and earn a free bib every 5 points above 30.

**Points System**:
- **1 point** per successful OPEN format registration
- **2 points** per successful RANKED format registration
- **0 points** for pending, cancelled, or refunded registrations

**Reward Levels** : paliers en base (`ambassador_reward_levels`), 8 en 2027 de 1 à 30 points. Voir l'amendement du 2026-11-02.

**Dossards bonus** : un dossard offert tous les 5 points au-dessus de 30, sans plafond (`ambassador_program_rules`).

---

## Rationale

### Growth & Engagement

- Ambassadors create viral loop: refer friends → earn points → unlock rewards → continue referring
- Tiered rewards maintain engagement (clear progression)
- Format bonus (2pts RANKED vs 1pt OPEN) rewards higher-value registrations

### Points Tracking

- Per-event tracking (ambassador_points_events table) enables:
  - Leaderboards (seasonal, event-based)
  - Reward fulfillment (match points to specific orders)
  - Audit trail (who referred whom)

---

## Entities

### Ambassador

```typescript
interface Ambassador {
  id: UUID
  profile_id: UUID
  promotional_code_id: UUID | null  // Deprecated (multi-code now)
  created_at: Timestamp
}
```

### AmbassadorPromotionalCode (Multi-Code Support)

```typescript
interface AmbassadorPromotionalCode {
  id: UUID
  ambassador_id: UUID
  promotional_code_id: UUID
  is_current: boolean              // Active code
  activated_at: Timestamp
  deactivated_at: Timestamp | null
}
```

### AmbassadorPoints

```typescript
interface AmbassadorPoints {
  ambassador_id: UUID
  total_points: number             // Aggregate
  recruits_open: number            // Count: OPEN registrations
  recruits_ranked: number          // Count: RANKED registrations
  updated_at: Timestamp
}
```

### AmbassadorPointsEvent

```typescript
interface AmbassadorPointsEvent {
  id: UUID
  ambassador_id: UUID
  registration_id: UUID            // Referral registration
  event_id: UUID
  points_awarded: number           // 1 or 2
  race_format: 'open' | 'ranked'
  awarded_at: Timestamp
}
```

### AmbassadorReward

```typescript
interface AmbassadorReward {
  id: UUID
  ambassador_id: UUID
  reward_level: number
  reward_name: string
  status: 'earned' | 'claimed' | 'fulfilled'
  earned_at: Timestamp
  claimed_at: Timestamp | null
  fulfilled_at: Timestamp | null
}
```

---

## Rules

### Points Award Workflow

1. **Registration created** → payment confirmed
2. **RPC `award_ambassador_points_for_order()`**
   - Query: order.promotional_code_id
   - Check: is code ∈ ambassador_promotional_codes?
   - If YES: INSERT ambassador_points_events (ledger), then ambassador_sync_points recalcule ambassador_points_years
   - If NO: (not an ambassador referral, skip)
3. **Detect format**: registration.race_format (auto-detected: "open" or "ranked")
4. **Award points**: 1 for OPEN, 2 for RANKED
5. **Notify ambassador**: optional email/notification

### Reward Levels

Les paliers ne sont plus dans ce document ni dans le code : ils vivent dans `ambassador_reward_levels`, versionnés par `effective_year`. Échelle 2027 : 1 badge, 3 code -50 %, 5 T-shirt, 8 dossard Open, 12 mise en avant réseaux, 20 dossard Ranked, 25 pack média, 30 Ambassadeur Or. Au-dessus de 30, un dossard offert tous les 5 points :

```typescript
// getExtraTicketsEarned(bonus, totalPoints), bonus = { base_points: 30, interval_points: 5 }
// 34 pts = 0, 35 pts = 1, 40 pts = 2
Math.floor((totalPoints - bonus.base_points) / bonus.interval_points)  // si totalPoints >= base + interval
```

### Reward Claiming

Rewards are:
1. **Earned** automatically when points threshold reached
2. **Claimed** by user via dashboard
3. **Fulfilled** by admin (tickets issued, discounts applied, etc.)

---

## Consequences

### Positive

- ✅ Viral growth loop (ambassadors recruit friends)
- ✅ Format bonus encourages RANKED participation
- ✅ Audit trail (every point tracked to source registration)
- ✅ Dossards bonus sans plafond (pas de plafond pour ne pas démotiver le meilleur recruteur)

### Negative / Constraints

- ❌ Promo code must be included in order metadata (fragile if not enforced)
- ❌ Claiming workflow requires admin approval (operational overhead)
- ❌ Multi-code support adds complexity (which code is "active"?)
- ✅ Les points sont révoqués si l'inscription est remboursée ou annulée (`revoked_at`, jamais de suppression).

### Dependencies

- Requires order.promotional_code_id in Stripe metadata (code reconnu comme ambassadeur par `isAmbassadorPromoRow`)
- RPC `award_ambassador_points_for_order()` must be reliable
- Ambassador profile must exist before registrations can award points

---

## Implementation

See [implementation-guide-ambassador.md](../guides/implementation-guide-ambassador.md) for code details.

### Key Functions

| Function | Purpose |
|----------|---------|
| `getNextReward(levels, totalPoints)` | Next reward to aim for |
| `getExtraTicketsEarned(bonus, totalPoints)` | Dossards bonus au-dessus de 30 points |
| `getCurrentRewardLevel(levels, totalPoints)` | Highest level unlocked |
| `loadProgramRules(admin, season)` | Paliers et règle bonus de la saison |
| `loadCurrentSeason(admin)` | Saison en cours |
| `award_ambassador_points_for_order()` | RPC entry point |

### Code References

- [src/lib/ambassadors/program.ts](../../../src/lib/ambassadors/program.ts) — reward levels + formulas
- [src/lib/ambassadors/dashboard/](../../../src/lib/ambassadors/dashboard/) — chargement et logique pure du dashboard
- [src/app/api/ambassadors/dashboard/route.ts](../../../src/app/api/ambassadors/dashboard/route.ts) — full dashboard data
- [src/app/api/ambassadors/rewards/claim/route.ts](../../../src/app/api/ambassadors/rewards/claim/route.ts) — claim reward

---

## Testing

```typescript
describe('Ambassador Points', () => {
  it('should award 1 point for OPEN registration', () => {
    // Order with amb code, OPEN registration → 1 point
  })
  
  it('should award 2 points for RANKED registration', () => {
    // Order with amb code, RANKED registration → 2 points
  })
  
  it('should not award points if no amb code', () => {
    // Order without amb code → 0 points to any ambassador
  })
})

describe('Reward Levels', () => {
  it('should unlock the T-shirt level at 5 points', () => {
    // 4 pts = level 2 (code -50 %), 5 pts = level 3 unlocked
  })

  it('should calculate bonus bibs correctly', () => {
    // 34 pts = 0 bonus, 35 pts = 1 bonus, 40 pts = 2 bonus
  })
})
```

---

## Monitoring & Maintenance

### Query: Top Ambassadors

```sql
SELECT 
  a.id, p.email,
  ap.total_points,
  ap.recruits_open, ap.recruits_ranked,
  ROW_NUMBER() OVER (ORDER BY ap.total_points DESC) as rank
FROM ambassadors a
JOIN profiles p ON a.profile_id = p.id
JOIN ambassador_points ap ON a.id = ap.ambassador_id
ORDER BY ap.total_points DESC
LIMIT 10;
```

### Alerts

- 🔴 **Critical**: Points awarded for cancelled registration (should be reverted)
- 🟡 **Warning**: Ambassador with multi-code (is_current not unique)
- 🟢 **Info**: Monthly ambassador growth, average points per ambassador
