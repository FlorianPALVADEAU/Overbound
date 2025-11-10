# Système Email OverBound - Vue d'ensemble complète

## Architecture globale

Le système email d'OverBound est composé de 4 phases principales qui travaillent ensemble pour offrir une gestion complète des communications par email.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTÈME EMAIL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Unsubscribe       Phase 2: Distribution Lists         │
│  ┌──────────────────┐       ┌──────────────────────────┐       │
│  │ - Liens unsubsc. │       │ - Listes par type        │       │
│  │ - Page préfs     │       │ - Abonnements auto       │       │
│  │ - Token unique   │◄──────┤ - Sync profiles          │       │
│  │ - Logs tracking  │       │ - RLS policies           │       │
│  └──────────────────┘       └──────────────────────────┘       │
│         │                              │                         │
│         ▼                              ▼                         │
│  Phase 3: Granular Prefs    Phase 4: Admin Interface           │
│  ┌──────────────────┐       ┌──────────────────────────┐       │
│  │ - Types d'emails │       │ - Email composer         │       │
│  │ - Fréquence      │       │ - Envoi test             │       │
│  │ - Trigger sync   │◄──────┤ - Envoi masse            │       │
│  │ - UI compte      │       │ - Gestion listes         │       │
│  └──────────────────┘       └──────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1 : Système de désinscription

### Objectif
Permettre aux utilisateurs de se désabonner facilement des emails marketing tout en respectant les réglementations RGPD.

### Composants clés
- **Liens de désinscription** : Tokens uniques dans chaque email
- **Page de préférences publique** : `/preferences/[token]`
- **Logging** : Traçabilité complète des actions
- **Mise à jour de profil** : Sync avec `profiles.marketing_opt_in`

### Fichiers principaux
- `src/app/preferences/[token]/page.tsx`
- `src/app/api/preferences/[token]/route.ts`
- `src/lib/email/unsubscribe.ts`

### Utilisation
```typescript
// Générer un lien de désinscription
const unsubscribeUrl = await generateUnsubscribeUrl(userId, email)

// Inclure dans un email
<a href="${unsubscribeUrl}">Se désinscrire</a>
```

## Phase 2 : Distribution Lists

### Objectif
Organiser les abonnés en listes thématiques pour un ciblage précis des communications.

### Types de listes
- **Marketing** : Offres commerciales et promotions
- **Events** : Annonces d'événements
- **News** : Actualités et blog
- **Volunteers** : Recrutement de bénévoles

### Composants clés
- **Table `distribution_lists`** : Métadonnées des listes
- **Table `list_subscriptions`** : Abonnements utilisateurs
- **View `list_recipients`** : Requête optimisée
- **RLS policies** : Sécurité au niveau base de données

### Migration
```bash
# Appliquée dans Supabase
sql/002_distribution_lists.sql
```

### API
```typescript
// Récupérer les destinataires d'une liste
GET /api/admin/distribution-lists/:id/subscribers

// Mettre à jour une liste
PATCH /api/admin/distribution-lists/:id
```

## Phase 3 : Préférences granulaires

### Objectif
Donner aux utilisateurs un contrôle fin sur les types d'emails qu'ils reçoivent et leur fréquence.

### Préférences disponibles
- `events_announcements` : Nouveaux événements
- `price_alerts` : Changements de prix
- `news_blog` : Articles et actualités
- `volunteers_opportunities` : Missions bénévoles
- `partner_offers` : Offres partenaires

### Fréquences
- `immediate` : Envoi immédiat (par défaut)
- `daily` : Digest quotidien
- `weekly` : Digest hebdomadaire
- `never` : Jamais

### Synchronisation automatique
```sql
-- Trigger qui met à jour les list_subscriptions
CREATE TRIGGER sync_notification_prefs_to_lists_trigger
AFTER INSERT OR UPDATE ON notification_preferences
```

### Nouveaux utilisateurs
Par défaut, les nouveaux inscrits sont abonnés à :
- ✅ Annonces d'événements
- ✅ Alertes de prix
- ❌ News/blog
- ❌ Bénévolat
- ❌ Offres partenaires

### Fichiers principaux
- `sql/003_notification_preferences.sql`
- `src/app/api/notification-preferences/route.ts`
- `src/components/preferences/PreferencesForm.tsx`
- `src/app/account/page.tsx` (intégration)

## Phase 4 : Interface d'administration

### Objectif
Permettre aux admins d'envoyer des emails marketing ciblés directement depuis le dashboard.

### Fonctionnalités
1. **Gestion des listes**
   - Création/modification de listes
   - Visualisation des statistiques
   - Gestion des abonnés

2. **Composition d'emails**
   - Éditeur HTML et texte brut
   - Sélection multi-listes
   - Aperçu du nombre de destinataires

3. **Envoi sécurisé**
   - Mode test (admin uniquement)
   - Validation avant envoi
   - Feedback en temps réel

### Workflow admin
```
1. Admin → Dashboard → Distribution Lists
2. Clic sur "Composer un email"
3. Rédaction du contenu
4. Sélection des listes cibles
5. Envoi test pour validation
6. Envoi de masse si OK
7. Confirmation et logs
```

### Fichiers principaux
- `src/app/admin/distribution-lists/page.tsx`
- `src/components/admin/distribution-lists/EmailComposer.tsx`
- `src/app/api/admin/distribution-lists/send-email/route.ts`

## Flux de données complet

### Inscription d'un nouvel utilisateur
```
1. User s'inscrit
   ↓
2. Trigger: create profile
   ↓
3. Trigger: create notification_preferences (defaults)
   ↓
4. Trigger: sync_notification_prefs_to_lists
   ↓
5. Insert dans list_subscriptions
   ↓
6. User abonné à events-announcements + price-alerts
```

### Envoi d'un email marketing
```
1. Admin compose email dans dashboard
   ↓
2. Sélectionne listes (ex: events-announcements)
   ↓
3. POST /api/admin/distribution-lists/send-email
   ↓
4. Récupération des subscribers (list_subscriptions)
   ↓
5. Filtre par digest_frequency='immediate'
   ↓
6. Dédoublonnage des destinataires
   ↓
7. sendMarketingEmail() → Resend API
   ↓
8. Logging dans email_logs
   ↓
9. Confirmation à l'admin
```

### Modification des préférences utilisateur
```
1. User va dans "Mon compte"
   ↓
2. Clique "Gérer mes préférences"
   ↓
3. Active/désactive des catégories
   ↓
4. PATCH /api/notification-preferences
   ↓
5. Update notification_preferences
   ↓
6. Trigger: sync_notification_prefs_to_lists
   ↓
7. Update list_subscriptions
   ↓
8. Update profiles.marketing_opt_in (si tout désactivé)
```

### Désinscription via email
```
1. User clique lien unsubscribe dans email
   ↓
2. GET /preferences/[token]
   ↓
3. Validation du token
   ↓
4. Affichage page préférences
   ↓
5. User désactive marketing_opt_in
   ↓
6. PATCH /api/preferences/[token]
   ↓
7. Update profiles.marketing_opt_in = false
   ↓
8. Logging dans email_logs
   ↓
9. Confirmation utilisateur
```

## Tables de base de données

### Hiérarchie et relations
```
auth.users (Supabase Auth)
    │
    ├── profiles (1:1)
    │   └── marketing_opt_in: boolean
    │
    ├── notification_preferences (1:1)
    │   ├── events_announcements: boolean
    │   ├── price_alerts: boolean
    │   ├── news_blog: boolean
    │   ├── volunteers_opportunities: boolean
    │   ├── partner_offers: boolean
    │   └── digest_frequency: text
    │
    └── list_subscriptions (1:N)
        ├── list_id → distribution_lists
        └── subscribed: boolean

distribution_lists
    ├── id: uuid
    ├── name: text
    ├── slug: text (unique)
    ├── type: text
    ├── description: text
    └── active: boolean

email_logs
    ├── user_id: uuid
    ├── email: text
    ├── email_type: text
    ├── context: jsonb
    └── sent_at: timestamptz
```

## Sécurité et permissions

### Row Level Security (RLS)

#### notification_preferences
- **SELECT** : User voit ses propres préfs OU admin voit tout
- **UPDATE** : User modifie ses propres préfs uniquement
- **INSERT** : User crée ses propres préfs uniquement

#### list_subscriptions
- **SELECT** : User voit ses abonnements OU admin voit tout
- **INSERT** : System ou admin uniquement
- **UPDATE** : System ou admin uniquement

#### distribution_lists
- **SELECT** : Tous les utilisateurs authentifiés
- **INSERT/UPDATE/DELETE** : Admins uniquement

### API Routes
- Routes `/api/preferences/*` : Public avec token
- Routes `/api/notification-preferences` : Authentifié
- Routes `/api/admin/*` : Admin uniquement

## Variables d'environnement requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Resend (envoi d'emails)
RESEND_API_KEY=re_xxx...
SEND_FROM_EMAIL=noreply@overbound.fr

# Application
NEXT_PUBLIC_SITE_URL=https://overbound-race.com
```

## Métriques et monitoring

### Logs disponibles
1. **email_logs** : Tous les envois d'emails
   - Types : transactionnel, marketing, admin
   - Contexte JSON avec métadonnées
   - Timestamp de chaque envoi

2. **Console serveur** : Erreurs et debug
   - Échecs d'envoi Resend
   - Erreurs de validation
   - Problèmes de permissions

### Requêtes utiles

#### Nombre d'emails envoyés par type
```sql
SELECT email_type, COUNT(*)
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY email_type
ORDER BY COUNT(*) DESC;
```

#### Utilisateurs qui se désabonnent le plus
```sql
SELECT email_type, COUNT(*)
FROM email_logs
WHERE email_type IN ('preference_optout', 'unsubscribe')
  AND sent_at > NOW() - INTERVAL '30 days'
GROUP BY email_type;
```

#### Abonnés par liste
```sql
SELECT dl.name, COUNT(ls.user_id) as subscribers
FROM distribution_lists dl
LEFT JOIN list_subscriptions ls ON ls.list_id = dl.id AND ls.subscribed = true
GROUP BY dl.id, dl.name
ORDER BY subscribers DESC;
```

## Tests recommandés

### Tests fonctionnels
- [ ] Inscription utilisateur → création automatique préférences
- [ ] Modification préférences → sync vers list_subscriptions
- [ ] Envoi test email → réception admin uniquement
- [ ] Envoi masse email → tous les abonnés ciblés
- [ ] Lien désinscription → mise à jour correcte
- [ ] Digest frequency → filtrage approprié

### Tests de sécurité
- [ ] User non-admin ne peut pas accéder `/api/admin/*`
- [ ] User ne peut voir que ses propres préférences
- [ ] Token unsubscribe invalide → erreur 401
- [ ] RLS policies empêchent accès non autorisé

### Tests de performance
- [ ] Envoi à 1000+ destinataires
- [ ] Temps de réponse API < 500ms
- [ ] Pas de doublons dans envois multi-listes
- [ ] Rate limiting Resend respecté

## Migration et déploiement

### Ordre d'application des migrations
```bash
1. sql/001_*.sql              # Base initiale (si existe)
2. sql/002_distribution_lists.sql
3. sql/003_notification_preferences.sql
```

### Déploiement
1. Appliquer les migrations SQL dans Supabase
2. Vérifier les RLS policies activées
3. Configurer les variables d'environnement
4. Déployer l'application Next.js
5. Tester le flow complet

## Maintenance

### Tâches régulières
- **Quotidien** : Vérifier les logs d'erreur d'envoi
- **Hebdomadaire** : Analyser les métriques d'engagement
- **Mensuel** : Nettoyer les anciens logs (optionnel)
- **Trimestriel** : Audit des permissions et sécurité

### Résolution de problèmes courants

#### Emails non reçus
1. Vérifier `digest_frequency` du destinataire
2. Vérifier `subscribed=true` dans list_subscriptions
3. Consulter email_logs pour erreurs
4. Vérifier limites Resend

#### Préférences non synchronisées
1. Vérifier triggers PostgreSQL actifs
2. Tester manuellement UPDATE notification_preferences
3. Consulter logs PostgreSQL

## Évolutions futures

### Court terme
- [ ] Templates d'emails prédéfinis
- [ ] Variables dynamiques ({{firstName}}, etc.)
- [ ] Prévisualisation HTML dans admin

### Moyen terme
- [ ] Digest hebdomadaire automatique
- [ ] Digest quotidien automatique
- [ ] Statistiques d'ouverture/clics

### Long terme
- [ ] A/B testing d'emails
- [ ] Automatisations (drip campaigns)
- [ ] Segmentation avancée
- [ ] Intégration CRM

## Documentation de référence

- [Phase 1 - Unsubscribe](./PHASE_1_UNSUBSCRIBE.md)
- [Phase 2 - Distribution Lists](./PHASE_2_DISTRIBUTION_LISTS.md)
- [Phase 3 - Granular Preferences](./PHASE_3_GRANULAR_PREFERENCES.md)
- [Phase 4 - Admin Interface](./PHASE_4_ADMIN_INTERFACE.md)

## Support

Pour questions techniques :
1. Consulter cette documentation
2. Vérifier les logs (email_logs, console)
3. Tester en local avec mode test activé
4. Consulter documentation Resend/Supabase
