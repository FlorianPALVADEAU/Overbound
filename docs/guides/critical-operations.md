# Critical Operations Guide

**For**: Developers performing dangerous data mutations  
**Important**: Read this before running any manual SQL or admin operations

---

## Operation 1: Transfer RANKED → OPEN

### What It Does

Moves one registration from RANKED ticket (15:00 start) to OPEN ticket (08:00-11:50 waves), respecting group anchors if applicable.

### When to Use

- User wants to switch from competitive (RANKED) to fun (OPEN) format
- Admin needs to move registration to accommodate event changes
- Correction for data entry error

### Prerequisites

- User still has active payment (order status = paid)
- Both RANKED and OPEN tickets exist on same event
- Registration is currently RANKED format

### Dry-Run Checklist

```
[ ] Identify registration_id (from database or admin panel)
[ ] Identify target OPEN ticket_id (or leave NULL for auto-choice)
[ ] Check user's registration history (any group memberships?)
[ ] Check if user is group member with anchor on this event
[ ] Review transfer_ranked_to_open.sql script
[ ] Run with v_dry_run := TRUE first
[ ] Verify NOTICE output: shows current ticket, target ticket, anchor decision
[ ] If anchor present: verify proposed wave_index matches anchor
[ ] Confirm everything looks correct
```

### Running the Script

**File**: [scripts/sql/transfer_ranked_to_open.sql](../../../scripts/sql/transfer_ranked_to_open.sql)

```sql
-- 1. EDIT PARAMETERS
v_registration_id := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';  -- User's registration ID
v_open_ticket_id := NULL;  -- NULL = auto-choose best matching OPEN ticket
v_dry_run := TRUE;  -- Keep TRUE for simulation first

-- 2. Run in SQL editor / psql
-- 3. Review output (see "Output Interpretation" below)
-- 4. If all correct, change v_dry_run := FALSE and re-run
-- 5. Verify SUCCESS notice
```

### Output Interpretation

**Success (Dry-Run)**:
```
NOTICE: Registration=abc... user=def... event=ghi...
NOTICE: Current ticket=RANKED_TICKET_ID (Fury RANKED / Fury)
NOTICE: Target ticket=OPEN_TICKET_ID (Fury OPEN / Fury)
NOTICE: Group anchor found: group=xyz wave_index=5 start_time=08:50:00
NOTICE: DRY-RUN enabled: no data was modified.
```

**Error Examples**:
```
ERROR: Registration % not found
  → registration_id doesn't exist

ERROR: Registration % is not on a RANKED ticket
  → Already OPEN, no need to transfer

ERROR: No OPEN ticket found for event %
  → No OPEN format ticket on this event
```

### What Changes

1. **registration.ticket_id** : RANKED_ID → OPEN_ID
2. **registration.wave_index** : NULL → 0-23 (assigned by RPC or anchor)
3. **registration.start_time** : NULL → 08:00-11:50 or anchor time
4. **registration.wave_position** : NULL → position within wave
5. **event_waves[X].assigned_count** : refreshed for affected waves

### What Does NOT Change

- Order price/total (no rebilling)
- Payment status
- User's other registrations
- Group membership

### Rollback

If something goes wrong:

```sql
UPDATE registrations
SET ticket_id = OLD_RANKED_ID,
    wave_index = NULL,
    start_time = NULL,
    wave_position = NULL,
    wave_capacity = NULL
WHERE id = registration_id;

-- Refresh wave counter
UPDATE event_waves SET assigned_count = COUNT(...) ...
```

---

## Operation 2: Manual Ambassador Points Override

### What It Does

Manually adjust ambassador's total points (e.g., for award fulfillment, correction, or special bonus).

### When to Use

- Correct data entry error (wrong points awarded)
- Award points for out-of-band referrals (phone, in-person signup)
- Apply bonus for milestone or special campaign
- Deduct points for refund (rare, but possible)

### Prerequisites

- Ambassador exists in database
- Admin credentials

### API Endpoint

```
PATCH /api/admin/ambassadors/points/[ambassador_id]

Body:
{
  "total_points": 50,
  "recruits_open": 30,
  "recruits_ranked": 10,
  "notes": "Manual adjustment: awarded 5pts for event sponsorship"
}
```

### Impacts

⚠️ **Critical**: Changing total_points automatically:
- Updates next reward calculation
- May unlock/downgrade reward level
- Does NOT create ambassador_rewards entries (rewards calculated dynamically)
- May affect leaderboard ranking

### Approval Workflow

1. Admin makes change via `/admin/ambassadors/points/[id]` PATCH
2. Log entry created with old/new points + reason
3. System auto-emails ambassador (optional)
4. Leaderboard refreshes
5. Rewards recalculate on next dashboard load

### Rollback

```sql
UPDATE ambassador_points
SET total_points = OLD_VALUE,
    recruits_open = OLD_OPEN,
    recruits_ranked = OLD_RANKED,
    updated_at = NOW()
WHERE ambassador_id = 'AMB_ID';
```

---

## Operation 3: Group Anchor Force Reset

### What It Does

Admin forcibly changes group anchor (event + wave), auto-syncing all OPEN members to new anchor.

### When to Use

- Admin corrects anchor initialization error
- Event venue change requires different departure time
- Group requests specific departure time

### Prerequisites

- Group exists
- Target event has OPEN format
- Target wave exists (0-23)

### API Endpoint

```
PATCH /api/admin/groups/[group_id]

Body:
{
  "anchor_event_id": "event-id",
  "anchor_wave_index": 7,
  "anchor_start_time": "2026-09-20T08:50:00Z"
}
```

### Impacts

⚠️ **Critical**: All group's OPEN members on this event are re-assigned:
- wave_index = new anchor wave
- start_time = new anchor time
- wave_position = recalculated

### Dry-Run Check

Before applying:

```sql
-- Preview who will be affected
SELECT 
  gm.profile_id,
  COUNT(r.id) as open_registrations,
  STRING_AGG(DISTINCT r.wave_index::text, ',') as old_waves
FROM group_members gm
LEFT JOIN registrations r 
  ON gm.profile_id = r.user_id 
  AND r.event_id = 'NEW_EVENT_ID'
  AND r.wave_index IS NOT NULL
WHERE gm.group_id = 'GROUP_ID'
GROUP BY gm.profile_id;
```

### Approval Workflow

1. Admin reviews affected members (query above)
2. Admin notifies captain + members (recommended)
3. Admin applies change
4. System syncs all OPEN registrations
5. Members see updated start_time on dashboard

### Rollback

```sql
-- Store old anchor first!
UPDATE groups
SET anchor_wave_index = OLD_WAVE,
    anchor_start_time = OLD_TIME,
    anchor_initialized_by = 'admin_manual',
    anchor_initialized_at = NOW()
WHERE id = 'GROUP_ID';

-- Re-sync members
CALL sync_open_group_wave(group_id, old_wave, old_time);
```

---

## Operation 4: Bulk Wave Reassignment

### What It Does

Re-assign all OPEN registrations on an event to new waves (e.g., capacity adjustment).

### When to Use

- Event capacity decreased → need to rebalance waves
- Venue change → need to reconfigure wave times
- Major data corruption → need reset

### Dangers

🔴 **HIGHEST RISK**: Affects all registrations, groups may lose anchor coherence

### Procedure

1. **Backup wave counter**:
   ```sql
   CREATE TABLE event_waves_backup AS SELECT * FROM event_waves WHERE event_id = 'EVENT_ID';
   ```

2. **Clear registrations** (careful!):
   ```sql
   UPDATE registrations
   SET wave_index = NULL,
       wave_position = NULL,
       wave_capacity = NULL,
       start_time = NULL,
       auto_assigned = TRUE
   WHERE event_id = 'EVENT_ID'
     AND wave_index IS NOT NULL;
   ```

3. **Re-assign via RPC** (production mode):
   ```sql
   SELECT assign_open_wave_to_registration(
     p_event_id := 'EVENT_ID',
     p_registration_id := reg.id,
     p_first_departure := '2026-09-20T08:00:00Z',
     p_wave_count := 24,
     ...
   )
   FROM registrations reg
   WHERE reg.event_id = 'EVENT_ID';
   ```

4. **Verify wave counter**:
   ```sql
   SELECT SUM(assigned_count) FROM event_waves WHERE event_id = 'EVENT_ID';
   -- Should match COUNT(registrations WHERE event_id = 'EVENT_ID')
   ```

### Rollback

```sql
-- Restore from backup
UPDATE registrations
SET wave_index = old.wave_index,
    wave_position = old.wave_position,
    ...
FROM registrations_backup old
WHERE registrations.id = old.id;
```

---

## Pre-Operation Checklist

For ANY manual data mutation:

```
[ ] Understand impact (which tables, how many rows)
[ ] Get approval (manager/stakeholder)
[ ] Backup affected data
[ ] Test in staging first (if possible)
[ ] Set transaction isolation (READ COMMITTED or SERIALIZABLE)
[ ] Run dry-run (if applicable)
[ ] Review output carefully
[ ] Check downstream systems (emails, dashboards)
[ ] Document: what, why, when, who
[ ] Monitor for errors/anomalies post-operation
[ ] Verify backups were successful
```

---

## Post-Operation Verification

After critical operation completes:

```sql
-- Check for orphans/inconsistencies
SELECT * FROM event_waves WHERE assigned_count < 0;
SELECT COUNT(*) FROM group_members gm
  LEFT JOIN registrations r ON gm.profile_id = r.user_id
  WHERE gm.group_id = 'GROUP_ID' AND r.wave_index != (SELECT anchor_wave_index FROM groups WHERE id = 'GROUP_ID');

-- Check RLS policies aren't violated
SELECT COUNT(*) FROM registrations WHERE user_id IS NULL;
```

---

## Emergency Contacts

If something goes wrong:

1. **Stop**: Don't apply more changes
2. **Rollback** (if known procedure): Execute backup restore
3. **Alert**: Notify team leads
4. **Investigate**: Check transaction logs, audit trail
5. **Communicate**: Inform affected users (if applicable)

