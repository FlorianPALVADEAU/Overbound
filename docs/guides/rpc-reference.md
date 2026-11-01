# RPC Reference

**For**: Developers calling PostgreSQL functions from Next.js API routes  
**Coverage**: All critical RPCs with signatures, side effects, and usage patterns

**Repository note (updated 2026-09-20)**: This guide mixes historical RPC descriptions and newer local migrations. It is not a live database contract. The checkout contains the four SAS/tenant migrations listed in FDR-0008, including ticket-scoped SAS RPCs, but neither their remote application nor their effective grants/RLS were verified. Verify the deployed database before changing a caller.

## Reprise / statut des RPCs SAS

| RPC / famille | Statut | Référence locale |
|---|---|---|
| `assign_open_wave_to_registration` et les flux event-wide associés | **abandonné comme cible** | Description historique ci-dessous. Les nouveaux parcours doivent utiliser des SAS configurés par billet, pas une capacité globale d'événement. |
| `assign_first_available_ticket_wave`, `assign_selected_wave_to_registration`, `sync_registration_to_group_anchor` | **fait localement** | Définis dans `20260920172444_ticket_scoped_event_waves.sql`, `SECURITY INVOKER`, puis `EXECUTE` restreint à `service_role`. Application distante à vérifier. |
| `admin_change_registration_ticket`, `admin_move_open_registration_wave`, `admin_confirm_ticket_change` | **partiel / historique** | Des définitions existent localement, mais leurs contrats ont évolué et doivent être confrontés à la base cible avant usage. Les nouvelles commandes doivent respecter `operations_config`, le cutoff J-1, l'idempotence et l'audit. |
| Inventaire complet des RPC, propriétaires et grants | **à faire (live)** | Le checkout ne permet pas de conclure sur `pg_proc`, `information_schema` ou les grants effectifs. |

Les signatures qui suivent sont conservées pour comprendre les appels existants; elles ne doivent pas être utilisées comme autorisation de créer ou d'appeler une fonction distante non vérifiée.

**Observed in code but not fully documented below**:
- `admin_overview`
- `get_registrations_with_filters`
- `get_active_tier_promo_code`
- `check_and_advance_tier_progression`
- `increment_promo_code_usage`

---

## assign_open_wave_to_registration

### Purpose
Assigns an OPEN format registration to a specific wave slot, respecting capacity and group anchor constraints.

### Signature
```sql
SELECT assign_open_wave_to_registration(
  p_event_id         UUID,
  p_registration_id  UUID,
  p_first_departure  TIMESTAMPTZ,
  p_wave_count       INT,
  p_slots_per_wave   INT,
  p_group_anchor_wave_index INT DEFAULT NULL
) RETURNS JSON;
```

### Parameters

| Param | Type | Description | Required |
|-------|------|-------------|----------|
| `p_event_id` | UUID | Event identifier | Yes |
| `p_registration_id` | UUID | Registration to assign | Yes |
| `p_first_departure` | TIMESTAMPTZ | First OPEN wave departure time (12:00 Europe/Paris) | Yes |
| `p_wave_count` | INT | Total waves (typically 24) | Yes |
| `p_slots_per_wave` | INT | Capacity per wave (typically 10-15) | Yes |
| `p_group_anchor_wave_index` | INT | If user in group, anchor wave (1-24 in current implementation) | No |

### Returns

```json
{
  "success": true,
  "wave_index": 5,
  "wave_position": 3,
  "start_time": "2026-09-12T10:50:00Z",
  "full_waves": false
}
```

### Side Effects

✅ **Modifies**:
- `registrations.wave_index`
- `registrations.wave_position`
- `registrations.start_time`
- `registrations.wave_capacity`
- `event_waves.assigned_count` (increment)

✅ **Does NOT**:
- Send emails
- Update orders
- Modify user profile

### Error Scenarios

| Error | Cause | Recovery |
|-------|-------|----------|
| `Wave overflow` | All slots full | Fall back to FIFO queue or waitlist |
| `Registration not found` | Invalid reg ID | Verify registration exists |
| `Anchor wave conflict` | Anchor > wave_count | Check anchor initialization |

### Usage Pattern

```typescript
// From src/app/api/registrations/create/route.ts

const result = await supabase.rpc('assign_open_wave_to_registration', {
  p_event_id: event.id,
  p_registration_id: registration.id,
  p_first_departure: event.starts_at,
  p_wave_count: 24,
  p_slots_per_wave: 15,
  p_group_anchor_wave_index: groupAnchor?.wave_index ?? null,
});

if (!result.data?.success) {
  throw new Error(`Wave assignment failed: ${result.data?.error}`);
}

const { wave_index, start_time } = result.data;
```

### Testing

```typescript
// Happy path: unanchored OPEN assignment
it('assigns registration to available wave', async () => {
  const result = await rpc('assign_open_wave_to_registration', {...});
  expect(result.data.wave_index).toBeDefined();
  expect(result.data.start_time).toMatch(/2026-09-12T1[0-3]:/);
});

// Edge case: group anchor forces specific wave
it('respects group anchor', async () => {
  const result = await rpc('assign_open_wave_to_registration', {
    p_group_anchor_wave_index: 7,
    ...
  });
  expect(result.data.wave_index).toBe(7);
});

// Edge case: all waves full
it('fails when no capacity', async () => {
  const result = await rpc('assign_open_wave_to_registration', {...});
  expect(result.data.success).toBe(false);
});
```

---

## award_ambassador_points_for_order

### Purpose
Crédite les points ambassadeur d'une commande payée avec un code ambassadeur (1 pt par inscription OPEN, 2 pts par inscription RANKED). Réécrite pour la saison continue : voir [implementation-guide-ambassador.md](./implementation-guide-ambassador.md) et le [FDR-0006](../fdr/FDR-0006-ambassador-program-points-and-rewards.md) (amendements 2026-11-01 et 2026-11-02).

### Signature
```sql
SELECT award_ambassador_points_for_order(p_order_id UUID);  -- RETURNS void
```

`EXECUTE` réservé à `service_role`. Appelée par les triggers `orders_award_ambassador_points_trigger` et `registrations_award_ambassador_points_trigger`, et, de façon redondante mais idempotente, par le webhook Stripe et `registrations/create`.

### Ce qui est ignoré (aucun point)
- commande créée avant `ambassador_program_season.started_at` (pas de rétroactivité) ;
- commande à 0 € ;
- auto-parrainage (l'email du participant est celui du compte de l'ambassadeur) ;
- inscription annulée.

### Side Effects

Modifie :
- `ambassador_points_events` : une ligne par couple (ambassadeur, inscription), unique, donc l'appel est idempotent ;
- `ambassador_points_years` : recalculé depuis le ledger par `ambassador_sync_points` (seul écrivain) ;
- `ambassador_rewards` : créées par `ambassador_reconcile_rewards` pour chaque palier atteint, avec `expires_at` = `ends_at` de la saison.

Ne fait pas : envoyer d'email (voir `rewardsNotifications.ts`), modifier la commande, toucher à l'ancienne table `ambassador_points` (dépréciée).

### Fonctions liées

| Fonction | Rôle |
|---|---|
| `revoke_ambassador_points(p_order_id, p_registration_id, p_reason)` | Pose `revoked_at` sur le ledger (jamais de suppression), retourne le nombre de lignes. Appelée par les triggers sur `registrations.cancelled_at` et `orders.status` (`refunded`, `cancelled`) |
| `ambassador_sync_points(p_ambassador_id, p_program_year)` | Recalcule l'agrégat de la saison (ledger + corrections admin) puis réconcilie les récompenses |
| `ambassador_reconcile_rewards(p_ambassador_id, p_program_year)` | Crée, annule ou rouvre les récompenses selon les points et l'échelle de la saison |
| `ambassador_ensure_rewards(p_ambassador_id)` | Réconcilie la saison en cours |
| `ambassador_current_season()`, `ambassador_season_started_at()` | Lecture de la ligne unique `ambassador_program_season` |
| `admin_adjust_ambassador_points(p_ambassador_id, p_program_year, p_total_points, p_recruits_open, p_recruits_ranked, p_reason, p_actor_profile_id, p_idempotency_key)` | Correction admin avec motif et clé d'idempotence |
| `admin_credit_manual_referral(p_ambassador_id, p_registration_id, p_points, p_race_format)` | Crédit d'un parrainage hors ligne, retourne un booléen |

### Usage Pattern

```typescript
// Le crédit est fait par les triggers. L'appel applicatif reste possible et idempotent :
const { error } = await admin.rpc('award_ambassador_points_for_order', { p_order_id: order.id })
if (error) console.warn(`Points award failed for order ${order.id}`, error)
```

### Testing

Le comportement SQL se vérifie sur la base de dev, dans une transaction annulée : attribution avant et après `started_at`, second appel sans effet (idempotence), remboursement (`revoked_at` posé, récompense non réclamée annulée), commande à 0 € et auto-parrainage sans point.

---

## sync_open_group_wave

### Purpose
Synchronizes all OPEN registrations in a group to match the group's anchor wave (e.g., after anchor is changed or group member joins).

### Signature
```sql
SELECT sync_open_group_wave(
  p_group_id        UUID,
  p_anchor_wave_index INT,
  p_anchor_start_time TIMESTAMPTZ
) RETURNS JSON;
```

### Parameters

| Param | Type | Description | Required |
|-------|------|-------------|----------|
| `p_group_id` | UUID | Group to sync | Yes |
| `p_anchor_wave_index` | INT | Target wave (1-24 in current implementation) | Yes |
| `p_anchor_start_time` | TIMESTAMPTZ | Target departure time | Yes |

### Returns

```json
{
  "success": true,
  "synced_count": 4,
  "rows_updated": 4
}
```

### Side Effects

✅ **Modifies**:
- `registrations.wave_index` (all OPEN members)
- `registrations.start_time` (all OPEN members)
- `event_waves.assigned_count` (may adjust if rebalancing)

✅ **Does NOT**:
- Send emails
- Move RANKED registrations
- Delete registrations

### Business Logic

1. **Find**: All group members on this event
2. **Filter**: Only OPEN format registrations
3. **Update**: wave_index → anchor, start_time → anchor_start_time
4. **Verify**: No registrations left dangling

### Error Scenarios

| Error | Cause | Recovery |
|-------|-------|----------|
| `Group not found` | Invalid group ID | Verify group exists |
| `Anchor wave invalid` | Wave index > wave_count | Check anchor initialization |
| `No members found` | Group empty | Create members first |

### Usage Pattern

```typescript
// From src/lib/groups/syncOpenGroupWave.ts (app-level helper, not an RPC call in the repository)

const result = await supabase.rpc('sync_open_group_wave', {
  p_group_id: group.id,
  p_anchor_wave_index: group.anchor_wave_index,
  p_anchor_start_time: group.anchor_start_time,
});

if (!result.data?.success) {
  throw new Error(`Sync failed: ${result.data?.error}`);
}

console.log(`Synced ${result.data.synced_count} members`);
```

### Testing

```typescript
// Happy path: sync OPEN members to anchor
it('syncs all OPEN registrations to anchor wave', async () => {
  const result = await rpc('sync_open_group_wave', {...});
  expect(result.data.synced_count).toBeGreaterThan(0);
});

// Edge case: no OPEN registrations
it('handles groups with no OPEN members', async () => {
  const result = await rpc('sync_open_group_wave', {...});
  expect(result.data.synced_count).toBe(0);
  expect(result.data.success).toBe(true);
});
```

---

## resolve_group_anchor

### Purpose
Finds the group's anchor wave by looking at the first OPEN registration (initialization logic).

### Signature
```sql
SELECT resolve_group_anchor(
  p_group_id UUID,
  p_event_id UUID
) RETURNS TABLE(
  anchor_wave_index INT,
  anchor_start_time TIMESTAMPTZ,
  anchor_source TEXT
);
```

### Parameters

| Param | Type | Description | Required |
|-------|------|-------------|----------|
| `p_group_id` | UUID | Group to resolve | Yes |
| `p_event_id` | UUID | Event to search | Yes |

### Returns

```
anchor_wave_index | anchor_start_time      | anchor_source
------------------+------------------------+--------------
              5   | 2026-09-12T10:50:00Z   | member_join
```

### Usage Pattern

```typescript
// When a new member joins a group
const { data } = await supabase.rpc('resolve_group_anchor', {
  p_group_id: group.id,
  p_event_id: event.id,
});

if (data?.[0]) {
  const { anchor_wave_index, anchor_start_time } = data[0];
  // Store as new anchor
}
```

---

## check_wave_full

### Purpose
Utility function to check if a wave has reached capacity (helper, not direct assignment).

### Signature
```sql
SELECT check_wave_full(
  p_event_id UUID,
  p_wave_index INT
) RETURNS BOOLEAN;
```

### Returns

`TRUE` if wave is at capacity, `FALSE` otherwise.

### Usage Pattern

```typescript
// Before attempting wave assignment
const isFull = await supabase.rpc('check_wave_full', {
  p_event_id: event.id,
  p_wave_index: 7,
});

if (isFull) {
  // Fallback to next available wave or waitlist
}
```

---

## RPC Calling Patterns

### Pattern 1: Direct assignment (registration creation)

```typescript
// Typical flow: POST /api/registrations/create

const { data: assigned, error } = await supabase.rpc(
  'assign_open_wave_to_registration',
  {
    p_event_id: event.id,
    p_registration_id: newRegistration.id,
    p_first_departure: event.starts_at,
    p_wave_count: 24,
    p_slots_per_wave: 15,
    p_group_anchor_wave_index: userGroupAnchor,
  }
);

if (error) throw error;

return {
  wave_index: assigned.wave_index,
  start_time: assigned.start_time,
};
```

### Pattern 2: Ambassador points award (webhook)

```typescript
// Stripe webhook: commande payée. Les triggers ont déjà crédité les points : l'appel est idempotent.
const { error } = await admin.rpc('award_ambassador_points_for_order', { p_order_id: order.id })
if (error) console.error('Points award failed:', error)
```

### Pattern 3: Group sync (anchor change)

```typescript
// Admin updates group anchor

const { data: synced, error } = await supabase.rpc(
  'sync_open_group_wave',
  {
    p_group_id: group.id,
    p_anchor_wave_index: 7,
    p_anchor_start_time: event.starts_at + 7 * 10min,
  }
);

if (error) throw error;
```

---

## Error Handling Best Practices

### Always check RPC return structure

```typescript
const { data, error } = await supabase.rpc('some_rpc', {...});

if (error) {
  // Log error details for debugging
  console.error('RPC error:', error.message);
  throw new APIError('Operation failed', 500);
}

if (!data?.success) {
  // Structured error from RPC (not connection error)
  console.warn('RPC returned failure:', data?.error);
  throw new APIError(data?.error ?? 'Unknown error', 400);
}
```

### Transaction safety

```typescript
// For operations that call multiple RPCs
try {
  await supabase.rpc('rpc_1', {...});
  await supabase.rpc('rpc_2', {...});
} catch (e) {
  // Transaction will auto-rollback at Postgres level if needed
  throw e;
}
```

---

## RPC Testing Checklist

For each RPC being called:

```
[ ] Dry-run in pgAdmin or psql first
[ ] Check parameter types match schema
[ ] Verify return structure in unit test
[ ] Test success path (happy case)
[ ] Test failure path (e.g., capacity full)
[ ] Check side effects with query
[ ] Verify no orphaned data created
[ ] Check RLS policies allow operation
[ ] Test with different user roles (if applicable)
```
