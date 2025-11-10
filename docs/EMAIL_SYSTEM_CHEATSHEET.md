# Système Email OverBound - Aide-mémoire

## Commandes rapides

### Développement
```bash
# Démarrer le serveur de dev
npm run dev

# Vérifier les types TypeScript
npm run type-check

# Linter
npm run lint

# Build de production
npm run build
```

### Supabase SQL
```sql
-- Voir toutes les listes de distribution
SELECT * FROM distribution_lists ORDER BY name;

-- Voir tous les abonnés d'une liste
SELECT u.email, ls.subscribed
FROM list_subscriptions ls
JOIN auth.users u ON u.id = ls.user_id
WHERE ls.list_id = 'liste-uuid-here';

-- Voir les préférences d'un utilisateur
SELECT * FROM notification_preferences WHERE user_id = 'user-uuid-here';

-- Logs d'emails récents
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50;

-- Compter les abonnés par liste
SELECT dl.name, COUNT(ls.user_id) as subscribers
FROM distribution_lists dl
LEFT JOIN list_subscriptions ls ON ls.list_id = dl.id AND ls.subscribed = true
GROUP BY dl.id, dl.name;
```

## Routes principales

### Frontend
```
/account                              # Page compte utilisateur
/account → Gérer mes préférences      # Préférences emails
/preferences/[token]                  # Désinscription publique
/admin                                # Dashboard admin
/admin → Distribution Lists           # Gestion listes
/admin → Distribution Lists → Composer # Envoi email
```

### API
```
# Public (avec token)
GET  /api/preferences/[token]
PATCH /api/preferences/[token]

# Authentifié
GET  /api/notification-preferences
PATCH /api/notification-preferences

# Admin
GET  /api/admin/distribution-lists
POST /api/admin/distribution-lists/send-email
```

## Code snippets

### Générer un lien de désinscription
```typescript
import { generateUnsubscribeUrl } from '@/lib/email/unsubscribe'

const unsubscribeUrl = await generateUnsubscribeUrl(userId, email)
// → https://overbound-race.com/preferences/eyJhbGc...
```

### Envoyer un email marketing
```typescript
import { sendMarketingEmail } from '@/lib/email/marketing'

await sendMarketingEmail(
  'marketing_new_event',
  recipients,
  async (recipient) => {
    // Logique d'envoi Resend
  },
  { event_name: 'Trail des Montagnes' }
)
```

### Récupérer les préférences utilisateur
```typescript
// Côté serveur
const supabase = await createClient()
const { data } = await supabase
  .rpc('get_or_create_notification_preferences', {
    p_user_id: userId
  })
```

### Vérifier si un utilisateur est abonné
```typescript
const { data } = await supabase
  .from('list_subscriptions')
  .select('subscribed')
  .eq('user_id', userId)
  .eq('list_id', listId)
  .single()

const isSubscribed = data?.subscribed ?? false
```

## Tables de référence

### Types de listes (`distribution_lists.type`)
- `marketing` : Offres et promotions
- `events` : Annonces d'événements
- `news` : Blog et actualités
- `volunteers` : Recrutement bénévoles

### Slugs de listes standards
- `events-announcements` → Annonces d'événements
- `price-alerts` → Alertes de prix
- `news-blog` → Actualités
- `volunteers-recruitment` → Bénévolat
- `partners-offers` → Offres partenaires

### Fréquences digest (`notification_preferences.digest_frequency`)
- `immediate` : Envoi immédiat (défaut)
- `daily` : Digest quotidien
- `weekly` : Digest hebdomadaire
- `never` : Jamais

### Types d'emails (`email_logs.email_type`)
```
# Transactionnels
- ticket_confirmation
- document_required
- document_approved
- event_update

# Marketing
- marketing_new_event
- marketing_price_change
- marketing_promo
- volunteer_recruitment

# Préférences
- preference_optin
- preference_optout
- unsubscribe
```

## Triggers PostgreSQL

### `sync_notification_prefs_to_lists`
**Quand** : INSERT ou UPDATE sur `notification_preferences`
**Fait** :
1. Synchronise avec `list_subscriptions`
2. Met à jour `profiles.marketing_opt_in`

### `create_notification_prefs_on_profile_creation`
**Quand** : INSERT sur `profiles`
**Fait** :
1. Crée `notification_preferences` avec defaults
2. Déclenche `sync_notification_prefs_to_lists`
3. Crée abonnements aux listes de base

## RLS Policies

### `notification_preferences`
```sql
-- SELECT
auth.uid() = user_id OR is_admin()

-- UPDATE
auth.uid() = user_id

-- INSERT
auth.uid() = user_id
```

### `list_subscriptions`
```sql
-- SELECT
auth.uid() = user_id OR is_admin()

-- INSERT/UPDATE
is_admin() OR is_system()
```

### `distribution_lists`
```sql
-- SELECT
authenticated

-- INSERT/UPDATE/DELETE
is_admin()
```

## Variables d'environnement

```env
# Minimum requis
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
SEND_FROM_EMAIL=
NEXT_PUBLIC_SITE_URL=
```

## Débogage rapide

### Email non reçu ?
```sql
-- 1. Vérifier l'abonnement
SELECT subscribed FROM list_subscriptions
WHERE user_id = '...' AND list_id = '...';

-- 2. Vérifier digest_frequency
SELECT digest_frequency FROM notification_preferences
WHERE user_id = '...';

-- 3. Vérifier les logs
SELECT * FROM email_logs
WHERE user_id = '...'
ORDER BY sent_at DESC LIMIT 10;
```

### Trigger ne marche pas ?
```sql
-- Lister les triggers actifs
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Tester manuellement
UPDATE notification_preferences
SET events_announcements = true
WHERE user_id = '...';

-- Vérifier le résultat
SELECT * FROM list_subscriptions
WHERE user_id = '...' AND list_id = (
  SELECT id FROM distribution_lists WHERE slug = 'events-announcements'
);
```

### Admin ne peut pas envoyer ?
```sql
-- Vérifier le rôle
SELECT role FROM profiles WHERE id = '...';

-- Vérifier les listes actives
SELECT name, active FROM distribution_lists;

-- Compter les abonnés
SELECT COUNT(*) FROM list_subscriptions
WHERE list_id = '...' AND subscribed = true;
```

## Workflows courants

### Créer une nouvelle liste
```sql
INSERT INTO distribution_lists (name, slug, type, description, active)
VALUES (
  'Flash Sales',
  'flash-sales',
  'marketing',
  'Offres flash et ventes privées',
  true
);
```

### Abonner manuellement un utilisateur
```sql
INSERT INTO list_subscriptions (user_id, list_id, subscribed)
VALUES ('user-uuid', 'list-uuid', true)
ON CONFLICT (user_id, list_id)
DO UPDATE SET subscribed = true, updated_at = NOW();
```

### Désabonner tous les utilisateurs d'une liste
```sql
UPDATE list_subscriptions
SET subscribed = false, updated_at = NOW()
WHERE list_id = 'list-uuid';
```

### Migrer les anciens abonnés
```sql
-- Créer les préférences pour les utilisateurs existants
INSERT INTO notification_preferences (user_id, events_announcements, price_alerts)
SELECT id, marketing_opt_in, marketing_opt_in
FROM profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

## Tests à faire

### Fonctionnels
- [ ] Nouvel utilisateur → préférences créées auto
- [ ] Modifier préférences → sync vers listes
- [ ] Envoyer test email → reçu sur admin
- [ ] Envoyer email masse → tous les abonnés
- [ ] Cliquer unsubscribe → désabonné correctement

### Sécurité
- [ ] Non-admin → pas accès /api/admin/*
- [ ] Utilisateur → voit seulement ses préférences
- [ ] Token invalide → erreur 401
- [ ] RLS bloque accès non autorisé

### Performance
- [ ] 1000+ destinataires → temps acceptable
- [ ] Pas de doublons multi-listes
- [ ] API < 500ms response time

## Métriques importantes

```sql
-- Taux d'opt-in global
SELECT
  COUNT(*) FILTER (WHERE marketing_opt_in) * 100.0 / COUNT(*) as opt_in_rate
FROM profiles;

-- Emails envoyés aujourd'hui
SELECT email_type, COUNT(*)
FROM email_logs
WHERE sent_at >= CURRENT_DATE
GROUP BY email_type;

-- Top listes par abonnés
SELECT dl.name, COUNT(ls.user_id) as subs
FROM distribution_lists dl
LEFT JOIN list_subscriptions ls ON ls.list_id = dl.id AND ls.subscribed = true
GROUP BY dl.id, dl.name
ORDER BY subs DESC;

-- Taux de désabonnement
SELECT
  COUNT(*) FILTER (WHERE email_type IN ('unsubscribe', 'preference_optout')) as unsubs,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE email_type IN ('unsubscribe', 'preference_optout')) * 100.0 / COUNT(*) as rate
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '30 days';
```

## Commandes utiles

### Nettoyer les anciens logs (> 6 mois)
```sql
DELETE FROM email_logs
WHERE sent_at < NOW() - INTERVAL '6 months';
```

### Exporter les emails des abonnés
```sql
COPY (
  SELECT DISTINCT u.email
  FROM list_subscriptions ls
  JOIN auth.users u ON u.id = ls.user_id
  WHERE ls.list_id = 'list-uuid' AND ls.subscribed = true
) TO '/tmp/subscribers.csv' CSV HEADER;
```

### Reset les préférences d'un utilisateur
```sql
UPDATE notification_preferences
SET
  events_announcements = true,
  price_alerts = true,
  news_blog = false,
  volunteers_opportunities = false,
  partner_offers = false,
  digest_frequency = 'immediate'
WHERE user_id = 'user-uuid';
```

## Raccourcis clavier (dans l'admin)

| Touche | Action |
|--------|--------|
| `n` | Nouvelle liste (quand en focus) |
| `r` | Actualiser les listes |
| `c` | Composer un email |
| `Esc` | Fermer dialog |

## Liens rapides

- [Overview](./EMAIL_SYSTEM_OVERVIEW.md)
- [README](./EMAIL_SYSTEM_README.md)
- [Phase 1](./PHASE_1_UNSUBSCRIBE.md)
- [Phase 2](./PHASE_2_DISTRIBUTION_LISTS.md)
- [Phase 3](./PHASE_3_GRANULAR_PREFERENCES.md)
- [Phase 4](./PHASE_4_ADMIN_INTERFACE.md)
- [Resend Docs](https://resend.com/docs)
- [Supabase Docs](https://supabase.com/docs)
