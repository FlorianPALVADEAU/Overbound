# Phase 4 : Admin Interface pour Distribution Lists

## Vue d'ensemble

Phase 4 ajoute une interface complète d'administration pour gérer les listes de distribution et envoyer des emails marketing directement depuis le dashboard admin.

## Fonctionnalités implémentées

### 1. Page de gestion des listes de distribution
- **Localisation** : `/admin/distribution-lists`
- **Composant** : `src/app/admin/distribution-lists/page.tsx`
- **Fonctionnalités** :
  - Visualisation de toutes les listes avec statistiques
  - Filtrage par type (marketing, événements, actualités, bénévoles)
  - Création et modification de listes
  - Gestion des abonnés
  - Interface d'envoi d'emails

### 2. Composant EmailComposer
- **Localisation** : `src/components/admin/distribution-lists/EmailComposer.tsx`
- **Fonctionnalités** :
  - Composition d'emails HTML et texte brut
  - Sélection de listes de distribution multiples
  - Comptage en temps réel des destinataires
  - Mode test (envoi à l'admin uniquement)
  - Envoi de masse aux listes sélectionnées
  - Validation des champs requis
  - Feedback visuel du statut d'envoi

### 3. API d'envoi d'emails
- **Endpoint** : `POST /api/admin/distribution-lists/send-email`
- **Fonctionnalités** :
  - Vérification des permissions admin
  - Mode test pour validation avant envoi
  - Dédoublonnage des destinataires (multi-liste)
  - Intégration avec le système de marketing email existant
  - Logging automatique des envois
  - Gestion des erreurs et retry

### 4. Navigation admin
- **Tab** : "Distribution Lists" dans la sidebar admin
- **Icon** : List (lucide-react)
- **Intégration** : Ajouté à `adminNavItems.ts` et `useAdminDashboardStore.ts`

## Structure des fichiers

```
src/
├── app/
│   └── admin/
│       └── distribution-lists/
│           ├── page.tsx                    # Page principale
│           └── send-email/
│               └── route.ts                # API d'envoi
├── components/
│   └── admin/
│       └── distribution-lists/
│           ├── EmailComposer.tsx           # Composant d'envoi
│           ├── DistributionListsTable.tsx  # Table des listes
│           ├── ListFormDialog.tsx          # Création/édition
│           └── SubscribersDialog.tsx       # Gestion des abonnés
└── store/
    └── useAdminDashboardStore.ts           # État global admin
```

## Utilisation

### Accéder à l'interface
1. Se connecter en tant qu'admin
2. Aller dans le dashboard admin
3. Cliquer sur "Distribution Lists" dans la sidebar
4. Deux vues disponibles :
   - **Gestion des listes** : Vue par défaut
   - **Composer un email** : Bouton "Composer un email"

### Envoyer un email marketing

#### Mode test (recommandé en premier)
1. Cliquer sur "Composer un email"
2. Remplir les champs :
   - **Sujet** : Titre de l'email (requis)
   - **Pré-header** : Texte d'aperçu (optionnel)
   - **Contenu HTML** : Corps de l'email (requis)
   - **Contenu texte** : Version texte brut (optionnel, recommandé)
3. Sélectionner une ou plusieurs listes
4. Cliquer sur **"Envoyer un test"**
5. Vérifier l'email reçu sur votre adresse admin

#### Envoi en production
1. Après validation du test, même processus
2. Cliquer sur **"Envoyer à X destinataires"**
3. Confirmation visuelle après envoi
4. Redirection automatique vers la liste après 3 secondes

### Gestion des listes
- **Créer** : Bouton "Nouvelle liste"
- **Modifier** : Action "Edit" sur chaque ligne
- **Voir abonnés** : Action "View Subscribers"
- **Statistiques** : Cartes en haut de page

## Sécurité

### Vérifications implémentées
1. **Authentification** : Vérification de l'utilisateur connecté
2. **Autorisation** : Vérification du rôle admin
3. **Validation** : Schema Zod pour tous les inputs
4. **Mode test** : Isolation complète des envois de test
5. **Rate limiting** : Géré par le système marketing existant

### Permissions
- **Lecture** : Admins uniquement
- **Création de listes** : Admins uniquement
- **Modification de listes** : Admins uniquement
- **Envoi d'emails** : Admins uniquement

## Intégration avec le système existant

### Respect des préférences utilisateur
Le système d'envoi utilise `sendMarketingEmail()` qui :
- Filtre automatiquement par `digest_frequency`
- Respecte les préférences de notification
- Ne spamme pas les utilisateurs qui ont choisi "never"
- Log tous les envois dans `email_logs`

### Compatibilité
- Utilise les mêmes templates email que le reste du système
- S'intègre avec Resend pour l'envoi
- Respecte les limites de rate de Resend
- Utilise les même variables d'environnement :
  - `RESEND_API_KEY`
  - `SEND_FROM_EMAIL`

## Schéma de données

### Requête d'envoi
```typescript
{
  subject: string          // Sujet de l'email (requis)
  preheader?: string       // Texte d'aperçu (optionnel)
  bodyHtml: string         // Contenu HTML (requis)
  bodyText?: string        // Contenu texte brut (optionnel)
  listIds: string[]        // IDs des listes (min 1)
  testMode: boolean        // true = envoi admin uniquement
}
```

### Réponse d'envoi
```typescript
{
  success: true
  message: string          // Message de confirmation
  recipientCount: number   // Nombre de destinataires
}
```

## Workflow typique

1. **Préparation**
   - Admin crée/vérifie les listes de distribution
   - Vérifie le nombre d'abonnés par liste

2. **Composition**
   - Rédige le sujet et le contenu
   - Sélectionne les listes cibles
   - Vérifie le compte de destinataires

3. **Test**
   - Envoie un email de test
   - Vérifie le rendu dans sa boîte email
   - Ajuste si nécessaire

4. **Envoi**
   - Lance l'envoi de masse
   - Attend la confirmation
   - Vérifie les logs si besoin

5. **Suivi**
   - Consulte les logs d'email
   - Vérifie les métriques d'envoi
   - Analyse les résultats

## Améliorations futures possibles

### Court terme
- [ ] Prévisualisation HTML dans l'interface
- [ ] Templates d'emails pré-définis
- [ ] Variables dynamiques ({{firstName}}, {{eventName}}, etc.)
- [ ] Planification d'envoi différé

### Moyen terme
- [ ] A/B testing de sujets
- [ ] Statistiques d'ouverture et de clics
- [ ] Segmentation avancée des listes
- [ ] Editeur WYSIWYG pour HTML

### Long terme
- [ ] Automatisations d'emails (drip campaigns)
- [ ] Personnalisation dynamique par segment
- [ ] Analytics et rapports détaillés
- [ ] Intégration avec un CRM

## Dépannage

### L'email de test n'arrive pas
- Vérifier que `RESEND_API_KEY` est configuré
- Vérifier que `SEND_FROM_EMAIL` est une adresse vérifiée dans Resend
- Consulter les logs Resend pour erreurs d'envoi

### Les destinataires ne reçoivent pas les emails
- Vérifier que les listes ont des abonnés (`subscribed=true`)
- Vérifier les préférences de `digest_frequency` des utilisateurs
- Vérifier les logs dans la table `email_logs`

### Erreur "Failed to send emails"
- Vérifier les limites de rate de Resend
- Vérifier la connexion à Supabase
- Consulter les logs serveur pour détails

## Support

Pour toute question ou problème :
1. Consulter les logs serveur
2. Vérifier les logs Supabase
3. Consulter les logs Resend
4. Vérifier la documentation Resend : https://resend.com/docs
