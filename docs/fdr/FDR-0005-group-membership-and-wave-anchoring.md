# FDR-0005 - Group Membership & Wave Anchoring

**Status**: Accepted (Production)  
**Date**: May 2026  
**References**: [implementation-guide-groups.md](../guides/implementation-guide-groups.md), [FDR-0004](FDR-0004-wave-assignment-open-vs-ranked.md)

---

## Decision

Groups (Pack Entreprise) are collections of users (1 captain + N members) that can optionally establish a **wave anchor** on a specific event:

1. **Wave Anchor**: An OPEN wave that all OPEN members must be synchronized to
   - Enables corporate teams, families to start together at same time
   - When anchor is set → all NEW OPEN registrations on that event must be on anchor wave
   - **Existing** OPEN registrations are synced when member joins group

2. **Anchor Initialization**: Tracked via source (creator, member_join, admin_manual)
   - Enables audit trail + prevents accidental overwrites
   - Each initialization captured with timestamp + source profile

3. **RANKED Unaffected**: RANKED (15:00) registrations are never affected by group anchor

---

## Rationale

### Coherence & UX

- **Teams start together**: Corporate groups, sports clubs, families can coordinate arrivals
- **Admin control**: Via admin_manual, can forcibly anchor groups post-creation
- **Audit trail**: Track when/how anchor was set (creator vs member vs admin)

### Format Isolation

- **Only affects OPEN**: Group anchor is event-specific and format-agnostic (only OPEN has waves)
- **RANKED unaffected**: 15:00 departure is singleton, no groups needed

---

## Entities

### Group

```typescript
interface Group {
  id: UUID
  name: string
  captain_id: UUID              // User who created group
  invite_code: string           // Unique code (e.g., "ABC12345")
  
  // Wave anchor (NULL if not initialized)
  anchor_event_id: UUID | null
  anchor_wave_index: number | null    // 0-23 for OPEN waves
  anchor_start_time: Timestamp | null // e.g., 08:30:00
  
  // Anchor initialization tracking
  anchor_initialized_by: 'creator' | 'member_join' | 'admin_manual' | null
  anchor_initialized_from_profile_id: UUID | null
  anchor_initialized_at: Timestamp | null
  
  created_at: Timestamp
  updated_at: Timestamp
}
```

### GroupMember

```typescript
interface GroupMember {
  id: UUID
  group_id: UUID
  profile_id: UUID
  role: 'captain' | 'member'    // Only captain can edit group/invite
  joined_at: Timestamp
}
```

### Impact on Registration

When member joins group with anchor, his OPEN registrations sync:

```typescript
interface Registration {
  // ...existing fields...
  
  // Affected by group anchor?
  // If user is member of group with anchor on this event:
  //   wave_index = group.anchor_wave_index (forced)
  //   start_time = group.anchor_start_time (forced)
}
```

---

## Rules

### Anchor Initialization Sources

#### Source 1: Creator (when group created)

```typescript
// Captain creates group
const group = await createGroup({
  name: 'Team Acme',
  captain_id: userId  // Current user
})

// If captain has OPEN registration on event X:
//   → group.anchor_initialized_by = 'creator'
//   → group.anchor_event_id = X
//   → group.anchor_wave_index = captain's wave
//   → group.anchor_initialized_from_profile_id = captain_id
// Else:
//   → group.anchor_* = NULL (no anchor yet)
```

#### Source 2: Member Join (first member creates anchor)

```typescript
// Member 1 joins group (group has no anchor yet)
// Member 1 has OPEN registration on event X
// → group.anchor_initialized_by = 'member_join'
// → group.anchor_event_id = X
// → group.anchor_wave_index = member_1's wave
// → group.anchor_initialized_from_profile_id = member_1_id

// Member 2 joins (group now has anchor)
// → Member 2's OPEN registrations synced to anchor wave
// → group.anchor_* unchanged
```

#### Source 3: Admin Manual

```typescript
// Admin via UI or API:
PATCH /api/admin/groups/:id
{
  anchor_event_id: event_id,
  anchor_wave_index: 5,
  anchor_start_time: '2026-09-20T08:50:00Z'
}

// → group.anchor_initialized_by = 'admin_manual'
// → All OPEN members synced to wave 5
```

### Sync on Member Join

When user joins group:

```sql
1. Fetch group anchor (if exists)
2. Fetch user's OPEN registrations on anchor_event_id
3. For each OPEN registration:
   UPDATE registrations
   SET wave_index = anchor_wave_index,
       start_time = anchor_start_time,
       wave_position = NEXT_AVAILABLE
   WHERE id = registration_id
4. No change if:
   - Group has no anchor → user's waves unchanged
   - User registration is RANKED → unchanged (only OPEN affected)
   - User registration on different event → unchanged
```

### Transfer RANKED → OPEN (with Anchor Check)

Critical: When user's RANKED registration is transferred to OPEN on an event where user is group member with anchor:

```sql
1. Check if user ∈ group with anchor on this event
2. If YES:
   → Assign to anchor wave (NOT random 08:00-11:50 assignment)
   → Preserve group coherence
3. If NO:
   → Standard RPC assign_open_wave_to_registration()
```

**Script**: [scripts/sql/transfer_ranked_to_open.sql](../../../scripts/sql/transfer_ranked_to_open.sql) handles both cases.

### Constraints

- **Invite code**: Unique, auto-generated (8 uppercase alphanumeric)
- **Captain**: Only captain can:
  - Invite members
  - Edit group name
  - Transfer captaincy to member (optional feature)
  - Delete group (cascade delete members)
- **Member**: Can:
  - View group info
  - Leave group
- **Anchor immutable once set**: Changing anchor requires explicit admin action + re-sync all members

---

## Consequences

### Positive

- ✅ Teams can coordinate arrivals (better UX)
- ✅ Audit trail (who initialized anchor)
- ✅ Supports corporate use cases (benefits, team events)
- ✅ Format-agnostic (only affects OPEN, respects RANKED independence)

### Negative / Constraints

- ❌ Anchor cascade: changing anchor affects ALL members' OPEN registrations
- ❌ Complex dependency: group → registrations → waves → wave counter (must all stay in sync)
- ❌ Transfer RANKED→OPEN becomes complex (must check group before assigning)
- ❌ Can't easily split group (anchor applies to all or none)

### Dependencies

- Requires [FDR-0004](FDR-0004-wave-assignment-open-vs-ranked.md): Wave assignment must exist first
- Migration: [migrations/20260416_groups.sql](../../../migrations/20260416_groups.sql) + [migrations/20260512_groups_anchor_source.sql](../../../migrations/20260512_groups_anchor_source.sql)

---

## Implementation

### Code References

| File | Purpose |
|------|---------|
| [src/lib/groups/resolveGroupAnchor.ts](../../../src/lib/groups/resolveGroupAnchor.ts) | Find group anchor from first OPEN registration |
| [src/lib/groups/syncOpenGroupWave.ts](../../../src/lib/groups/syncOpenGroupWave.ts) | Sync member registrations to anchor wave |
| [src/app/api/groups/route.ts](../../../src/app/api/groups/route.ts) | List + create groups (init anchor) |
| [src/app/api/groups/join/route.ts](../../../src/app/api/groups/join/route.ts) | Join group (resolve/init anchor, sync) |
| [src/app/api/groups/leave/route.ts](../../../src/app/api/groups/leave/route.ts) | Leave group |
| [src/app/api/admin/groups/[id]/route.ts](../../../src/app/api/admin/groups/[id]/route.ts) | Admin: edit group, force anchor |
| [scripts/sql/transfer_ranked_to_open.sql](../../../scripts/sql/transfer_ranked_to_open.sql) | Transfer RANKED→OPEN with anchor check |
| [migrations/20260512_groups_anchor_source.sql](../../../migrations/20260512_groups_anchor_source.sql) | Schema: track anchor initialization source |

### Workflows

See [implementation-guide-groups.md](../guides/implementation-guide-groups.md) for detailed code examples.

---

## Testing

### Unit Tests

```typescript
describe('Group Anchor', () => {
  it('should initialize anchor from creator OPEN registration', () => {
    // 1. User with OPEN reg on event X creates group
    // 2. Verify group.anchor_wave_index = user's wave
    // 3. Verify anchor_initialized_by = 'creator'
  })
  
  it('should initialize anchor from first member join', () => {
    // 1. Group created (no anchor)
    // 2. User with OPEN reg on event X joins
    // 3. Verify group.anchor_wave_index = user's wave
    // 4. Verify anchor_initialized_by = 'member_join'
  })
  
  it('should not initialize anchor if no OPEN registrations', () => {
    // 1. User with only RANKED registrations joins group
    // 2. Verify group.anchor_* still NULL
  })
})

describe('Group Sync', () => {
  it('should sync member OPEN registrations to anchor wave', () => {
    // 1. Group with anchor on wave 5
    // 2. Member joins with OPEN reg on wave 2
    // 3. After join, member's OPEN reg should be on wave 5
  })
  
  it('should not sync RANKED registrations', () => {
    // 1. Group with anchor on wave 5
    // 2. Member joins with RANKED reg (wave_index = NULL)
    // 3. After join, RANKED reg should still have wave_index = NULL
  })
})
```

### Integration Tests

```typescript
describe('Group Workflow', () => {
  it('full workflow: create → join → transfer RANKED→OPEN', () => {
    // 1. User A creates group
    // 2. User A has OPEN reg on event X (wave 5)
    // 3. User B joins group
    // 4. User B has RANKED reg on event X
    // 5. Transfer User B's RANKED→OPEN
    // 6. Verify User B's new OPEN reg is on wave 5 (anchor)
  })
})
```

### Manual QA

```
[ ] Create group as user with OPEN registration → verify anchor initialized
[ ] Join group as user with OPEN registration (group has no anchor) → verify anchor initialized
[ ] Join group as user with OPEN registration (group has anchor) → verify registrations synced
[ ] Join group as user with only RANKED registrations → verify RANKED unaffected
[ ] Transfer RANKED→OPEN for group member → verify respects anchor (not random wave)
[ ] Admin forcibly changes anchor → verify all members' OPEN registrations synced
```

---

## Edge Cases & Gotchas

### Case 1: Multiple Groups

User can be in multiple groups. Each group can have different anchor.

**Behavior**: User's OPEN registrations sync to **most recently joined** group's anchor (via `joined_at DESC LIMIT 1`).

**Future improvement**: Allow user to specify preferred group or have explicit sync priority.

### Case 2: Anchor on Different Events

Group has anchor on event X. User joins group, has OPEN reg on events X and Y.

**Behavior**: Only event X registrations synced. Event Y registrations unaffected.

```sql
WHERE gm.profile_id = user_id
  AND r.event_id = g.anchor_event_id  -- Only anchor event
  AND r.wave_index IS NOT NULL        -- Only OPEN
```

### Case 3: Changing Anchor

Admin changes group anchor from wave 5 to wave 8.

**Behavior**: Re-sync all OPEN members to wave 8.

**Data consistency**: Trigger or RPC needed to handle.

### Case 4: Member Leaves, Then Rejoins

Member leaves group, joins different group, then rejoins original group.

**Behavior**: Registrations sync to NEW group anchor (if exists). Original group anchor not reapplied retroactively.

**Mitigation**: Clarify in docs that leaving severs sync relationship.

---

## Monitoring & Maintenance

### Query: Check Anchor Status

```sql
SELECT 
  g.id, g.name, g.captain_id,
  g.anchor_event_id, g.anchor_wave_index,
  g.anchor_initialized_by, g.anchor_initialized_from_profile_id,
  COUNT(gm.profile_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id
ORDER BY g.created_at DESC;
```

### Query: Check Members Out of Sync

```sql
SELECT 
  g.id as group_id, g.name,
  gm.profile_id,
  COUNT(DISTINCT r.wave_index) as distinct_waves,
  STRING_AGG(DISTINCT r.wave_index::text, ',') as wave_indices
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN registrations r 
  ON gm.profile_id = r.user_id 
  AND r.event_id = g.anchor_event_id
  AND r.wave_index IS NOT NULL
WHERE g.anchor_event_id IS NOT NULL
GROUP BY g.id, g.name, gm.profile_id
HAVING COUNT(DISTINCT r.wave_index) > 1
ORDER BY g.id;
```

### Alerts

- 🔴 **Critical**: Group members on different waves (should be synced)
- 🟡 **Warning**: Anchor_initialized_by null but anchor_event_id not null (data integrity issue)
- 🟢 **Info**: Group creation rate, members per group (metrics)

