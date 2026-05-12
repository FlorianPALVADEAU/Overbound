# FDR-0004 - Wave Assignment : OPEN vs RANKED Format

**Status**: Accepted (Production)  
**Date**: May 2026  
**References**: [implementation-guide-wave-assignment.md](../guides/implementation-guide-wave-assignment.md)

---

## Decision

Overbound offers two distinct wave assignment strategies based on ticket format:

1. **OPEN Format**: Distributed slots across 24 waves from 08:00 to 11:50 (10-minute intervals, 50 spots per wave).
   - Participants get an assigned start time within their preferred window.
   - Smart bin-packing algorithm balances load across waves.
   - Respects group anchors when user is member of an anchored group.

2. **RANKED Format**: Single unified departure at 15:00.
   - All participants start together.
   - No wave assignment (`wave_index`, `wave_position`, `wave_capacity` remain NULL).
   - No preferred window logic.

---

## Rationale

### Scalability & UX

- **OPEN**: Allows organizing thousands of participants without congestion. Early starters (08:00) have less crowding; late starters (11:50) have less wait time.
- **RANKED**: Competitive format where all participants race simultaneously. Simpler, no slot management overhead.

### Format Detection

Format is determined by **case-insensitive string matching** on ticket/race names:

```sql
-- SQL pattern (used in transfer_ranked_to_open.sql)
POSITION('open' IN LOWER(ticket.name || ' ' || race.name)) > 0
POSITION('ranked' IN LOWER(ticket.name || ' ' || race.name)) > 0
```

**Important**: Format detection is **never** based on ticket/race IDs alone. It depends on naming convention.

---

## Entities

### Registration

Core fields involved in wave assignment:

```typescript
interface Registration {
  id: UUID
  event_id: UUID
  ticket_id: UUID
  user_id: UUID
  
  // Wave assignment fields (OPEN only; NULL for RANKED)
  wave_index: number | null        // 0-23 for OPEN, NULL for RANKED
  wave_position: number | null     // Position within wave (1-50)
  wave_capacity: number | null     // Capacity of wave (typically 50)
  start_time: Timestamp | null     // Actual start time 08:00-11:50
  
  // Preference fields (used during assignment)
  preferred_window_start: Timestamp | null
  preferred_window_end: Timestamp | null
  distance_ideal_km: number | null  // Used to select best-fit wave
  
  // State
  auto_assigned: boolean | null
  assignment_constraint_breached: boolean | null
}
```

### EventWaves

Tracks capacity and occupancy per wave:

```typescript
interface EventWave {
  event_id: UUID
  wave_index: number              // 0-23
  start_time: Timestamp           // 08:00, 08:10, 08:20, ...
  capacity: number                // Typically 50
  assigned_count: number          // Current registrations in this wave
}
```

### Ticket & Race

```typescript
interface Ticket {
  id: UUID
  event_id: UUID
  name: string                    // e.g., "Primal OPEN", "Fury RANKED"
  race_id: UUID | null
}

interface Race {
  id: UUID
  name: string
  distance_km: number
}
```

---

## Rules

### OPEN Assignment Workflow

When a registration is created with an OPEN ticket:

1. **Entry point**: Stripe webhook confirms payment → `POST /api/registrations/create`
2. **Format check**: Call `isOpenFormatTicket(ticket, race)` → validates format
3. **RPC call**: `assign_open_wave_to_registration()`
   - Input: `event_id`, `registration_id`, `first_departure` (08:00), `wave_count` (24), `interval_minutes` (10), `default_capacity` (50)
   - Optional: `preferred_start`, `preferred_end`, `distance_ideal_km` (if provided by participant)
   - Output: assigns `wave_index`, `start_time`, `wave_position`
4. **Wave counter update**: `UPDATE event_waves SET assigned_count = COUNT(...)` for affected wave
5. **Response**: return registration with populated slot

### Wave Configuration (Fixed)

```
Waves: 24 total
First departure: 08:00 (8am)
Interval: 10 minutes
Last departure: 11:50 (11:50am)
Capacity per wave: 50 (default)
```

Timeline:
```
Wave 0:  08:00
Wave 1:  08:10
Wave 2:  08:20
...
Wave 23: 11:50
```

### Preferred Window Logic

If participant specifies preferred window (e.g., 08:00-10:00):

- Algorithm picks **best-fit wave** within that window
- If no slot available in window → retry with default window 08:00-11:50 (via `allowOutsideWindow` flag)
- Tiebreaker: prefer **earlier** slot if tie in allocation score

### Group Anchor Sync

**Critical**: If participant is member of a group with **anchor on this event**:

- **Override** standard assignment: force registration to group's `anchor_wave_index`
- Record `start_time` = group's `anchor_start_time`
- Respect `anchor_initialized_by` (creator / member_join / admin_manual) tracking

**Implementation**: See [FDR-0005](FDR-0005-group-membership-and-wave-anchoring.md).

### RANKED (No Assignment)

- Leave `wave_index`, `wave_position`, `wave_capacity`, `start_time` as **NULL**
- Participant appears in single race at 15:00
- No slot management required

### Wave Counter Maintenance

After every registration creation / modification affecting waves:

```sql
UPDATE event_waves ew
SET assigned_count = sub.open_count, updated_at = NOW()
FROM (
  SELECT ew2.event_id, ew2.wave_index, COUNT(reg.id) as open_count
  FROM event_waves ew2
  LEFT JOIN registrations reg ON ...
  WHERE ew2.event_id = ?
  GROUP BY ew2.event_id, ew2.wave_index
) AS sub
WHERE ew.event_id = sub.event_id AND ew.wave_index = sub.wave_index
```

**Risk**: Out-of-sync counters cause incorrect "wave full" checks → must refresh after **every** mutation.

---

## Consequences

### Positive

- ✅ Distributed start times reduce crowding, improve UX
- ✅ Bin-packing algorithm ensures fair load distribution
- ✅ Supports group coherence (families, teams start together)
- ✅ Scalable to thousands of participants
- ✅ Format-agnostic approach (new formats easy to add)

### Negative / Constraints

- ❌ Slot assignment is **not reversible** (once assigned, difficult to swap without full recalculation)
- ❌ Wave counter must be carefully maintained (async updates risk inconsistency)
- ❌ Group anchor creates hard dependency: can't change group anchor without re-syncing all members' registrations
- ❌ Transfer RANKED→OPEN requires complex script (see [critical-operations.md](../guides/critical-operations.md))

### Dependencies

- **RPC `assign_open_wave_to_registration`**: Must be deployed before any OPEN ticket registrations are accepted
- **EventWaves pre-population**: Event setup must create 24 wave records per event
- **Group anchor**: Groups must pre-exist (or be created) before OPEN members join

---

## Implementation

### Code References

| File | Purpose |
|------|---------|
| [src/lib/openSas.ts](../../../src/lib/openSas.ts) | Wave configuration constants + `isOpenFormatTicket()` |
| [src/lib/slotAssignment.ts](../../../src/lib/slotAssignment.ts) | Bin-packing algorithm (generic, reusable) |
| [src/app/api/webhooks/stripe/route.ts](../../../src/app/api/webhooks/stripe/route.ts#L320) | Entry point: payment confirmed → call assign RPC |
| [src/app/api/registrations/create/route.ts](../../../src/app/api/registrations/create/route.ts) | Manual registration endpoint (also calls assign) |
| [scripts/sql/transfer_ranked_to_open.sql](../../../scripts/sql/transfer_ranked_to_open.sql) | Transfer operation with group anchor check |
| [migrations/20260512_groups_anchor_source.sql](../../../migrations/20260512_groups_anchor_source.sql) | Tracking group anchor provenance |

### Key Workflows

#### 1. Payment Confirmed → Wave Assignment

```typescript
// Stripe webhook payload received
const registration = await createRegistration(order);

if (isOpenFormatTicket(ticket, race)) {
  // Call RPC to assign wave
  const result = await supabase.rpc('assign_open_wave_to_registration', {
    p_event_id: registration.event_id,
    p_registration_id: registration.id,
    p_first_departure: '2026-09-20T08:00:00Z',
    p_wave_count: 24,
    p_interval_minutes: 10,
    p_default_capacity: 50,
    // Optional:
    p_preferred_start: registration.preferred_window_start,
    p_preferred_end: registration.preferred_window_end,
  });
  
  // Wave counter auto-updated by RPC trigger
  return registration;
}
```

#### 2. Transfer RANKED → OPEN (with Group Anchor Check)

See [critical-operations.md](../guides/critical-operations.md) for full script + dry-run checklist.

Core logic:
```sql
-- 1. Validate source is RANKED
-- 2. Check if user is member of group with anchor on this event
-- 3a. If group anchor exists: force registration to anchor wave
-- 3b. Else: call RPC assign_open_wave_to_registration() for normal assignment
-- 4. Refresh event_waves counters
```

---

## Testing

### Unit Tests

Covered in [src/lib/slotAssignment.test.ts](../../../src/lib/slotAssignment.test.ts):

- ✅ Slot capacity constraints respected
- ✅ Preferred window honored (if available)
- ✅ Tiebreaker: earlier slot selected on tie
- ✅ Unassigned registrations tracked with reason
- ✅ Group size doesn't split across multiple waves

### Integration Tests

- ✅ Stripe webhook → registration created + wave assigned
- ✅ Transfer RANKED→OPEN with group anchor
- ✅ Wave counter accurate after bulk operations

### Manual QA Checklist

```
[ ] Create OPEN registration via UI → verify start_time in 08:00-11:50 range
[ ] Create OPEN registration with preferred window 09:00-10:00 → verify wave within window
[ ] Join group (with anchor) as OPEN member → verify registration syncs to anchor wave
[ ] Transfer RANKED→OPEN for group member → verify respects anchor (not 08:00-11:50 random)
[ ] Query event_waves.assigned_count → verify matches registration count per wave
[ ] Bulk transfer 100 RANKED→OPEN → verify wave counters refresh correctly
```

---

## Edge Cases & Gotchas

### Wave is Full

Current behavior: RPC raises exception if no slot available.

**Future improvement**: Auto-scale capacity or queue for overflow.

### Ticket without Race

If `race_id` is NULL, `distance_ideal_km` comparison falls back to ordering by `ticket.created_at`.

### Preferred Window Invalid

If `preferred_window_start > preferred_window_end`, treated as "no preference" (use default).

### Format Detection Edge Case

Ticket name: "Universal Tribal Kids (mixed format)"  
Race name: "Tribal Kids"

→ Both contain no "open" or "ranked" string.  
→ Fallback behavior: depends on RPC defaults (typically treats as OPEN if ambiguous).

**Mitigation**: Enforce strict naming convention (e.g., always include "OPEN" or "RANKED" in ticket name).

---

## Monitoring & Maintenance

### Queries to Monitor

```sql
-- Check for waves with out-of-sync counts
SELECT ew.event_id, ew.wave_index, ew.assigned_count, COUNT(reg.id) as actual
FROM event_waves ew
LEFT JOIN registrations reg ON reg.event_id = ew.event_id AND reg.wave_index = ew.wave_index
GROUP BY ew.event_id, ew.wave_index
HAVING ew.assigned_count != COUNT(reg.id);

-- Find registrations without wave assignment (likely RANKED)
SELECT COUNT(*) FROM registrations WHERE wave_index IS NULL AND ticket_id IN (SELECT id FROM tickets WHERE name LIKE '%OPEN%');

-- Check group anchor consistency
SELECT g.id, COUNT(DISTINCT gm.profile_id) as member_count, COUNT(DISTINCT reg.wave_index) as distinct_waves
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN registrations reg ON gm.profile_id = reg.user_id AND reg.event_id = g.anchor_event_id
GROUP BY g.id
HAVING COUNT(DISTINCT reg.wave_index) > 1;
```

### Alerts

- 🔴 **Critical**: Wave counter mismatch detected
- 🟡 **Warning**: Group members with different waves (anchor not synced)
- 🟢 **Info**: Wave distribution (e.g., 60% in first 8 waves)

