# Système Email OverBound

## Démarrage rapide

Ce système offre une gestion complète des emails marketing et transactionnels pour OverBound.

### Pour les administrateurs

#### Envoyer un email marketing

1. Connectez-vous au dashboard admin : `/admin`
2. Cliquez sur **"Distribution Lists"** dans la sidebar
3. Cliquez sur **"Composer un email"**
4. Remplissez le formulaire :
   - Sujet (requis)
   - Pré-header (optionnel mais recommandé)
   - Contenu HTML (requis)
   - Contenu texte brut (optionnel mais recommandé)
5. Sélectionnez une ou plusieurs listes de distribution
6. Cliquez sur **"Envoyer un test"** pour vérifier
7. Si tout est OK, cliquez sur **"Envoyer à X destinataires"**

#### Gérer les listes de distribution

1. Dans la page "Distribution Lists"
2. Vue d'ensemble avec statistiques (nombre total, abonnés, taux moyen)
3. Onglets pour filtrer par type (Marketing, Événements, Actualités, Bénévoles)
4. Actions disponibles :
   - **Nouvelle liste** : Créer une nouvelle liste
   - **Edit** : Modifier une liste existante
   - **View Subscribers** : Voir et gérer les abonnés
   - **Actualiser** : Recharger les données

### Pour les utilisateurs

#### Gérer mes préférences email

1. Connectez-vous à votre compte : `/account`
2. Section **"Préférences de notifications"**
3. Cliquez sur **"Gérer mes préférences"**
4. Activez/désactivez les types d'emails souhaités :
   - Annonces d'événements
   - Alertes de prix
   - Actualités et blog
   - Opportunités de bénévolat
   - Offres partenaires
5. Choisissez la fréquence de réception :
   - Immédiat (par défaut)
   - Quotidien (digest)
   - Hebdomadaire (digest)
   - Jamais
6. Cliquez sur **"Enregistrer"**

#### Se désinscrire des emails

**Méthode 1 : Via un email reçu**
1. Ouvrez n'importe quel email marketing d'OverBound
2. Cliquez sur le lien **"Se désinscrire"** en bas
3. Confirmez votre choix sur la page qui s'ouvre

**Méthode 2 : Via votre compte**
1. Allez dans "Mon compte" → "Préférences de notifications"
2. Désactivez toutes les catégories d'emails marketing
3. OU réglez la fréquence sur "Jamais"

## Architecture du système

Le système est divisé en 4 phases complémentaires :

### Phase 1 : Système de désinscription
- Liens uniques dans chaque email
- Page de préférences publique
- Tracking complet des actions

### Phase 2 : Listes de distribution
- Organisation par thématiques
- Gestion des abonnements
- Sécurité avec RLS

### Phase 3 : Préférences granulaires
- Contrôle fin par l'utilisateur
- Choix de fréquence
- Synchronisation automatique

### Phase 4 : Interface admin
- Composition d'emails
- Envoi test et production
- Gestion des listes

## Structure des fichiers

```
📁 Overbound/
├── 📁 docs/
│   ├── EMAIL_SYSTEM_OVERVIEW.md          ← Vue d'ensemble complète
│   ├── EMAIL_SYSTEM_README.md            ← Ce fichier
│   ├── PHASE_1_UNSUBSCRIBE.md            ← Détails Phase 1
│   ├── PHASE_2_DISTRIBUTION_LISTS.md     ← Détails Phase 2
│   ├── PHASE_3_GRANULAR_PREFERENCES.md   ← Détails Phase 3
│   └── PHASE_4_ADMIN_INTERFACE.md        ← Détails Phase 4
│
├── 📁 sql/
│   ├── 002_distribution_lists.sql        ← Phase 2
│   └── 003_notification_preferences.sql  ← Phase 3
│
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 admin/
│   │   │   └── 📁 distribution-lists/
│   │   │       ├── page.tsx              ← Page admin Phase 4
│   │   │       └── 📁 send-email/
│   │   │           └── route.ts          ← API envoi Phase 4
│   │   ├── 📁 api/
│   │   │   ├── 📁 notification-preferences/
│   │   │   │   └── route.ts              ← API Phase 3
│   │   │   ├── 📁 preferences/
│   │   │   │   ├── route.ts              ← API Phase 1 (auth)
│   │   │   │   └── 📁 [token]/
│   │   │   │       └── route.ts          ← API Phase 1 (public)
│   │   │   └── 📁 admin/
│   │   │       └── 📁 distribution-lists/
│   │   │           ├── route.ts          ← CRUD listes
│   │   │           └── 📁 [id]/
│   │   │               └── 📁 subscribers/
│   │   │                   └── route.ts  ← Gestion abonnés
│   │   ├── 📁 account/
│   │   │   └── page.tsx                  ← Intégration Phase 3
│   │   └── 📁 preferences/
│   │       └── 📁 [token]/
│   │           └── page.tsx              ← Page publique Phase 1
│   │
│   ├── 📁 components/
│   │   ├── 📁 admin/
│   │   │   └── 📁 distribution-lists/
│   │   │       ├── EmailComposer.tsx     ← Composant Phase 4
│   │   │       ├── DistributionListsTable.tsx
│   │   │       ├── ListFormDialog.tsx
│   │   │       └── SubscribersDialog.tsx
│   │   └── 📁 preferences/
│   │       └── PreferencesForm.tsx       ← Composant Phase 3
│   │
│   ├── 📁 lib/
│   │   └── 📁 email/
│   │       ├── unsubscribe.ts            ← Helpers Phase 1
│   │       └── marketing.ts              ← Fonctions d'envoi
│   │
│   ├── 📁 hooks/
│   │   └── useDistributionLists.ts       ← Hook Phase 2
│   │
│   └── 📁 types/
│       ├── DistributionList.ts           ← Types Phase 2
│       └── NotificationPreferences.ts    ← Types Phase 3
```

## Base de données

### Tables principales

#### `distribution_lists`
Définit les listes de distribution disponibles.

```sql
- id: UUID
- name: TEXT (ex: "Événements OverBound")
- slug: TEXT (ex: "events-announcements", unique)
- type: TEXT (ex: "events", "marketing", "news", "volunteers")
- description: TEXT
- active: BOOLEAN
```

#### `list_subscriptions`
Enregistre les abonnements des utilisateurs aux listes.

```sql
- id: UUID
- user_id: UUID → auth.users
- list_id: UUID → distribution_lists
- subscribed: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `notification_preferences`
Stocke les préférences détaillées de chaque utilisateur.

```sql
- id: UUID
- user_id: UUID → auth.users (UNIQUE)
- events_announcements: BOOLEAN (défaut: true)
- price_alerts: BOOLEAN (défaut: true)
- news_blog: BOOLEAN (défaut: false)
- volunteers_opportunities: BOOLEAN (défaut: false)
- partner_offers: BOOLEAN (défaut: false)
- digest_frequency: TEXT (défaut: 'immediate')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `email_logs`
Enregistre tous les envois d'emails pour audit et debug.

```sql
- id: UUID
- user_id: UUID → auth.users
- email: TEXT
- email_type: TEXT (ex: "marketing_new_event", "unsubscribe")
- context: JSONB (métadonnées additionnelles)
- sent_at: TIMESTAMPTZ
```

### Triggers automatiques

#### `sync_notification_prefs_to_lists`
Déclenché lors de la modification de `notification_preferences`.
- Met à jour automatiquement `list_subscriptions`
- Maintient `profiles.marketing_opt_in` cohérent

#### `create_notification_prefs_on_profile_creation`
Déclenché lors de la création d'un nouveau profil.
- Crée automatiquement les préférences par défaut
- Abonne l'utilisateur aux listes de base

## API Endpoints

### Publics (avec token)

```
GET  /api/preferences/[token]       # Récupérer préférences via token
PATCH /api/preferences/[token]      # Mettre à jour via token
```

### Authentifiés

```
GET   /api/notification-preferences  # Récupérer ses préférences
PATCH /api/notification-preferences  # Mettre à jour ses préférences
```

### Admin uniquement

```
GET    /api/admin/distribution-lists              # Lister toutes les listes
POST   /api/admin/distribution-lists              # Créer une liste
GET    /api/admin/distribution-lists/:id          # Détails d'une liste
PATCH  /api/admin/distribution-lists/:id          # Modifier une liste
DELETE /api/admin/distribution-lists/:id          # Supprimer une liste
GET    /api/admin/distribution-lists/:id/subscribers  # Abonnés d'une liste
POST   /api/admin/distribution-lists/send-email  # Envoyer un email
```

## Environnement

### Variables requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Resend (emails)
RESEND_API_KEY=re_xxx...
SEND_FROM_EMAIL=noreply@overbound.fr

# App
NEXT_PUBLIC_SITE_URL=https://overbound-race.com
```

### Configuration Resend

1. Créer un compte sur [resend.com](https://resend.com)
2. Vérifier le domaine d'envoi (`overbound.fr`)
3. Obtenir l'API key
4. Configurer les DNS records (SPF, DKIM)

### Configuration Supabase

1. Appliquer les migrations SQL dans l'ordre
2. Vérifier que RLS est activé sur toutes les tables
3. Tester les policies avec différents rôles
4. Configurer les variables d'environnement

## Développement

### Installation

```bash
# Cloner le repo
git clone https://github.com/votre-org/overbound.git
cd overbound

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# Lancer en dev
npm run dev
```

### Migrations

```bash
# Dans Supabase SQL Editor, exécuter dans l'ordre :
1. sql/002_distribution_lists.sql
2. sql/003_notification_preferences.sql
```

### Tests

```bash
# Lancer les tests
npm test

# Tests E2E
npm run test:e2e

# Linter
npm run lint
```

## Utilisation du système

### Cas d'usage : Annoncer un nouvel événement

```typescript
// 1. Admin compose l'email dans le dashboard
// 2. Sélectionne la liste "events-announcements"
// 3. Le système :
//    - Récupère tous les abonnés à cette liste
//    - Filtre par digest_frequency='immediate'
//    - Envoie via Resend
//    - Log dans email_logs

// Résultat : Tous les utilisateurs abonnés aux annonces
// d'événements avec envoi immédiat reçoivent l'email.
```

### Cas d'usage : Utilisateur change ses préférences

```typescript
// 1. User va dans /account
// 2. Clique "Gérer mes préférences"
// 3. Désactive "Annonces d'événements"
// 4. Le trigger sync_notification_prefs_to_lists :
//    - Met à jour list_subscriptions
//    - Marque subscribed=false pour events-announcements
// 5. L'utilisateur ne recevra plus d'emails d'événements
```

### Cas d'usage : Digest hebdomadaire

```typescript
// 1. User règle digest_frequency='weekly' pour news_blog
// 2. Admin envoie un email à la liste "news-blog"
// 3. Le système filtre les destinataires :
//    - Ignore ceux avec digest_frequency='weekly'
//    - Envoie seulement à 'immediate'
// 4. Un cron job (à implémenter) enverra le digest hebdo
//    avec tous les articles de la semaine
```

## Dépannage

### Problème : Emails non reçus

**Vérifications :**
1. L'utilisateur est-il abonné ? → Vérifier `list_subscriptions.subscribed`
2. Quelle est sa fréquence ? → Vérifier `notification_preferences.digest_frequency`
3. L'email a-t-il été envoyé ? → Consulter `email_logs`
4. Erreur Resend ? → Vérifier logs Resend dashboard

**Solution :**
```sql
-- Vérifier l'état d'un utilisateur
SELECT
  np.*,
  ls.list_id,
  ls.subscribed,
  dl.name as list_name
FROM notification_preferences np
LEFT JOIN list_subscriptions ls ON ls.user_id = np.user_id
LEFT JOIN distribution_lists dl ON dl.id = ls.list_id
WHERE np.user_id = 'user-uuid-here';
```

### Problème : Trigger ne se déclenche pas

**Vérifications :**
1. Le trigger existe ? → `\df` dans psql
2. Le trigger est activé ? → Vérifier dans Supabase
3. Les permissions sont OK ? → Vérifier RLS

**Solution :**
```sql
-- Re-créer le trigger
DROP TRIGGER IF EXISTS sync_notification_prefs_to_lists_trigger
  ON notification_preferences;

-- Puis exécuter la migration à nouveau
```

### Problème : Admin ne peut pas envoyer d'emails

**Vérifications :**
1. L'utilisateur a le rôle admin ? → `profiles.role = 'admin'`
2. Les listes sont actives ? → `distribution_lists.active = true`
3. Les listes ont des abonnés ? → Vérifier via View Subscribers

**Solution :**
```sql
-- Vérifier le rôle
SELECT id, role FROM profiles WHERE id = 'user-uuid-here';

-- Activer une liste
UPDATE distribution_lists SET active = true WHERE slug = 'events-announcements';
```

## Sécurité

### Bonnes pratiques

1. **Jamais** exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
2. **Toujours** valider les inputs avec Zod
3. **Toujours** vérifier les permissions avant actions sensibles
4. **Toujours** utiliser RLS sur les tables
5. **Jamais** logger les emails des utilisateurs en clair

### Audit

```sql
-- Derniers unsubscribes
SELECT * FROM email_logs
WHERE email_type IN ('unsubscribe', 'preference_optout')
ORDER BY sent_at DESC
LIMIT 100;

-- Activité suspecte (trop d'emails en peu de temps)
SELECT user_id, email, COUNT(*) as email_count
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, email
HAVING COUNT(*) > 50;
```

## Support

### Documentation complète
- [Vue d'ensemble du système](./EMAIL_SYSTEM_OVERVIEW.md)
- [Phase 1 - Unsubscribe](./PHASE_1_UNSUBSCRIBE.md)
- [Phase 2 - Distribution Lists](./PHASE_2_DISTRIBUTION_LISTS.md)
- [Phase 3 - Granular Preferences](./PHASE_3_GRANULAR_PREFERENCES.md)
- [Phase 4 - Admin Interface](./PHASE_4_ADMIN_INTERFACE.md)

### Ressources externes
- [Resend Documentation](https://resend.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Contact
Pour questions ou bugs, créer une issue sur GitHub.
