# FDR-0006 - Ambassador Program: Points & Rewards

**Status**: Accepted — implementation evidence is local only (audit 2026-09-20)
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

## Decision

### Décisions de reprise — 2026-09-21

- Le programme de rewards est annuel : chaque attribution porte un `program_year` immuable, calculé à la date d'attribution/paiement dans le fuseau du programme. Une course future payée en décembre appartient donc à l'année civile de son paiement, pas à l'année de l'événement.
- Chaque reward du programme annuel expire le **31 décembre à 23:59:59** dans le fuseau `Europe/Paris`. Dès le 1er janvier à 00:00, elle n'est plus réclamable mais reste visible dans l'historique de l'ambassadeur et dans les comparaisons annuelles.
- Une reward peut être annulée puis rouverte. Ces transitions ne suppriment ni les dates historiques ni le motif : elles exigent une commande idempotente, un auteur et un audit métier append-only.
- La conservation des événements d'audit métier est de **24 mois**. La purge est une opération séparée, vérifiable et ne doit jamais s'appuyer sur les logs HTTP bruts.
- Ces décisions ne modifient pas les tables historiques globales. Elles seront appliquées via une migration d'extension après inventaire live des contraintes, RLS, fonctions et organisation propriétaire des données existantes.

Overbound includes an **Ambassador Referral Program** where ambassadors earn points based on registrations they refer, unlock rewards at 10 levels, and earn extra tickets beyond level 10.

**Points System**:
- **1 point** per successful OPEN format registration
- **2 points** per successful RANKED format registration
- **0 points** for pending, cancelled, or refunded registrations

**Reward Levels**: 10 levels (1pt → 30pts), each with badge, discount, or ticket benefit

**Extra Tickets**: For every 3 points above 30, earn 1 extra ticket (unlimited)

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
   - If YES: INSERT ambassador_points_event + UPDATE ambassador_points
   - If NO: (not an ambassador referral, skip)
3. **Detect format**: registration.race_format (auto-detected: "open" or "ranked")
4. **Award points**: 1 for OPEN, 2 for RANKED
5. **Notify ambassador**: optional email/notification

### Reward Levels

| Level | Points | Reward | Notes |
|-------|--------|--------|-------|
| 1 | 1 | Badge ambassadeur + leaderboard | Entry level |
| 2 | 2 | Récompense starter (réduction/avantage) | — |
| 3 | 3 | Réduction 50% sur 1 dossard (72h) | Time-limited use |
| 4 | 5 | Dossard OPEN offert | Free ticket |
| 5 | 8 | Upgrade VIP (file prioritaire + badge) | Event benefit |
| 6 | 10 | T-shirt ambassadeur / réseau mention | Swag + visibility |
| 7 | 15 | Statut confirmé (avantages exclusifs) | Exclusive perks |
| 8 | 20 | Pack Média Offert | Sponsorship |
| 9 | 25 | Dossard édition suivante | Future event |
| 10 | 30 | Statut ambassadeur officiel (premium) | VIP status |

### Extra Tickets

For points **beyond level 10 (30pts)**:

```typescript
const extraTicketsEarned = Math.floor((totalPoints - 30) / 3)
// 31-32 pts = 0 extra
// 33 pts = 1 extra
// 36 pts = 2 extra
// 39 pts = 3 extra
// etc.
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
- ✅ Unlimited extra tickets (no cap on referral value)

### Negative / Constraints

- ❌ Promo code must be included in order metadata (fragile if not enforced)
- ❌ Claiming workflow requires admin approval (operational overhead)
- ❌ Multi-code support adds complexity (which code is "active"?)
- ❌ Points can't be revoked (if registration refunded, points stay)

### Dependencies

- Requires order.promotional_code_id in Stripe metadata
- RPC `award_ambassador_points_for_order()` must be reliable
- Ambassador profile must exist before registrations can award points

---

## Implementation

See [implementation-guide-ambassador.md](../guides/implementation-guide-ambassador.md) for code details.

### Key Functions

| Function | Purpose |
|----------|---------|
| `getRewardLevel(totalPoints)` | Current reward unlocked |
| `getNextReward(totalPoints)` | Next reward to aim for |
| `getExtraTicketsEarned(totalPoints)` | Extra tickets at this point level |
| `getCurrentRewardLevel()` | Query helper |
| `award_ambassador_points_for_order()` | RPC entry point |

### Code References

- [src/lib/ambassadors/program.ts](../../../src/lib/ambassadors/program.ts) — reward levels + formulas
- [src/lib/ambassadors/dashboardHelpers.ts](../../../src/lib/ambassadors/dashboardHelpers.ts) — dashboard queries
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
  it('should unlock level 4 at 5 points', () => {
    // 4 pts = level 3
    // 5 pts = level 4 unlocked
  })
  
  it('should calculate extra tickets correctly', () => {
    // 30 pts = 0 extra
    // 33 pts = 1 extra
    // 36 pts = 2 extra
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
