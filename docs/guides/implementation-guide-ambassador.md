# Implementation Guide: Ambassador Program

**For**: Developers implementing ambassador features, dashboards, rewards  
**Related**: [FDR-0006](../fdr/FDR-0006-ambassador-program-points-and-rewards.md)

---

## Quick Overview

**Flow**:
1. Ambassador gets promotional code
2. Shares with friends
3. Friend registers + pays with code → points awarded
4. Ambassador sees points on dashboard + unlocks rewards
5. Admin approves/fulfills rewards

---

## File Structure

```
src/
├── lib/ambassadors/
│   ├── program.ts                    # Reward levels + formulas
│   ├── dashboardHelpers.ts           # Query helpers
│   ├── access.ts                     # Permissions
│   ├── email.ts                      # Notification emails
│   └── rewardsNotifications.ts       # Webhook: points awarded
├── app/api/ambassadors/
│   ├── dashboard/route.ts            # GET full dashboard
│   └── rewards/claim/route.ts        # POST claim reward
└── tests/
    ├── program.test.ts
    └── access.test.ts
```

---

## Core: Reward Levels & Formulas

**File**: [src/lib/ambassadors/program.ts](../../../src/lib/ambassadors/program.ts)

```typescript
export const AMBASSADOR_REWARD_LEVELS = [
  { reward_level: 1, reward_name: 'Badge ambassadeur + leaderboard', points_required: 1 },
  { reward_level: 2, reward_name: 'Récompense starter', points_required: 2 },
  // ... through level 10 at 30pts
  { reward_level: 10, reward_name: 'Statut ambassadeur officiel', points_required: 30 },
]

// Get current reward level
export const getCurrentRewardLevel = (totalPoints: number) => {
  return AMBASSADOR_REWARD_LEVELS.reduce(
    (max, level) => (totalPoints >= level.points_required ? level.reward_level : max),
    0
  )
}

// Get next reward to aim for
export const getNextReward = (totalPoints: number): AmbassadorNextReward | null => {
  const next = AMBASSADOR_REWARD_LEVELS.find((l) => totalPoints < l.points_required)
  return next
    ? {
        reward_level: next.reward_level,
        reward_name: next.reward_name,
        points_required: next.points_required,
        points_remaining: Math.max(next.points_required - totalPoints, 0),
      }
    : null
}

// Extra tickets beyond level 10
export const getExtraTicketsEarned = (totalPoints: number): number => {
  if (totalPoints <= 30) return 0
  return Math.floor((totalPoints - 30) / 3)
}
```

---

## Dashboard Query

**File**: [src/app/api/ambassadors/dashboard/route.ts](../../../src/app/api/ambassadors/dashboard/route.ts) → `GET /api/ambassadors/dashboard`

Returns complete dashboard data:

```typescript
export async GET(req: Request) {
  const userId = await getCurrentUserId()
  
  // 1. Get ambassador record + code
  const ambassador = await getAmbassadorByUserId(userId)
  
  // 2. Get total points
  const points = await getAmbassadorPoints(ambassador.id)
  
  // 3. Get rewards (earned, claimed, fulfilled)
  const rewards = await getAmbassadorRewards(ambassador.id)
  
  // 4. Get leaderboard (top 10)
  const leaderboard = await getAmbassadorLeaderboard(ambassador.id)
  
  // 5. Get recruits table (with payment status)
  const recruits = await getAmbassadorRecruits(ambassador.id)
  
  return {
    code: ambassador.promotional_code_slug,
    total_points: points.total_points,
    points_breakdown: {
      open_count: points.recruits_open,
      ranked_count: points.recruits_ranked,
    },
    rewards: [
      { id: '...', reward_level: 1, status: 'earned', earned_at: '...' },
      { id: '...', reward_level: 2, status: 'claimed', claimed_at: '...' },
    ],
    next_reward: getNextReward(points.total_points),
    leaderboard: {
      current_user_rank: 5,
      total_ambassadors: 127,
      top: [
        { rank: 1, name: 'Alice', points: 150, is_current_user: false },
        // ...
      ],
    },
    recruits_table: [
      { id: '...', name: 'Bob', points: 2, race_format: 'ranked', payment_status: 'paid' },
      // ...
    ],
  }
}
```

---

## Points Award (RPC Entry Point)

**File**: RPC `award_ambassador_points_for_order()` (Supabase SQL)

Called from Stripe webhook when order is paid:

```typescript
// In webhook handler
const { error } = await supabase.rpc('award_ambassador_points_for_order', {
  p_order_id: order.id,
  p_registration_id: registration.id,
  p_race_format: isOpenFormatTicket(ticket, race) ? 'open' : 'ranked'
})

if (!error) {
  // Notify ambassador (optional)
  await notifyAmbassadorRewardsForOrder(ambassador.id)
}
```

**What RPC does**:
1. Fetch order.promotional_code_id
2. Check if code ∈ ambassador_promotional_codes
3. If YES: INSERT ambassador_points_event + UPDATE ambassador_points
4. If NO: skip (not ambassador referral)

---

## Reward Claiming

**File**: [src/app/api/ambassadors/rewards/claim/route.ts](../../../src/app/api/ambassadors/rewards/claim/route.ts) → `POST /api/ambassadors/rewards/claim`

```typescript
export async POST(req: Request) {
  const { reward_id } = await req.json()
  const userId = await getCurrentUserId()
  
  // 1. Get reward
  const reward = await getAmbassadorReward(reward_id)
  
  // 2. Verify ownership
  const ambassador = await getAmbassadorByUserId(userId)
  if (reward.ambassador_id !== ambassador.id) {
    throw new Error('Not your reward')
  }
  
  // 3. Verify earned
  if (reward.status !== 'earned') {
    throw new Error('Reward not earned yet')
  }
  
  // 4. Mark claimed
  await supabase
    .from('ambassador_rewards')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('id', reward_id)
  
  // 5. Create fulfillment task (admin has to verify + issue)
  await createFulfillmentTask(reward)
  
  return { success: true }
}
```

---

## Debugging Queries

### Check Ambassador & Points

```sql
SELECT 
  a.id, p.email,
  ap.total_points,
  ap.recruits_open, ap.recruits_ranked,
  COUNT(DISTINCT ape.id) as events_tracked
FROM ambassadors a
JOIN profiles p ON a.profile_id = p.id
JOIN ambassador_points ap ON a.id = ap.ambassador_id
LEFT JOIN ambassador_points_events ape ON a.id = ape.ambassador_id
WHERE p.email = 'ambassador@example.com'
GROUP BY a.id, p.email, ap.total_points, ap.recruits_open, ap.recruits_ranked;
```

### Check Rewards Status

```sql
SELECT 
  r.id, r.reward_level, r.reward_name,
  r.status,
  r.earned_at, r.claimed_at, r.fulfilled_at
FROM ambassador_rewards r
WHERE r.ambassador_id = 'AMB_ID'
ORDER BY r.reward_level DESC;
```

### Check Points for Specific Event

```sql
SELECT 
  ape.id, ape.points_awarded,
  ape.race_format,
  r.email as referral_email,
  ape.awarded_at
FROM ambassador_points_events ape
JOIN registrations reg ON ape.registration_id = reg.id
JOIN auth.users u ON reg.user_id = u.id
WHERE ape.ambassador_id = 'AMB_ID'
  AND ape.event_id = 'EVENT_ID'
ORDER BY ape.awarded_at DESC;
```

---

## Testing

```typescript
describe('Ambassador Points', () => {
  it('should award 1 point for OPEN registration with amb code', async () => {
    // Create order with promotional_code_id pointing to amb_promo
    // Create OPEN registration
    // Call RPC award_ambassador_points_for_order
    // Verify ambassador_points.total_points incremented by 1
  })
  
  it('should award 2 points for RANKED registration', async () => {
    // Similar, but RANKED registration
    // Verify total_points incremented by 2
  })
  
  it('should not award points if order has no amb code', async () => {
    // Order without promotional_code_id
    // Verify no points awarded
  })
})

describe('Rewards', () => {
  it('should unlock level 4 when reaching 5 points', () => {
    const level = getCurrentRewardLevel(5)
    expect(level).toBe(4)
  })
  
  it('should calculate extra tickets: 33 pts = 1 extra', () => {
    const extra = getExtraTicketsEarned(33)
    expect(extra).toBe(1)
  })
})
```

---

## Common Patterns

### Access Control

**File**: [src/lib/ambassadors/access.ts](../../../src/lib/ambassadors/access.ts)

```typescript
// Check if user is ambassador
export const isAmbassador = async (userId: UUID): Promise<boolean> => {
  const { count } = await supabase
    .from('ambassadors')
    .select('id', { count: 'exact' })
    .eq('profile_id', userId)
  return count > 0
}

// Check if can view dashboard
export const canViewAmbassadorDashboard = async (userId: UUID, ambassadorId: UUID) => {
  // Only ambassador or admin can view
  const ambassador = await getAmbassadorById(ambassadorId)
  return ambassador.profile_id === userId || isAdmin(userId)
}
```

### Email Notifications

**File**: [src/lib/ambassadors/email.ts](../../../src/lib/ambassadors/email.ts)

```typescript
export const notifyAmbassadorRewardsForOrder = async (ambassadorId: UUID) => {
  const ambassador = await getAmbassadorById(ambassadorId)
  const points = await getAmbassadorPoints(ambassadorId)
  const nextReward = getNextReward(points.total_points)
  
  await sendEmail({
    to: ambassador.email,
    template: 'ambassador_points_awarded',
    data: {
      points_new: points.total_points,
      next_reward: nextReward?.reward_name,
      points_remaining: nextReward?.points_remaining,
    }
  })
}
```

---

## Monitoring

- [ ] ambassador_points.total_points > sum(ambassador_points_events.points_awarded) → out-of-sync
- [ ] Rewards claimed but not fulfilled (admin backlog)
- [ ] Leaderboard is current (updated after each award)
- [ ] Multi-code ambassadors (is_current unique or not?)

