# Implementation Guide: Groups & Wave Anchoring

**For**: Developers implementing or modifying group membership + anchor logic  
**Related**: [FDR-0005](../fdr/FDR-0005-group-membership-and-wave-anchoring.md)

---

## Quick Start

### What is a Group?

- **Captain** (creator) + **Members** (invited users)
- Optional **Wave Anchor**: forces all OPEN members to start at same time on a specific event
- **RANKED members unaffected** (08:00 is single start time anyway)

### Anchor Initialization

Happens automatically on:
1. **Group creation** if captain has OPEN registration
2. **First member joins** with OPEN registration (if group has no anchor)
3. **Admin manual** set via API

---

## File Structure

```
src/
├── lib/
│   └── groups/
│       ├── resolveGroupAnchor.ts         # Find group anchor from OPEN reg
│       └── syncOpenGroupWave.ts          # Force members to anchor wave
├── app/
│   └── api/
│       ├── groups/route.ts               # POST create, GET list groups
│       ├── groups/join/route.ts          # POST join group
│       ├── groups/leave/route.ts         # POST leave group
│       ├── groups/[id]/route.ts          # GET group, PATCH group
│       └── groups/[id]/delegate/route.ts # Transfer captaincy
├── types/
│   └── Group.ts                          # Group + GroupMember types
└── tests/
    └── groups/*.test.ts                  # Group tests
```

---

## Core Functions

### 1. Resolve Anchor from Profile

**File**: [src/lib/groups/resolveGroupAnchor.ts](../../../src/lib/groups/resolveGroupAnchor.ts)

Finds user's first OPEN registration on a specific event (or any event):

```typescript
export const resolveGroupAnchorFromProfile = async (
  supabase: SupabaseClient,
  groupId: string,
  profileId: string,
  eventId?: string
): Promise<{
  event_id: string
  wave_index: number
  start_time: Timestamp
} | null> => {
  // Query: user's OPEN registration (wave_index IS NOT NULL)
  // Order by created_at ASC → get FIRST registration
  
  const { data } = await supabase
    .from('registrations')
    .select('event_id, wave_index, start_time')
    .eq('user_id', profileId)
    .neq('wave_index', null)  // Only OPEN (RANKED = NULL)
    .eq('event_id', eventId || 'dummy')  // Filter if eventId provided
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  
  if (data) {
    return {
      event_id: data.event_id,
      wave_index: data.wave_index,
      start_time: data.start_time
    }
  }
  return null
}
```

**Usage**:

```typescript
// When creating group or member joins
const anchor = await resolveGroupAnchorFromProfile(
  supabase,
  groupId,
  profileId,
  eventId  // optional: filter to specific event
)

if (anchor) {
  // Initialize group anchor
  await supabase
    .from('groups')
    .update({
      anchor_event_id: anchor.event_id,
      anchor_wave_index: anchor.wave_index,
      anchor_start_time: anchor.start_time,
      anchor_initialized_by: 'creator',  // or 'member_join'
      anchor_initialized_from_profile_id: profileId,
      anchor_initialized_at: new Date().toISOString()
    })
    .eq('id', groupId)
}
```

### 2. Sync Member Registrations

**File**: [src/lib/groups/syncOpenGroupWave.ts](../../../src/lib/groups/syncOpenGroupWave.ts)

Forces all OPEN registrations for a member to a specific wave:

```typescript
export const syncOpenRegistrationsToWave = async (
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  targetWaveIndex: number,
  targetStartTime: Timestamp
): Promise<number> => {
  // Update registrations where:
  // - user_id = userId
  // - event_id = eventId
  // - wave_index IS NOT NULL (only OPEN)
  
  const { error, count } = await supabase
    .from('registrations')
    .update({
      wave_index: targetWaveIndex,
      start_time: targetStartTime,
      auto_assigned: false,  // Track forced assignment
    })
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .neq('wave_index', null)  // Only OPEN
  
  if (error) throw error
  return count  // Number of registrations updated
}
```

**Usage**:

```typescript
// When member joins group with anchor
if (group.anchor_event_id && group.anchor_wave_index !== null) {
  const count = await syncOpenRegistrationsToWave(
    supabase,
    memberId,
    group.anchor_event_id,
    group.anchor_wave_index,
    group.anchor_start_time
  )
  console.log(`Synced ${count} registrations to anchor wave ${group.anchor_wave_index}`)
}
```

---

## Main Workflows

### Workflow 1: Create Group

**File**: [src/app/api/groups/route.ts](../../../src/app/api/groups/route.ts) → `POST /api/groups`

```typescript
export async POST(req: Request) {
  const { name } = await req.json()
  const userId = await getCurrentUserId()  // From auth
  
  // 1. Create group
  const { data: group } = await supabase
    .from('groups')
    .insert({
      name,
      captain_id: userId,
      invite_code: generateInviteCode()  // e.g., "ABC12345"
    })
    .select()
    .single()
  
  // 2. Add captain as member
  await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      profile_id: userId,
      role: 'captain'
    })
  
  // 3. Try to initialize anchor from captain's OPEN registration
  const anchor = await resolveGroupAnchorFromProfile(
    supabase,
    group.id,
    userId
  )
  
  if (anchor) {
    await supabase
      .from('groups')
      .update({
        anchor_event_id: anchor.event_id,
        anchor_wave_index: anchor.wave_index,
        anchor_start_time: anchor.start_time,
        anchor_initialized_by: 'creator',
        anchor_initialized_from_profile_id: userId,
        anchor_initialized_at: new Date().toISOString()
      })
      .eq('id', group.id)
  }
  
  return { group }
}
```

### Workflow 2: Join Group

**File**: [src/app/api/groups/join/route.ts](../../../src/app/api/groups/join/route.ts) → `POST /api/groups/join`

```typescript
export async POST(req: Request) {
  const { invite_code } = await req.json()
  const userId = await getCurrentUserId()
  
  // 1. Fetch group by invite code
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', invite_code)
    .single()
  
  if (!group) {
    throw new Error('Invalid invite code')
  }
  
  // 2. Check if already member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('profile_id', userId)
    .single()
  
  if (existing) {
    throw new Error('Already member of this group')
  }
  
  // 3. Add as member
  await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      profile_id: userId,
      role: 'member'
    })
  
  // 4a. If group has anchor → sync this user's OPEN registrations
  if (group.anchor_event_id && group.anchor_wave_index !== null) {
    await syncOpenRegistrationsToWave(
      supabase,
      userId,
      group.anchor_event_id,
      group.anchor_wave_index,
      group.anchor_start_time
    )
  } 
  // 4b. Else if group has NO anchor and user has OPEN reg → initialize anchor
  else {
    const anchor = await resolveGroupAnchorFromProfile(
      supabase,
      group.id,
      userId
    )
    
    if (anchor) {
      await supabase
        .from('groups')
        .update({
          anchor_event_id: anchor.event_id,
          anchor_wave_index: anchor.wave_index,
          anchor_start_time: anchor.start_time,
          anchor_initialized_by: 'member_join',
          anchor_initialized_from_profile_id: userId,
          anchor_initialized_at: new Date().toISOString()
        })
        .eq('id', group.id)
    }
  }
  
  return { group }
}
```

### Workflow 3: Leave Group

**File**: [src/app/api/groups/[id]/leave/route.ts](../../../src/app/api/groups/[id]/leave/route.ts) → `POST /api/groups/:id/leave`

```typescript
export async POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId()
  
  // 1. Remove member
  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', params.id)
    .eq('profile_id', userId)
  
  // 2. If captain left → transfer captaincy or delete group
  const { data: group } = await supabase
    .from('groups')
    .select('captain_id, (group_members!inner(id)).count')
    .eq('id', params.id)
    .single()
  
  if (group.captain_id === userId) {
    // Option A: Transfer to oldest member
    // Option B: Delete group
    // For now, just note captaincy is orphaned
    console.warn(`Group ${params.id} captain left`)
  }
  
  // 3. No automatic un-sync (registrations stay on anchor wave)
  // User's registrations keep their wave assignment (freeze-in-place)
}
```

### Workflow 4: Transfer RANKED → OPEN (with Anchor Check)

**File**: [scripts/sql/transfer_ranked_to_open.sql](../../../scripts/sql/transfer_ranked_to_open.sql)

**Critical**: This script checks if user is group member before assigning wave.

Flow:
```sql
1. Validate registration is RANKED
2. Query: user ∈ group with anchor on this event?
   SELECT g.anchor_wave_index FROM groups g
   JOIN group_members gm ON g.id = gm.group_id
   WHERE gm.profile_id = user_id AND g.anchor_event_id = event_id
   
3. If anchor found:
   → UPDATE registration SET wave_index = anchor.wave_index
   → Preserve group coherence
4. Else:
   → CALL RPC assign_open_wave_to_registration()
   → Standard assignment
```

**See**: [critical-operations.md](critical-operations.md#transfer_ranked_to_open) for complete script + dry-run checklist.

---

## Debugging & Queries

### List All Groups for User

```sql
SELECT 
  g.id, g.name, g.captain_id,
  gm.profile_id, gm.role,
  g.anchor_event_id, g.anchor_wave_index,
  COUNT(*) OVER (PARTITION BY g.id) as member_count
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
WHERE gm.profile_id = 'USER_ID'
ORDER BY gm.joined_at DESC;
```

### Check Group Anchor & Members

```sql
SELECT 
  g.id, g.name, g.invite_code,
  g.anchor_event_id, g.anchor_wave_index, g.anchor_start_time,
  g.anchor_initialized_by, g.anchor_initialized_from_profile_id,
  gm.profile_id, gm.role, gm.joined_at
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE g.id = 'GROUP_ID'
ORDER BY gm.joined_at;
```

### Check Member Wave Sync Status

```sql
SELECT 
  gm.profile_id,
  r.id as registration_id,
  r.event_id,
  r.wave_index,
  g.anchor_wave_index,
  CASE WHEN r.wave_index = g.anchor_wave_index THEN 'SYNCED'
       ELSE 'OUT_OF_SYNC'
  END as status
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN registrations r 
  ON gm.profile_id = r.user_id 
  AND r.event_id = g.anchor_event_id
  AND r.wave_index IS NOT NULL
WHERE g.id = 'GROUP_ID'
ORDER BY gm.profile_id, r.created_at;
```

---

## Testing

### Unit Tests

```typescript
describe('Group Anchor Initialization', () => {
  it('should initialize anchor from captain OPEN registration', async () => {
    // 1. Create user with OPEN reg on event X (wave 3)
    // 2. User creates group
    // 3. Verify group.anchor_wave_index = 3
    // 4. Verify anchor_initialized_by = 'creator'
  })
  
  it('should initialize anchor from first member OPEN registration', async () => {
    // 1. Create group (no captain OPEN reg)
    // 2. Member joins with OPEN reg on event Y (wave 7)
    // 3. Verify group.anchor_wave_index = 7
    // 4. Verify anchor_initialized_by = 'member_join'
  })
})

describe('Group Sync', () => {
  it('should sync member OPEN registrations to anchor wave', async () => {
    // 1. Create group with anchor on wave 5
    // 2. Member joins with OPEN reg on wave 2
    // 3. After join, member's OPEN reg should have wave_index = 5
  })
  
  it('should not sync RANKED registrations', async () => {
    // 1. Create group with anchor
    // 2. Member joins with only RANKED registration
    // 3. After join, RANKED reg should still have wave_index = NULL
  })
})
```

### Integration Tests

```typescript
describe('Full Group Workflow', () => {
  it('create → join → transfer RANKED→OPEN (respects anchor)', async () => {
    // 1. User A creates group (has OPEN reg on event X, wave 5)
    // 2. User B joins group (now has anchor wave 5)
    // 3. User B has RANKED reg on event X
    // 4. Transfer B's RANKED→OPEN
    // 5. Verify B's new OPEN reg is on wave 5 (NOT random)
  })
})
```

---

## Common Pitfalls

### Pitfall 1: Forget to Initialize Anchor on Create

❌ **BAD**: Create group but forget to check captain's OPEN registrations

✅ **GOOD**: 
```typescript
const anchor = await resolveGroupAnchorFromProfile(...)
if (anchor) {
  // Initialize
}
```

### Pitfall 2: Sync Only When Member Joins

❌ **BAD**: Sync on join, but don't sync if anchor changes later

✅ **GOOD**: Sync on join + have mechanism to re-sync when anchor changes (admin update)

### Pitfall 3: Group Member in Multiple Groups

If user in 2 groups with different anchors, which one wins?

✅ **GOOD**: Latest joined group's anchor (order by `joined_at DESC`)

### Pitfall 4: Cascade Delete

❌ **BAD**: Delete group but leave members orphaned

✅ **GOOD**: CASCADE DELETE group_members when group deleted (in schema)

---

## Monitoring Checklist

- [ ] All members in same group on same wave (if group has anchor)
- [ ] anchor_initialized_by is never NULL if anchor_event_id is set
- [ ] Wave counter matches actual registration count (query in Wave Assignment guide)
- [ ] No group members on different waves (anomaly detection)
- [ ] Invite codes are unique
