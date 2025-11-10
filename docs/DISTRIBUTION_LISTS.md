# 📧 Distribution Lists & Email Preferences

Ce document décrit le système de gestion des listes de distribution et des préférences d'emails implémenté dans Overbound.

## ✅ Phase 1 : Système de Désabonnement (IMPLÉMENTÉ)

### 🔒 Conformité Légale

Le système de désabonnement est **obligatoire** selon :
- **GDPR Article 21** : Droit d'opposition au traitement des données
- **CAN-SPAM Act** : Obligation d'offrir un mécanisme opt-out fonctionnel
- **Bonnes pratiques email** : Impact positif sur la délivrabilité

### 🛠️ Ce qui a été implémenté

#### 1. Système de Tokens Sécurisés
- **Fichier** : `src/lib/email/unsubscribe.ts`
- Génération de tokens HMAC-SHA256
- Validation avec expiration (90 jours)
- Protection contre les attaques de replay
- Format : `base64(payload).signature`

#### 2. Pages de Désabonnement
- **`/unsubscribe/[token]`** : Page de désabonnement avec confirmation
- **`/unsubscribe/success`** : Page de confirmation
- **`/preferences`** : Centre de préférences authentifié

#### 3. API Endpoints
- **`POST /api/unsubscribe`** : Désabonnement via token (avec validation)
- **`GET /api/unsubscribe?token=xxx`** : One-click unsubscribe (RFC 8058)
- **`PATCH /api/preferences`** : Mise à jour des préférences (authentifié)
- **`GET /api/preferences`** : Récupération des préférences (authentifié)

#### 4. Emails Marketing Mis à Jour
Tous les emails marketing incluent maintenant :
- **Lien de désabonnement** dans le footer (cliquable)
- **Headers RFC 8058** : `List-Unsubscribe` et `List-Unsubscribe-Post`
- **Token unique** par utilisateur pour désabonnement sécurisé

Emails concernés :
- `NewEventAnnouncementEmail` - Annonces de nouveaux événements
- `PriceChangeReminderEmail` - Alertes de changement de prix
- `PromoCampaignEmail` - Campagnes promotionnelles

#### 5. Logging et Audit
- Tous les désabonnements sont loggés dans `email_logs`
- Type d'email : `'unsubscribe'` ou `'preference_optout'`
- Contexte JSON avec timestamp et source

### 🔧 Configuration Requise

#### Variable d'Environnement

Ajouter dans `.env.local` :

```bash
# Clé secrète pour signer les tokens de désabonnement (HMAC-SHA256)
# Générer avec : openssl rand -base64 32
UNSUBSCRIBE_SECRET=your-secret-key-here

# URL de base de l'application (pour générer les liens)
NEXT_PUBLIC_SITE_URL=https://overbound-race.com
```

**⚠️ IMPORTANT** : Générer une clé secrète forte :
```bash
openssl rand -base64 32
```

### 📋 Utilisation

#### Pour les Développeurs

**Envoyer un email marketing avec désabonnement :**
```typescript
import { sendNewEventAnnouncementEmail } from '@/lib/email'

await sendNewEventAnnouncementEmail({
  to: 'user@example.com',
  userId: 'user-uuid', // IMPORTANT : obligatoire pour le unsubscribe
  fullName: 'John Doe',
  eventTitle: 'Trail des Sommets',
  eventDate: '15 juin 2025',
  eventLocation: 'Chamonix',
  eventUrl: 'https://overbound-race.com/events/123',
  highlight: 'Nouveau parcours 50km !',
})
```

**Le système génère automatiquement :**
1. Token de désabonnement sécurisé
2. URL de désabonnement : `/unsubscribe/{token}`
3. Headers email pour one-click unsubscribe
4. Lien dans le footer de l'email

#### Pour les Utilisateurs

**Désabonnement :**
1. Cliquer sur "Se désinscrire" dans n'importe quel email marketing
2. Confirmer sur la page de désabonnement
3. Redirection vers la page de confirmation

**Réabonnement :**
1. Se connecter à son compte
2. Aller dans `/preferences`
3. Activer "Emails marketing et actualités"

### 🗂️ Structure des Fichiers

```
src/
├── app/
│   ├── unsubscribe/
│   │   ├── [token]/
│   │   │   └── page.tsx          # Désabonnement par token
│   │   └── success/
│   │       └── page.tsx           # Confirmation
│   ├── preferences/
│   │   └── page.tsx               # Centre de préférences
│   └── api/
│       ├── unsubscribe/
│       │   └── route.ts           # API désabonnement
│       └── preferences/
│           └── route.ts           # API préférences
├── lib/
│   └── email/
│       ├── unsubscribe.ts         # Logique tokens + URLs
│       └── marketing.ts           # Dispatch emails marketing
├── emails/
│   ├── NewEventAnnouncementEmail.tsx
│   ├── PriceChangeReminderEmail.tsx
│   └── PromoCampaignEmail.tsx
└── components/
    └── preferences/
        └── PreferencesForm.tsx    # Formulaire de préférences
```

---

## ✅ Phase 2 : Distribution Lists (IMPLÉMENTÉ)

### 🛠️ Ce qui a été implémenté

#### 1. Schéma de Base de Données
- **Fichier SQL** : `sql/002_distribution_lists.sql`
- Tables créées : `distribution_lists` et `list_subscriptions`
- Vue statistiques : `distribution_lists_stats`
- Fonctions utilitaires :
  - `get_list_subscriber_count(list_uuid)` - Nombre d'abonnés
  - `is_user_subscribed(user_uuid, list_uuid)` - Vérifier abonnement
- RLS (Row Level Security) configuré
- Triggers pour `updated_at` et timestamps d'abonnement
- Migration automatique des utilisateurs `marketing_opt_in = true`

#### 2. Types TypeScript
- **Fichier** : `src/types/DistributionList.ts`
- Types complets pour listes et abonnements
- Support des statistiques et relations

#### 3. APIs Backend

**Admin APIs** (authentification requise + role admin) :
- `GET /api/admin/distribution-lists` - Liste toutes les listes
  - Query params : `includeStats`, `type`, `activeOnly`
- `POST /api/admin/distribution-lists` - Créer une liste
- `GET /api/admin/distribution-lists/[id]` - Détails d'une liste
- `PATCH /api/admin/distribution-lists/[id]` - Mettre à jour une liste
- `DELETE /api/admin/distribution-lists/[id]` - Supprimer une liste
- `GET /api/admin/distribution-lists/[id]/subscribers` - Liste des abonnés
  - Query params : `subscribedOnly`, `limit`, `offset`
- `POST /api/admin/distribution-lists/[id]/subscribers` - Ajouter des abonnés

**User APIs** (authentification requise) :
- `GET /api/subscriptions` - Toutes les listes avec statut d'abonnement
- `PATCH /api/subscriptions` - Mettre à jour les abonnements (batch)
  - Format : `{ subscriptions: { [list_id]: boolean } }`
  - Synchro automatique avec `profiles.marketing_opt_in`

#### 4. Fonctions Helpers
- **Fichier** : `src/lib/subscriptions/lists.ts`
- `getListRecipients(listSlug)` - Destinataires d'une liste
- `getMultipleListsRecipients(listSlugs)` - Union de plusieurs listes
- `getIntersectionListsRecipients(listSlugs)` - Intersection de listes

#### 5. Intégration Marketing
- **Fichier** : `src/lib/email/marketing.ts`
- Nouvelles fonctions :
  - `getRecipientsFromList(listSlug)` - Depuis une liste
  - `getRecipientsFromLists(listSlugs)` - Depuis plusieurs listes
  - `getEventAnnouncementRecipients()` - Liste 'events-announcements'
  - `getPriceAlertRecipients()` - Liste 'price-alerts'
- `getMarketingOptInRecipients()` mis à jour pour utiliser les listes
  - Maintenant utilise : `['events-announcements', 'price-alerts', 'news-blog']`
  - Rétrocompatible avec le code existant

### 📋 Listes Créées Automatiquement

La migration SQL crée automatiquement 5 listes :

1. **Annonces d'événements** (`events-announcements`)
   - Type : `events`
   - Nouveaux événements Overbound
   - Ouverture des inscriptions

2. **Alertes de prix** (`price-alerts`)
   - Type : `marketing`
   - Changements de tarifs
   - Promotions limitées

3. **Actualités & Blog** (`news-blog`)
   - Type : `news`
   - Articles de blog
   - Contenus exclusifs

4. **Recrutement bénévoles** (`volunteers-recruitment`)
   - Type : `volunteers`
   - Offres de bénévolat
   - Affectations aux postes

5. **Offres partenaires** (`partners-offers`)
   - Type : `partners`
   - Promotions partenaires
   - Avantages exclusifs

### 🔧 Utilisation

#### Envoyer à une liste spécifique
```typescript
import { getRecipientsFromList, dispatchNewEventAnnouncement } from '@/lib/email/marketing'

// Récupérer les abonnés de la liste 'events-announcements'
const recipients = await getRecipientsFromList('events-announcements')

// Envoyer l'email
await dispatchNewEventAnnouncement({
  recipients,
  eventTitle: 'Trail des Sommets',
  eventDate: '15 juin 2025',
  eventLocation: 'Chamonix',
  eventUrl: 'https://overbound-race.com/events/123',
})
```

#### Envoyer à plusieurs listes
```typescript
// Envoyer à TOUS les utilisateurs abonnés à au moins UNE des listes
const recipients = await getRecipientsFromLists([
  'events-announcements',
  'price-alerts',
  'news-blog'
])
```

#### Gérer les abonnements (utilisateur)
```typescript
// Frontend
const response = await fetch('/api/subscriptions', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptions: {
      'uuid-list-1': true,  // S'abonner
      'uuid-list-2': false, // Se désabonner
    }
  })
})
```

### 📊 Statistiques

La vue `distribution_lists_stats` fournit :
- `subscriber_count` - Nombre d'abonnés actifs
- `unsubscriber_count` - Nombre de désabonnés
- `total_interactions` - Total d'interactions

```typescript
// Via l'API admin
const response = await fetch('/api/admin/distribution-lists?includeStats=true')
const { data } = await response.json()

// data contient les listes avec leurs statistiques
```

### 🔄 Migration Automatique

La migration SQL (`002_distribution_lists.sql`) :
1. Crée les 5 listes par défaut
2. Abonne automatiquement tous les users avec `marketing_opt_in = true` à :
   - `events-announcements`
   - `price-alerts`
   - `news-blog`
3. Enregistre la source : `'migration_marketing_opt_in'`

### ⚠️ Notes Importantes

1. **RLS activé** - Les utilisateurs ne peuvent voir/gérer que leurs propres abonnements
2. **Admins** - Ont accès complet à toutes les listes et abonnements
3. **Soft delete recommandé** - Utiliser `active = false` plutôt que DELETE
4. **Slugs uniques** - Les slugs doivent être uniques et URL-friendly
5. **Synchro marketing_opt_in** - Automatique quand un user s'abonne/désabonne

---

## ✅ Phase 3 : Préférences Granulaires (IMPLÉMENTÉ)

### 🛠️ Ce qui a été implémenté

#### 1. Schéma de Base de Données
- **Fichier SQL** : `sql/003_notification_preferences.sql`
- Table `notification_preferences` avec préférences détaillées
- Synchro automatique avec `list_subscriptions` via triggers
- Migration automatique des utilisateurs existants
- RLS configuré pour sécurité

**Structure de la table :**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id),

  -- Types d'emails marketing
  events_announcements BOOLEAN DEFAULT true,
  price_alerts BOOLEAN DEFAULT true,
  news_blog BOOLEAN DEFAULT false,
  volunteers_opportunities BOOLEAN DEFAULT false,
  partner_offers BOOLEAN DEFAULT false,

  -- Fréquence d'envoi
  digest_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'never'

  -- Emails transactionnels (toujours actifs)
  registration_confirmations BOOLEAN DEFAULT true,
  ticket_updates BOOLEAN DEFAULT true,
  account_security BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### 2. Synchronisation Automatique
- **Trigger `sync_notification_prefs_to_lists_trigger`** :
  - Quand un user active/désactive une préférence
  - Met à jour automatiquement `list_subscriptions`
  - Synchro bidirectionnelle avec les distribution lists
  - Met à jour `profiles.marketing_opt_in` automatiquement

#### 3. Types TypeScript
- **Fichier** : `src/types/NotificationPreferences.ts`
- Types complets pour préférences et fréquences
- Constantes pour toggles et options de fréquence
- Labels et descriptions en français

#### 4. API Endpoint
- **Fichier** : `src/app/api/notification-preferences/route.ts`
- `GET /api/notification-preferences` - Récupère les préférences (crée si inexistant)
- `PATCH /api/notification-preferences` - Met à jour les préférences
- Validation Zod des données
- Fonction DB `get_or_create_notification_preferences(user_id)` pour création automatique

#### 5. React Hook
- **Fichier** : `src/hooks/useNotificationPreferences.ts`
- Hook `useNotificationPreferences()` pour gérer les préférences
- Fonctions : `fetchPreferences()`, `updatePreferences()`
- Gestion d'état loading et erreurs

#### 6. Interface Utilisateur
- **Fichier mis à jour** : `src/components/preferences/PreferencesForm.tsx`
- 5 toggles pour les types d'emails marketing
- Sélecteur de fréquence (immédiat, quotidien, hebdomadaire, jamais)
- Section informative sur les emails transactionnels
- Sauvegarde avec feedback visuel
- Design responsive et accessible

#### 7. Logique d'Envoi d'Emails
- **Fichier mis à jour** : `src/lib/email/marketing.ts`
- Fonction `filterRecipientsByDigestFrequency()` ajoutée
- Filtre les destinataires selon leur préférence de fréquence
- Emails envoyés uniquement aux users avec `digest_frequency = 'immediate'`
- Users avec 'daily', 'weekly', ou 'never' sont filtrés
- Rétrocompatible (fallback sur 'immediate' si pas de préférence)

### 📋 Types de Préférences

| Préférence | Description | Liste associée |
|-----------|-------------|----------------|
| `events_announcements` | Annonces d'événements | `events-announcements` |
| `price_alerts` | Alertes de prix | `price-alerts` |
| `news_blog` | Actualités et blog | `news-blog` |
| `volunteers_opportunities` | Opportunités de bénévolat | `volunteers-recruitment` |
| `partner_offers` | Offres partenaires | `partners-offers` |

### 🔄 Fréquences d'Envoi

| Valeur | Label | Comportement |
|--------|-------|-------------|
| `immediate` | Immédiat | Envoyer dès qu'un email est disponible |
| `daily` | Quotidien | Regrouper dans un digest quotidien (à implémenter) |
| `weekly` | Hebdomadaire | Regrouper dans un digest hebdomadaire (à implémenter) |
| `never` | Jamais | Ne jamais envoyer d'emails marketing |

**Note** : Pour le moment, seul `immediate` envoie des emails. Les options `daily` et `weekly` sont préparées pour une future implémentation de digests.

### 🔧 Utilisation

#### Par l'Utilisateur

1. Se connecter et aller sur `/preferences`
2. Activer/désactiver les types d'emails souhaités
3. Choisir la fréquence de réception
4. Sauvegarder les modifications

#### Par le Développeur

**Les emails sont automatiquement filtrés :**
```typescript
import { dispatchNewEventAnnouncement, getEventAnnouncementRecipients } from '@/lib/email/marketing'

// Récupérer les abonnés
const recipients = await getEventAnnouncementRecipients()

// Dispatcher l'email - AUTOMATIQUEMENT filtré par digest_frequency
await dispatchNewEventAnnouncement({
  recipients,
  eventTitle: 'Trail des Sommets',
  // ... autres params
})

// Seuls les users avec digest_frequency = 'immediate' recevront l'email
```

**Vérifier les préférences manuellement :**
```typescript
import { supabaseAdmin } from '@/lib/supabase/server'

const { data: prefs } = await supabaseAdmin
  .from('notification_preferences')
  .select('*')
  .eq('user_id', userId)
  .single()

if (prefs?.events_announcements && prefs?.digest_frequency === 'immediate') {
  // Envoyer l'email
}
```

---

## 📊 Métriques et Analytics

### Métriques à Suivre

1. **Taux de désabonnement** : `unsubscribes / emails_sent`
2. **Taux d'ouverture** : Configurer Resend webhooks
3. **Taux de clic** : Tracking des CTAs
4. **Sources de désabonnement** : Depuis quel email ?
5. **Réabonnements** : Users qui se réabonnent

### Dashboard Admin (À Créer)

- Total d'abonnés par liste
- Croissance des abonnements (graphique)
- Taux de désabonnement par type d'email
- Top emails avec le plus de désabonnements

---

## 🔐 Sécurité

### Tokens de Désabonnement
- **HMAC-SHA256** : Impossible de forger sans la clé secrète
- **Expiration** : 90 jours (configurable)
- **Stateless** : Pas besoin de stockage en DB
- **Signature vérifiée** : Toute modification invalide le token

### Protection CSRF
- Les tokens incluent l'email de l'utilisateur
- Vérification stricte lors de la validation

### Rate Limiting (À Implémenter)
- Limiter les requêtes `/api/unsubscribe`
- Protéger contre les abus

---

## 🧪 Tests

### Tests Manuels

1. **Désabonnement par email** :
   - Envoyer un email marketing de test
   - Cliquer sur "Se désinscrire"
   - Vérifier la confirmation

2. **Désabonnement authentifié** :
   - Se connecter
   - Aller dans `/preferences`
   - Désactiver les emails marketing
   - Vérifier la sauvegarde

3. **Réabonnement** :
   - Réactiver dans `/preferences`
   - Vérifier la sauvegarde

### Tests Automatisés (À Créer)

```typescript
// Test token generation
describe('Unsubscribe Tokens', () => {
  it('should generate valid token', () => {
    const token = generateUnsubscribeToken({ userId: '123', email: 'test@example.com' })
    expect(token).toBeDefined()
    expect(token.split('.')).toHaveLength(2)
  })

  it('should validate correct token', () => {
    const token = generateUnsubscribeToken({ userId: '123', email: 'test@example.com' })
    const payload = validateUnsubscribeToken(token)
    expect(payload.userId).toBe('123')
    expect(payload.email).toBe('test@example.com')
  })

  it('should reject tampered token', () => {
    const token = generateUnsubscribeToken({ userId: '123', email: 'test@example.com' })
    const tampered = token.replace(/.$/, 'x')
    expect(() => validateUnsubscribeToken(tampered)).toThrow('Invalid token signature')
  })
})
```

---

## 📖 Ressources

- [GDPR Article 21](https://gdpr-info.eu/art-21-gdpr/)
- [RFC 8058 - One-Click Unsubscribe](https://datatracker.ietf.org/doc/html/rfc8058)
- [CAN-SPAM Act](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [Resend Documentation](https://resend.com/docs)

---

## ❓ FAQ

**Q: Pourquoi HMAC plutôt que JWT ?**
R: HMAC est plus simple, plus rapide et suffisant pour des tokens stateless avec expiration. Pas besoin de payload complexe.

**Q: Peut-on désabonner sans être connecté ?**
R: Oui ! Le token dans l'email permet de désabonner sans authentification (conformité légale).

**Q: Les emails transactionnels sont-ils affectés ?**
R: Non. Le désabonnement ne concerne QUE les emails marketing. Les emails critiques (billets, confirmations) continuent d'être envoyés.

**Q: Que se passe-t-il si l'utilisateur clique plusieurs fois ?**
R: Pas de problème. Le système est idempotent : désabonner quelqu'un qui est déjà désabonné ne fait rien.

**Q: Les tokens expirent-ils ?**
R: Oui, après 90 jours. Au-delà, l'utilisateur doit utiliser le centre de préférences authentifié.

---

## 🚀 Prochaines Étapes

1. ✅ **Phase 1** : Système de désabonnement (TERMINÉ)
2. ✅ **Phase 2** : Distribution lists (TERMINÉ)
3. ✅ **Phase 3** : Préférences granulaires (TERMINÉ)
4. ✅ **UI Admin** : Interface pour gérer les listes (TERMINÉ)
5. ⏳ **Digests quotidiens/hebdomadaires** : Implémenter les emails groupés (TODO)
6. ⏳ **Tests automatisés** (TODO)
7. ⏳ **Dashboard analytics** : Métriques avancées (TODO)
8. ⏳ **Double opt-in** : Confirmation d'abonnement (TODO)

---

## 📦 Installation

### Phase 1 : Système de Désabonnement

#### 1. Configuration des Variables d'Environnement

Ajouter dans `.env.local` :
```bash
# Clé secrète pour signer les tokens de désabonnement
UNSUBSCRIBE_SECRET=your-secret-key-here  # Générer avec: openssl rand -base64 32

# URL de base de l'application
NEXT_PUBLIC_SITE_URL=https://overbound-race.com
```

#### 2. Tester le Système

1. Envoyer un email marketing de test
2. Vérifier la présence du lien de désabonnement
3. Tester le flow complet

### Phase 2 : Distribution Lists

#### 1. Exécuter la Migration SQL

Dans Supabase SQL Editor, exécuter `sql/002_distribution_lists.sql` :
- Crée les tables `distribution_lists` et `list_subscriptions`
- Crée 5 listes par défaut
- Migre les utilisateurs existants avec `marketing_opt_in = true`
- Configure les RLS policies

#### 2. Tester les APIs

```bash
# Lister les listes (admin)
curl -X GET https://your-domain.com/api/admin/distribution-lists \
  -H "Cookie: your-auth-cookie"

# Voir ses abonnements (utilisateur)
curl -X GET https://your-domain.com/api/subscriptions \
  -H "Cookie: your-auth-cookie"
```

#### 3. Utiliser dans le Code

```typescript
// Dans votre code marketing
import { getEventAnnouncementRecipients } from '@/lib/email/marketing'

const recipients = await getEventAnnouncementRecipients()
// Les recipients incluent automatiquement les unsubscribe URLs
```

### Phase 3 : Préférences Granulaires

#### 1. Exécuter la Migration SQL

Dans Supabase SQL Editor, exécuter `sql/003_notification_preferences.sql` :
- Crée la table `notification_preferences`
- Configure les triggers de synchronisation
- Migre les utilisateurs existants
- Configure les RLS policies

#### 2. Vérifier la Synchro

```sql
-- Vérifier qu'un utilisateur a des préférences
SELECT * FROM notification_preferences WHERE user_id = 'your-user-id';

-- Vérifier la synchro avec les listes
SELECT
  np.events_announcements,
  ls.subscribed,
  dl.slug
FROM notification_preferences np
LEFT JOIN list_subscriptions ls ON ls.user_id = np.user_id
LEFT JOIN distribution_lists dl ON dl.id = ls.list_id
WHERE np.user_id = 'your-user-id' AND dl.slug = 'events-announcements';
```

#### 3. Tester l'Interface

1. Se connecter à l'application
2. Aller sur `/preferences`
3. Modifier les préférences
4. Vérifier que les changements sont sauvegardés
5. Vérifier la synchro avec les distribution lists

#### 4. Tester le Filtrage des Emails

```typescript
// Les emails marketing respectent automatiquement digest_frequency
import { dispatchNewEventAnnouncement, getEventAnnouncementRecipients } from '@/lib/email/marketing'

const recipients = await getEventAnnouncementRecipients()
// recipients est déjà filtré par digest_frequency = 'immediate'

await dispatchNewEventAnnouncement({
  recipients,
  eventTitle: 'Trail Test',
  eventDate: '2025-06-15',
  eventLocation: 'Chamonix',
  eventUrl: 'https://overbound-race.com/events/test',
})
```

---

**Dernière mise à jour** : 9 novembre 2025
**Auteur** : Claude (Anthropic)
