# RPC Reference

**For**: Developers calling PostgreSQL functions from Next.js API routes  
**Coverage**: All critical RPCs with signatures, side effects, and usage patterns

**Repository note**: The codebase calls several RPCs from application code, but the SQL definitions were not found in the repository migrations at the time of this audit. Treat the signatures below as the contract used by the app and verify the deployed database or add migrations before changing callers.

**Observed in code but not fully documented below**:
- `admin_overview`
- `get_registrations_with_filters`
- `get_active_tier_promo_code`
- `check_and_advance_tier_progression`
- `increment_promo_code_usage`
- `ambassador_reward_level_for_points`
- `ambassador_ensure_rewards`

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
Awards ambassador points when their promotional code is used in an order (1pt OPEN, 2pts RANKED).

### Signature
```sql
SELECT award_ambassador_points_for_order(
  p_order_id UUID
) RETURNS JSON;
```

### Parameters

| Param | Type | Description | Required |
|-------|------|-------------|----------|
| `p_order_id` | UUID | Order associated with promo code | Yes |

### Returns

```json
{
  "success": true,
  "ambassador_id": "amb-uuid",
  "points_awarded": 5,
  "total_points": 35,
  "reward_level": 2
}
```

### Side Effects

✅ **Modifies**:
- `ambassador_points.total_points` (increment)
- `ambassador_points.recruits_open` or `recruits_ranked` (increment based on format)
- `ambassador_points_history` (insert audit entry)

✅ **Does NOT**:
- Update order
- Send emails (handled separately in email service)
- Create reward entries (lazy-loaded on dashboard)

### Business Logic

1. **Lookup**: Find ambassador by promotional_code_id
2. **Detect Format**: Check registration format (OPEN or RANKED)
3. **Award**: +1pt per OPEN, +2pts per RANKED
4. **Update Tracking**: Increment recruits_open or recruits_ranked
5. **Audit**: Log in ambassador_points_history

### Error Scenarios

| Error | Cause | Recovery |
|-------|-------|----------|
| `Promo code not found` | Invalid code ID | Check code was inserted correctly |
| `Ambassador not found` | Code exists but no ambassador | Link code to ambassador first |
| `Already awarded` | Points already given for this order | Check for duplicate calls |

### Usage Pattern

```typescript
// From src/app/api/webhooks/stripe/route.ts and src/app/api/registrations/create/route.ts

const result = await supabase.rpc('award_ambassador_points_for_order', {
  p_order_id: order.id,
});

if (!result.data?.success) {
  console.warn(`Points award failed for order ${order.id}`);
}
```

### Testing

```typescript
// Happy path: OPEN format award
it('awards 1pt per OPEN registration', async () => {
  const result = await rpc('award_ambassador_points_for_order', {
    p_registration_count: 3,
    // assume OPEN format detected
  });
  expect(result.data.points_awarded).toBe(3);
});

// Edge case: RANKED format (2pts each)
it('awards 2pts per RANKED registration', async () => {
  const result = await rpc('award_ambassador_points_for_order', {
    p_registration_count: 2,
    // assume RANKED format detected
  });
  expect(result.data.points_awarded).toBe(4);
});

// Edge case: duplicate call protection
it('prevents duplicate points for same order', async () => {
  await rpc('award_ambassador_points_for_order', {...});
  const result2 = await rpc('award_ambassador_points_for_order', {...});
  expect(result2.data.success).toBe(false);
});
```

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
// Stripe webhook: order completed

for (const promo of order.promotional_codes) {
  const { data: awarded, error } = await supabase.rpc(
    'award_ambassador_points_for_order',
    {
      p_order_id: order.id,
      p_promotional_code_id: promo.id,
      p_registration_count: order.registrations.length,
    }
  );

  if (error) console.error('Points award failed:', error);
}
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
