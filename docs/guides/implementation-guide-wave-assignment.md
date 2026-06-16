# Implementation Guide: Wave Assignment (OPEN vs RANKED)

**For**: Developers implementing or modifying wave assignment logic  
**Related**: [FDR-0004](../fdr/FDR-0004-wave-assignment-open-vs-ranked.md)

---

## Quick Start

### What Happens When Payment Completes?

1. Stripe webhook received → payment confirmed
2. Registration created in database
3. **Format detection** : Is ticket OPEN or RANKED?
   - **OPEN** → Call RPC `assign_open_wave_to_registration()` → get wave slot
   - **RANKED** → Leave wave fields NULL and set `start_time` → single 08:00 start
4. Return registration to user with assigned slot (or NULL for RANKED)

---

## File Structure

```
src/
├── lib/
│   ├── openSas.ts                        # Wave config + format detection
│   ├── slotAssignment.ts                 # Bin-packing algorithm
│   ├── groups/
│   │   ├── resolveGroupAnchor.ts         # Find group anchor for sync
│   │   └── syncOpenGroupWave.ts          # Force member to anchor wave
│   └── registration.ts                   # Promo calc + utilities
├── app/
│   └── api/
│       ├── webhooks/stripe/route.ts      # Entry: payment confirmed
│       └── registrations/create/route.ts # Manual registration
├── types/
│   ├── Registration.ts                   # All wave fields
│   └── Event.ts                          # EventWave type
└── tests/
    └── slotAssignment.test.ts            # Algorithm tests
```

---

## Core Concepts

### 1. Format Detection

**Always use the helper function, never check IDs:**

```typescript
// ✅ CORRECT
import { isOpenFormatTicket, isRankedFormatTicket } from '@/lib/openSas'

const isOpen = isOpenFormatTicket(ticket.name, race.name)
const isRanked = isRankedFormatTicket(ticket.name, race.name)

// ❌ WRONG - never do this
if (ticket.id === HARDCODED_OPEN_TICKET_ID) { ... }
```

**Implementation** ([src/lib/openSas.ts](../../../src/lib/openSas.ts)):

```typescript
export const isOpenFormatTicket = (
  ticketName?: string | null,
  raceName?: string | null
): boolean => {
  const combined = `${ticketName ?? ''} ${raceName ?? ''}`.toLowerCase()
  return combined.includes('open')
}

export const isRankedFormatTicket = (
  ticketName?: string | null,
  raceName?: string | null
): boolean => {
  const combined = `${ticketName ?? ''} ${raceName ?? ''}`.toLowerCase()
  return combined.includes('ranked')
}
```

### 2. Wave Configuration

**All constants in one place** ([src/lib/openSas.ts](../../../src/lib/openSas.ts)):

```typescript
export const OPEN_WAVE_CONFIG = {
  FIRST_DEPARTURE: '12:00',
  WAVE_COUNT: 24,                  // current app uses wave_index 1-24
  INTERVAL_MINUTES: 10,            // 10min between waves
  LAST_DEPARTURE: '15:50',
  DEFAULT_CAPACITY: 50,            // Spots per wave
}

// Derive wave times
export const getWaveStartTime = (waveIndex: number, eventDate: Date): Date => {
  const [hours, minutes] = OPEN_WAVE_CONFIG.FIRST_DEPARTURE.split(':').map(Number)
  const base = new Date(eventDate)
  base.setHours(hours, minutes, 0, 0)
  base.setMinutes(base.getMinutes() + waveIndex * OPEN_WAVE_CONFIG.INTERVAL_MINUTES)
  return base
}
```

### 3. Slot Assignment Algorithm

Located in [src/lib/slotAssignment.ts](../../../src/lib/slotAssignment.ts). It's a **generic bin-packing** algorithm used for wave assignment.

**Input:**
- Slots (waves): id, capacity, current assigned count
- Registrations: preferred window, preferred slots, priority

**Output:**
- Assignments: registration → slot
- Unassigned: registrations that couldn't fit + reason why

**Algorithm:**
1. Sort registrations by priority (higher first)
2. For each registration:
   - Find candidate slots (respect preferred window if provided)
   - Calculate allocation score = `(current + new) / capacity`
   - Pick slot with **lowest score** (best fit)
   - Tiebreaker: prefer **earlier** slot
3. Track unassigned with reason

**Example:**

```typescript
import { assignSlots } from '@/lib/slotAssignment'

const slots: SlotInput[] = [
  { slotId: 'wave_1', startTime: '12:00', capacity: 50, assignedCount: 30 },
  { slotId: 'wave_2', startTime: '12:10', capacity: 50, assignedCount: 45 },
  { slotId: 'wave_3', startTime: '12:20', capacity: 50, assignedCount: 20 },
]

const registrations: RegistrationInput[] = [
  { 
    registrationId: 'reg_1', 
    orderId: 'order_1',
    preferredWindow: { from: '12:00', to: '12:30' },  // preferred 12:00-12:30
    priority: 10 
  },
]

const result = assignSlots(registrations, slots, { 
  capacityPerSlot: 50,
  allowOutsideWindow: false  // strict: must fit in window
})

// result.assignments = { 'reg_1': 'wave_2' }  (wave_2 has best score + in window)
// result.slotsState = { 'wave_2': { assignedCount: 21, remainingCapacity: 29 } }
```

---

## Main Entry Points

### Entry 1: Stripe Webhook (Payment Confirmed)

**File**: [src/app/api/webhooks/stripe/route.ts](../../../src/app/api/webhooks/stripe/route.ts#L300)

**Flow**:

```typescript
// Webhook handler
export async POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(...)
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    
    // 1. Fetch order from stripe metadata
    const order = await getOrderById(paymentIntent.metadata.order_id)
    
    // 2. For each item in order:
    for (const item of order.items) {
      const registration = await createRegistration({
        order_id: order.id,
        email: order.email,
        ticket_id: item.ticket_id,
        // ... other fields
      })
      
      // 3. Determine format
      const ticket = await getTicketById(item.ticket_id)
      const race = await getRaceById(ticket.race_id)
      
      if (isOpenFormatTicket(ticket.name, race.name)) {
        // 4. Assign wave via RPC
        await assignOpenWaveToRegistration(registration)
      }
      // else: RANKED, leave wave fields NULL
    }
  }
}
```

**Helper function**:

```typescript
// In src/lib/registration.ts or similar
export const assignOpenWaveToRegistration = async (
  supabase: SupabaseClient,
  registration: Registration,
  eventDate: Date
): Promise<void> => {
  const result = await supabase.rpc('assign_open_wave_to_registration', {
    p_event_id: registration.event_id,
    p_registration_id: registration.id,
    p_first_departure: buildOpenWaveSchedule(eventDate.toISOString()).firstDeparture.toISOString(),
    p_wave_count: OPEN_WAVE_CONFIG.WAVE_COUNT,
    p_slots_per_wave: OPEN_WAVE_CONFIG.DEFAULT_CAPACITY,
    p_group_anchor_wave_index: registration.group_anchor_wave_index ?? null,
  })
  
  if (result.error) {
    console.error('Wave assignment failed:', result.error)
    throw new Error(`Could not assign wave: ${result.error.message}`)
  }
}
```

### Entry 2: Manual Registration

**File**: [src/app/api/registrations/create/route.ts](../../../src/app/api/registrations/create/route.ts#L500)

Similar to webhook, but called from user-facing endpoint.

### Entry 3: Transfer RANKED → OPEN

**File**: [scripts/sql/transfer_ranked_to_open.sql](../../../scripts/sql/transfer_ranked_to_open.sql)

See [critical-operations.md](critical-operations.md#transfer_ranked_to_open) for complete guide.

---

## Group Anchor Synchronization

### Scenario

User is member of group with anchor on event X.  
User already has OPEN registration on event X.  
**Requirement**: All OPEN registrations for this user on event X must be on the anchor wave.

### Implementation

Two functions work together:

#### 1. Resolve Group Anchor

**File**: [src/lib/groups/resolveGroupAnchor.ts](../../../src/lib/groups/resolveGroupAnchor.ts)

```typescript
export const resolveGroupAnchorFromProfile = async (
  supabase: SupabaseClient,
  groupId: string,
  profileId: string,
  eventId?: string
): Promise<{ wave_index: number; start_time: Date } | null> => {
  // Find user's FIRST OPEN registration
  // (if no event specified, use any event; else filter to eventId)
  const { data: reg } = await supabase
    .from('registrations')
    .select('wave_index, start_time')
    .eq('user_id', profileId)
    .neq('wave_index', null)  // Only OPEN (RANKED has NULL wave_index)
    .eq('event_id', eventId || undefined)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  
  if (reg) {
    return { wave_index: reg.wave_index, start_time: reg.start_time }
  }
  return null
}
```

#### 2. Sync OPEN Registrations

**File**: [src/lib/groups/syncOpenGroupWave.ts](../../../src/lib/groups/syncOpenGroupWave.ts)

```typescript
export const syncOpenRegistrationsToWave = async (
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  targetWaveIndex: number,
  targetStartTime: Date
): Promise<number> => {
  // Update all OPEN registrations for this user on this event
  const { error, count } = await supabase
    .from('registrations')
    .update({
      wave_index: targetWaveIndex,
      start_time: targetStartTime,
      wave_position: /* calculate next position in wave */,
      auto_assigned: false,  // Track it was forced
    })
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .neq('wave_index', null)  // Only OPEN
  
  if (error) throw error
  return count
}
```

#### 3. Call on Group Join

**File**: [src/app/api/groups/join/route.ts](../../../src/app/api/groups/join/route.ts#L150)

```typescript
export async POST(req: Request) {
  const { group_id, invite_code } = await req.json()
  
  // 1. Add user to group
  await addGroupMember(group_id, userId)
  
  // 2. Check if group has anchor
  const group = await getGroupById(group_id)
  
  if (group.anchor_event_id && group.anchor_wave_index !== null) {
    // 3. Sync user's OPEN registrations to anchor wave
    await syncOpenRegistrationsToWave(
      userId,
      group.anchor_event_id,
      group.anchor_wave_index,
      group.anchor_start_time
    )
  } else {
    // 4. If no anchor yet, try to initialize one from this user
    const anchor = await resolveGroupAnchorFromProfile(group_id, userId)
    if (anchor) {
      await updateGroupAnchor(group_id, {
        anchor_event_id: eventId,
        anchor_wave_index: anchor.wave_index,
        anchor_start_time: anchor.start_time,
        anchor_initialized_by: 'member_join',
        anchor_initialized_from_profile_id: userId,
      })
    }
  }
}
```

---

## Debugging & Queries

### Check Wave Assignment for a Registration

```sql
SELECT 
  r.id,
  r.user_id,
  r.ticket_id,
  t.name as ticket_name,
  r.wave_index,
  r.start_time,
  r.wave_position,
  r.wave_capacity
FROM registrations r
JOIN tickets t ON t.id = r.ticket_id
WHERE r.id = 'YOUR_REGISTRATION_ID';
```

### Check Wave Occupancy

```sql
SELECT 
  ew.event_id,
  ew.wave_index,
  ew.start_time,
  ew.capacity,
  ew.assigned_count,
  ew.capacity - ew.assigned_count as remaining,
  COUNT(r.id) as actual_count
FROM event_waves ew
LEFT JOIN registrations r 
  ON r.event_id = ew.event_id 
  AND r.wave_index = ew.wave_index
WHERE ew.event_id = 'YOUR_EVENT_ID'
GROUP BY ew.id
ORDER BY ew.wave_index;
```

### Check Group Anchor Status

```sql
SELECT 
  g.id,
  g.name,
  g.captain_id,
  g.anchor_event_id,
  g.anchor_wave_index,
  g.anchor_start_time,
  g.anchor_initialized_by,
  COUNT(gm.profile_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE g.id = 'YOUR_GROUP_ID'
GROUP BY g.id;
```

### Find Registrations Out of Sync with Group Anchor

```sql
SELECT 
  g.id as group_id,
  gm.profile_id,
  COUNT(DISTINCT r.wave_index) as distinct_wave_indices
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN registrations r 
  ON gm.profile_id = r.user_id 
  AND r.event_id = g.anchor_event_id
  AND r.wave_index IS NOT NULL
WHERE g.anchor_event_id IS NOT NULL
GROUP BY g.id, gm.profile_id
HAVING COUNT(DISTINCT r.wave_index) > 1  -- Multiple waves = OUT OF SYNC
ORDER BY g.id;
```

---

## Testing

### Unit Tests

File: [src/lib/slotAssignment.test.ts](../../../src/lib/slotAssignment.test.ts)

```typescript
describe('slotAssignment', () => {
  it('should respect slot capacity constraints', () => {
    // Test: can't assign to full slot
  })
  
  it('should honor preferred window', () => {
    // Test: slot outside window rejected if allowOutsideWindow=false
  })
  
  it('should tiebreak earlier slot', () => {
    // Test: equal scores → pick earlier start time
  })
  
  it('should track unassigned with reason', () => {
    // Test: NO_SLOT_IN_WINDOW, ORDER_TOO_LARGE, etc.
  })
})
```

Run:
```bash
npm run test -- slotAssignment
```

### Integration Tests

```typescript
describe('Wave Assignment Workflow', () => {
  it('should assign OPEN registration to a wave', async () => {
    // 1. Create order
    // 2. Simulate Stripe webhook
    // 3. Verify registration.wave_index is 1-24
    // 4. Verify event_waves.assigned_count incremented
  })
  
  it('should sync group member to anchor wave', async () => {
    // 1. Create group with anchor
    // 2. Create member registration (different wave initially)
    // 3. Call POST /api/groups/join
    // 4. Verify member's wave_index = anchor_wave_index
  })
  
  it('should handle RANKED (no wave assignment)', async () => {
    // 1. Create RANKED registration
    // 2. Verify wave_index, start_time, wave_position are NULL
  })
})
```

---

## Common Pitfalls

### Pit fall 1: Hardcoded Ticket IDs

❌ **BAD**:
```typescript
if (ticket.id === 'uuid-open-ticket') { ... }
```

✅ **GOOD**:
```typescript
if (isOpenFormatTicket(ticket.name, race.name)) { ... }
```

**Why**: Ticket IDs change across environments. Format name is stable.

### Pitfall 2: Forgetting Wave Counter Update

❌ **BAD**: Assign wave but forget to update event_waves.assigned_count

✅ **GOOD**: RPC handles this automatically (has trigger), but verify in tests.

### Pitfall 3: Group Anchor Changes

❌ **BAD**: Update group anchor without re-syncing all members

✅ **GOOD**: Call syncOpenRegistrationsToWave for all members when anchor changes

### Pitfall 4: Preferred Window at Timezone Boundary

⚠️ Preferred window times should be in **event timezone**, not UTC.

```typescript
// If event is in Europe/Paris:
const eventDate = new Date('2026-09-20')
const prefStart = new Date('2026-09-20T09:00:00+02:00')  // CEST
const prefEnd = new Date('2026-09-20T11:00:00+02:00')

// Then wave times should also be in CEST
```

---

## Monitoring Checklist

- [ ] Wave counter matches actual registration count (query above)
- [ ] No registrations with NULL wave_index for OPEN tickets
- [ ] No registrations with non-NULL wave_index for RANKED tickets
- [ ] Group members all on same wave (if group has anchor)
- [ ] No wave_position > wave_capacity
- [ ] start_time always between 12:00-15:50 for OPEN
