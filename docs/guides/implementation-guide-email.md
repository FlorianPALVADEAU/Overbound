# Implementation Guide: Email Distribution & Preferences

**For**: Developers implementing email features  
**Related**: [FDR-0007](../fdr/FDR-0007-email-distribution-and-preferences.md)

---

## Quick Start

### To Send Email Campaign via Admin

1. Go to `/admin` → "Distribution Lists"
2. Click "Composer un email"
3. Fill form:
   - **Sujet** (required)
   - **Pré-header** (optional, shown in inbox)
   - **Contenu HTML** (required)
   - **Contenu Texte brut** (optional)
4. Select lists + mode (test or send)
5. Logo + footer added automatically

### To Make User Manage Preferences

1. User → `/account` → "Préférences de notifications"
2. Enable/disable email types
3. Set digest frequency (immédiat, quotidien, hebdo, jamais)
4. Saved automatically

---

## API Endpoints

### Public (No Auth)

```
GET  /api/preferences/[token]
     Unsubscribe confirmation page (token-based, 90-day expiry)

GET  /api/unsubscribe?token=ABC
     One-click unsubscribe (RFC 8058)
```

### Authenticated

```
GET  /api/notification-preferences
     Get user's preferences

PATCH /api/notification-preferences
      Update preferences (announcements_enabled, digest_frequency, etc)

GET  /api/preferences
     Current user's full subscription state
```

### Admin

```
GET  /api/admin/distribution-lists
     List all distribution lists + stats

POST /api/admin/distribution-lists/send-email
     Compose + send campaign
     Params: subject, preheader, html, plaintext, list_ids[], is_test
```

---

## Code Snippets

### Generate Unsubscribe Link

```typescript
import { generateUnsubscribeUrl } from '@/lib/email/unsubscribe'

const url = await generateUnsubscribeUrl(userId, email)
// → https://example.com/preferences/eyJhbGc...
```

### Include in Email (Resend Template)

```html
<footer style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
  <p style="font-size: 12px; color: #666;">
    <a href="{{ unsubscribeUrl }}" style="color: #0066cc;">Se désinscrire</a>
  </p>
</footer>
```

### Fetch User Preferences

```typescript
// Get preferences
const { data } = await supabase
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single()

// Result: {
//   announcements_enabled: true,
//   price_alerts_enabled: false,
//   digest_frequency: 'daily',
//   ...
// }
```

### Update Preferences

```typescript
const { error } = await supabase
  .from('notification_preferences')
  .update({
    announcements_enabled: false,
    digest_frequency: 'never'
  })
  .eq('user_id', userId)

// Trigger syncs to list_subscriptions automatically
```

### Check if Subscribed to List

```typescript
const { data } = await supabase
  .from('list_subscriptions')
  .select('subscribed')
  .eq('user_id', userId)
  .eq('list_id', listId)  // or slug
  .single()

const isSubscribed = data?.subscribed ?? false
```

---

## Email Composer HTML Guide

### Template Structure

```html
<!-- LOGO + CONTENT + FOOTER added automatically, write only body -->

<h1 style="color: #111827; font-size: 28px; margin-bottom: 16px;">
  Titre de l'email
</h1>

<p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  Salut!
</p>

<!-- Highlight box -->
<div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
  <p style="margin: 0; color: #1f2937; font-size: 14px;">
    <strong>Important:</strong> Message clé
  </p>
</div>

<!-- CTA Button -->
<div style="text-align: center; margin: 32px 0;">
  <a href="https://example.com/events/my-event"
     style="display: inline-block; background-color: #3b82f6; color: #ffffff;
            padding: 14px 32px; text-decoration: none; border-radius: 8px;
            font-weight: bold; font-size: 16px;">
    Je m'inscris maintenant
  </a>
</div>

<!-- Unordered list -->
<ul style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
  <li>Point 1</li>
  <li>Point 2</li>
  <li>Point 3</li>
</ul>
```

### Best Practices

- ✅ Keep content width < 600px
- ✅ Use inline CSS (not <style> tags)
- ✅ Use web-safe fonts (Arial, Helvetica, Georgia)
- ✅ ALT text for images
- ✅ Test rendering in Gmail, Outlook, Apple Mail

### What Gets Added Automatically

```
[TOP]
<header>
  <img src="logo.png" />
</header>

[YOUR CONTENT HERE]

[FOOTER]
<footer>
  <p>Vous recevez cet email car...</p>
  <a href="[UNSUBSCRIBE_TOKEN]">Se désinscrire</a>
  <p>© 2026 Overbound</p>
</footer>
```

---

## SQL Reference

### Email Log Types

```
# Transactional
- ticket_confirmation
- document_required
- document_approved
- event_update

# Marketing
- marketing_new_event
- marketing_price_change
- marketing_promo
- volunteer_recruitment

# Preferences
- preference_optin
- preference_optout
- unsubscribe
```

### Distribution List Types

```
- marketing  : Promos, offres
- events     : Annonces courses
- news       : Blog + actualités
- volunteers : Recrutement bénévoles
- partners   : Offres partenaires
```

### Triggers (PostgreSQL)

```sql
-- Sync notification prefs to list subscriptions
CREATE TRIGGER sync_notification_prefs_to_lists
AFTER INSERT OR UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION fn_sync_notification_prefs_to_lists();

-- Create default prefs on new user
CREATE TRIGGER create_notification_prefs_on_profile_creation
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION fn_create_notification_prefs_on_profile_creation();
```

### RLS Policies

```sql
-- notification_preferences
CREATE POLICY "users_can_read_own_prefs"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- list_subscriptions
CREATE POLICY "users_can_read_own_subscriptions"
  ON list_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- distribution_lists (read-only for users)
CREATE POLICY "authenticated_can_read_lists"
  ON distribution_lists FOR SELECT
  TO authenticated
  USING (active = true OR is_admin());
```

---

## Debugging Queries

### Check User Subscription State

```sql
SELECT 
  p.email,
  np.announcements_enabled,
  np.price_alerts_enabled,
  np.digest_frequency,
  COUNT(ls.id) as list_count
FROM profiles p
JOIN notification_preferences np ON p.id = np.user_id
LEFT JOIN list_subscriptions ls ON p.id = ls.user_id AND ls.subscribed = true
WHERE p.email = 'user@example.com'
GROUP BY p.email, np.*;
```

### Check Campaign Delivery

```sql
SELECT 
  email_id, subject,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM email_logs
WHERE campaign_id = 'CAMPAIGN_ID'
GROUP BY email_id, subject;
```

### Unsub Stats

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as unsubs,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles WHERE created_at::date = DATE(email_logs.created_at)) as pct
FROM email_logs
WHERE email_type = 'unsubscribe'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Testing

```typescript
describe('Unsubscribe Flow', () => {
  it('should generate and validate token', async () => {
    const token = await generateUnsubscribeUrl('user-id', 'user@example.com')
    const result = await validateUnsubscribeToken(token)
    expect(result.user_id).toBe('user-id')
  })
  
  it('should reject expired token', async () => {
    // Generate old token (>90 days)
    const result = await validateUnsubscribeToken(oldToken)
    expect(result).toBeNull()
  })
})

describe('Admin Campaign Send', () => {
  it('should send to multiple lists (deduplicated)', async () => {
    // Send to lists A (10 users) + B (10 users), 5 overlapping
    // Verify 15 emails sent (not 20)
  })
})
```

---

## Monitoring Checklist

- [ ] Unsub rate < 1% per month
- [ ] Campaign delivery > 95% (no bounces)
- [ ] Preferences in sync with list subscriptions (no orphans)
- [ ] Tokens expire after 90 days
- [ ] Admin can test emails before sending

