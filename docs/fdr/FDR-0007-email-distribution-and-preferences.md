# FDR-0007 - Email Distribution & Preferences (4-Phase System)

**Status**: Accepted (Production)  
**Date**: May 2026  
**References**: [implementation-guide-email.md](../guides/implementation-guide-email.md)

---

## Decision

Overbound implements a **4-phase email system** for compliance, segmentation, and engagement:

1. **Phase 1 (Unsubscribe)**: One-click unsubscribe links with secure tokens
2. **Phase 2 (Distribution Lists)**: Organize subscribers by thematic lists (marketing, events, news, volunteers)
3. **Phase 3 (Granular Preferences)**: Users control notification types + frequency
4. **Phase 4 (Admin Interface)**: Compose + send campaigns to lists, test before send

All phases share **strict RLS policies** and **GDPR compliance**.

---

## Rationale

### GDPR/CAN-SPAM Compliance

- **Unsubscribe required**: Legal obligation (GDPR Art. 21, CAN-SPAM Act)
- **Opt-in granular**: Users choose what emails they want (not opt-out)
- **Audit trail**: Track all unsub + pref changes
- **List segmentation**: Send relevant emails only

### User Experience

- **One-click unsub**: Make opt-out frictionless (RFC 8058)
- **Preferences center**: Users feel in control
- **Distribution lists**: Auto-subscribe new users to relevant lists (opt-out from there)

---

## Entities

### Phase 1: Unsubscribe System

**Tables**:
- `profiles.marketing_opt_in` — boolean flag (sync'd with Phase 3)
- No new table; uses token-based verification

**Flow**:
1. Generate secure token: `HMAC-SHA256(user_id + email + timestamp, SECRET_KEY)`
2. Include in email footer: `<a href="unsubscribe/[token]">Unsubscribe</a>`
3. User clicks → validate token → confirm → update profile

---

### Phase 2: Distribution Lists

**Tables**:

```sql
CREATE TABLE distribution_lists (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  type TEXT IN ('marketing', 'events', 'news', 'volunteers', 'partners'),
  description TEXT,
  default_subscribed BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

CREATE TABLE list_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  list_id UUID REFERENCES distribution_lists,
  subscribed BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP,
  UNIQUE(user_id, list_id)
)
```

**Seeded Lists**:
- `events-announcements` (events) — new race announcements
- `price-alerts` (marketing) — price change alerts
- `news-blog` (news) — blog updates
- `volunteers-recruitment` (volunteers) — bénévolat opportunities
- `partners-offers` (partners) — sponsor offers

**Logic**:
- New users auto-subscribed to `default_subscribed = true` lists
- Users can toggle subscription in preferences
- Admin can send to multiple lists (deduplicated by email)

---

### Phase 3: Granular Preferences

**Table**:

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users,
  
  -- Email type toggles (boolean)
  announcements_enabled BOOLEAN DEFAULT true,
  price_alerts_enabled BOOLEAN DEFAULT true,
  news_enabled BOOLEAN DEFAULT true,
  volunteers_enabled BOOLEAN DEFAULT true,
  partners_enabled BOOLEAN DEFAULT true,
  
  -- Frequency (immediate, daily digest, weekly, never)
  digest_frequency TEXT DEFAULT 'immediate' IN ('immediate', 'daily', 'weekly', 'never'),
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Sync Logic** (Trigger):
- Whenever notification_preferences is updated
- Sync to list_subscriptions: enable/disable toggle = subscribe/unsubscribe from corresponding list
- Example: `announcements_enabled = false` → unsubscribe from events-announcements list

---

### Phase 4: Admin Interface

**Components**:
- Page: `/admin/distribution-lists`
- Composer: HTML + plaintext email
- Send: to one or multiple lists
- Test mode: send to admin only before full send

**Data captured**:
- Campaign slug, subject, recipients count
- Send time, delivery status, failures
- Email logs for audit

---

## Rules

### Phase 1: Unsubscribe (RFC 8058 Compliant)

```
Email Header:
List-Unsubscribe: <https://example.com/api/unsubscribe?token=ABC>
List-Unsubscribe-Post: List-Unsubscribe=One-Click-Unsubscribe

Email Footer:
<a href="https://example.com/unsubscribe/ABC">Se désinscrire</a>
```

**Token validation**:
- HMAC-SHA256(`user_id + email + timestamp`)
- Expiry: 90 days
- One-time use: prevent replay attacks

### Phase 2: Distribution Lists (RLS)

```sql
-- Public: anyone can see active lists
SELECT * FROM distribution_lists WHERE active = true

-- User can see own subscriptions
SELECT * FROM list_subscriptions WHERE user_id = auth.uid()

-- Admin can read all
SELECT * FROM distribution_lists  -- FOR ADMIN ONLY

-- System (RPC) can update subscriptions
UPDATE list_subscriptions WHERE ... -- SERVICE ROLE ONLY
```

### Phase 3: Preferences Consistency

**Constraint**: notification_preferences ↔ list_subscriptions must stay in sync

**Implementation**: Trigger `sync_notification_prefs_to_lists`

```sql
CREATE TRIGGER sync_notification_prefs_to_lists
AFTER INSERT OR UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION fn_sync_notification_prefs_to_lists()
```

**Logic**:
- When announcements_enabled changes → toggle subscription to events-announcements list
- When digest_frequency = 'never' → unsubscribe from all lists (opt-out globally)

### Phase 4: Admin Send Workflow

**Steps**:
1. Compose email (subject, pre-header, HTML, plaintext)
2. Select lists
3. Click "Send Test" → emails to admin only
4. Review, adjust
5. Click "Send to X Recipients" → confirm → send via Resend
6. Track failures, log results

**Deduplicated**:
- If user on multiple lists → only one email sent (merge by email)

---

## Consequences

### Positive

- ✅ Full GDPR/CAN-SPAM compliance
- ✅ User control + engagement (users prefer subscribed)
- ✅ Admin simplicity (UI for campaign send)
- ✅ Audit trail (every pref change logged)

### Negative

- ❌ Trigger complexity (pref ↔ list sync must be reliable)
- ❌ 4 tables = more maintenance
- ❌ RLS policies tight (easy to lock accidentally)
- ❌ Token generation/validation fragile if timestamp/secret misaligned

---

## Implementation

See [implementation-guide-email.md](../guides/implementation-guide-email.md) for code examples, API endpoints, SQL snippets.

### Key Files

| File | Purpose |
|------|---------|
| [src/lib/email/unsubscribe.ts](../../../src/lib/email/unsubscribe.ts) | Token generation + validation |
| [src/app/api/preferences/[token]/route.ts](../../../src/app/api/preferences/[token]/route.ts) | Unsub handler (public) |
| [src/app/api/preferences/route.ts](../../../src/app/api/preferences/route.ts) | Preferences CRUD (authenticated) |
| [src/app/api/notification-preferences/route.ts](../../../src/app/api/notification-preferences/route.ts) | Granular prefs |
| [src/app/admin/distribution-lists/page.tsx](../../../src/app/admin/distribution-lists/page.tsx) | Admin list management |
| [src/components/admin/distribution-lists/EmailComposer.tsx](../../../src/components/admin/distribution-lists/EmailComposer.tsx) | Compose UI |
| [src/app/api/admin/distribution-lists/send-email/route.ts](../../../src/app/api/admin/distribution-lists/send-email/route.ts) | Send API |

---

## Testing

```typescript
describe('Phase 1: Unsubscribe', () => {
  it('should generate valid token', () => {
    // Generate token for user
    // Verify token validates (not expired, correct HMAC)
  })
  
  it('should reject expired token', () => {
    // Generate token with past timestamp
    // Verify rejected
  })
})

describe('Phase 2: Distribution Lists', () => {
  it('should auto-subscribe new users to default lists', () => {
    // Create new user
    // Verify list_subscriptions created for default lists
  })
})

describe('Phase 3: Preferences Sync', () => {
  it('should sync preference change to list subscription', () => {
    // Update announcements_enabled = false
    // Verify list_subscriptions.subscribed = false for events-announcements
  })
})

describe('Phase 4: Admin Send', () => {
  it('should compose + send to multiple lists (deduplicated)', () => {
    // 2 lists, 10 users each, 5 overlapping
    // Send campaign
    // Verify 15 emails sent (not 20)
  })
})
```

---

## Monitoring

### Queries

```sql
-- Unsub rate by day
SELECT DATE(created_at), COUNT(*) as unsubs
FROM email_logs
WHERE email_type = 'unsubscribe'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Subscription rate by list
SELECT dl.name, COUNT(ls.user_id) as subscribers
FROM distribution_lists dl
LEFT JOIN list_subscriptions ls ON dl.id = ls.list_id AND ls.subscribed = true
GROUP BY dl.id, dl.name;

-- Out-of-sync: user has pref enabled but not subscribed to list
SELECT p.user_id
FROM profiles p
JOIN notification_preferences np ON p.id = np.user_id
LEFT JOIN list_subscriptions ls ON p.id = ls.user_id
  AND ls.list_id = (SELECT id FROM distribution_lists WHERE slug = 'events-announcements')
WHERE np.announcements_enabled = true
  AND (ls.subscribed = false OR ls.id IS NULL);
```

### Alerts

- 🔴 **Critical**: Unsub rate spike (>5% in a day)
- 🟡 **Warning**: Out-of-sync pref ↔ list (consistency check)
- 🟢 **Info**: Campaign send status (successes, failures)

