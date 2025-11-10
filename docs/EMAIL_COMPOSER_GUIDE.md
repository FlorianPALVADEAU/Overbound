# Guide d'utilisation du Compositeur d'Emails

## Vue d'ensemble

Le compositeur d'emails permet aux admins d'envoyer des emails marketing personnalisés aux listes de distribution, avec gestion automatique :
- **Logo Overbound** : Ajouté automatiquement en haut
- **Lien de désinscription** : Généré automatiquement pour chaque destinataire
- **Footer RGPD** : Informations légales et contact

## Fonctionnalités automatiques

### 1. Logo
Le logo Overbound est **automatiquement ajouté** en haut de chaque email. Vous n'avez pas besoin de l'inclure dans votre HTML.

**URL du logo** : `https://overbound-race.com/images/totem_logo.png`

### 2. Lien de désinscription
Un lien unique de désinscription est **automatiquement généré** pour chaque destinataire et ajouté au footer.

Le lien respecte les standards email :
- Header `List-Unsubscribe` pour Gmail et Outlook
- Header `List-Unsubscribe-Post` pour one-click unsubscribe
- Lien visible dans le footer pour tous les clients email

### 3. Footer RGPD
Un footer standard est ajouté contenant :
- Mention de réception d'email
- Lien de désinscription (unique par utilisateur)
- Email de support
- Mention RGPD

## Composer un email

### Champs du formulaire

#### Sujet (requis)
Le titre de l'email qui apparaît dans la boîte de réception.

**Exemple** :
```
Nouveau : Trail des Montagnes 2025 🏔️
```

#### Pré-header (optionnel mais recommandé)
Le texte d'aperçu qui apparaît après le sujet dans la plupart des clients email.

**Exemple** :
```
Inscrivez-vous dès maintenant et profitez de 20% de réduction early bird !
```

#### Contenu HTML (requis)
Le corps principal de votre email en HTML.

**Important** :
- Écrivez **uniquement le contenu** de l'email
- Le logo et le footer sont ajoutés automatiquement
- Utilisez du HTML simple et compatible email

**Exemple de bon contenu** :
```html
<h1 style="color: #111827; font-size: 28px; margin-bottom: 16px;">
  Nouveau Trail : Les Montagnes de l'Ubaye 🏔️
</h1>

<p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  Salut les Warriors !
</p>

<p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  Nous sommes ravis de vous annoncer notre prochain événement :
  <strong>Trail des Montagnes de l'Ubaye</strong>, le 15 juin 2025.
</p>

<div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
  <p style="margin: 0; color: #1f2937; font-size: 14px;">
    <strong>Offre Early Bird :</strong> -20% jusqu'au 31 mars !
  </p>
</div>

<p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
  Au programme :
</p>

<ul style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 24px;">
  <li>3 parcours : 10km, 25km, et 50km</li>
  <li>Dénivelé : de 500m à 2500m</li>
  <li>Ravitaillements tous les 5km</li>
  <li>Douche chaude et repas à l'arrivée</li>
</ul>

<div style="text-align: center; margin: 32px 0;">
  <a href="https://overbound-race.com/events/trail-ubaye-2025"
     style="display: inline-block; background-color: #3b82f6; color: #ffffff;
            padding: 14px 32px; text-decoration: none; border-radius: 8px;
            font-weight: bold; font-size: 16px;">
    Je m'inscris maintenant
  </a>
</div>

<p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
  À très vite sur les sentiers !
</p>

<p style="color: #374151; font-size: 16px; line-height: 1.6;">
  L'équipe Overbound 🏃‍♂️
</p>
```

#### Contenu texte (optionnel mais recommandé)
Version texte brut pour les clients email qui n'affichent pas le HTML.

**Exemple** :
```
Nouveau Trail : Les Montagnes de l'Ubaye

Salut les Warriors !

Nous sommes ravis de vous annoncer notre prochain événement :
Trail des Montagnes de l'Ubaye, le 15 juin 2025.

OFFRE EARLY BIRD : -20% jusqu'au 31 mars !

Au programme :
- 3 parcours : 10km, 25km, et 50km
- Dénivelé : de 500m à 2500m
- Ravitaillements tous les 5km
- Douche chaude et repas à l'arrivée

👉 Inscris-toi maintenant : https://overbound-race.com/events/trail-ubaye-2025

À très vite sur les sentiers !
L'équipe Overbound
```

### Sélection des listes

Cochez une ou plusieurs listes de distribution :
- **Annonces d'événements** : Nouveaux événements et inscriptions
- **Alertes de prix** : Changements tarifaires et promotions
- **Actualités** : Blog et news Overbound
- **Bénévolat** : Opportunités de bénévolat
- **Offres partenaires** : Collaborations et partenariats

Le nombre total de destinataires est affiché en temps réel.

## Bonnes pratiques HTML pour emails

### 1. Utilisez des styles inline
```html
<!-- ✅ Bon -->
<p style="color: #374151; font-size: 16px;">Mon texte</p>

<!-- ❌ Mauvais -->
<p class="text-gray">Mon texte</p>
```

### 2. Utilisez des tableaux pour la mise en page complexe
```html
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding: 20px;">
      <p>Mon contenu</p>
    </td>
  </tr>
</table>
```

### 3. Couleurs recommandées (charte Overbound)
```css
/* Texte principal */
color: #111827;

/* Texte secondaire */
color: #374151;

/* Texte muted */
color: #6b7280;

/* Bleu primary */
color: #3b82f6;

/* Background */
background-color: #f3f4f6;
```

### 4. Tailles de police
```css
/* Titre principal */
font-size: 28px;

/* Titre secondaire */
font-size: 20px;

/* Texte normal */
font-size: 16px;

/* Petit texte */
font-size: 14px;
```

### 5. Boutons call-to-action
```html
<a href="https://overbound-race.com/events/mon-event"
   style="display: inline-block;
          background-color: #3b82f6;
          color: #ffffff;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;">
  Bouton d'action
</a>
```

### 6. Images
Les images doivent être hébergées en ligne (pas de chemins relatifs).

```html
<!-- ✅ Bon -->
<img src="https://overbound-race.com/images/banner.jpg"
     alt="Description"
     width="600"
     style="max-width: 100%; height: auto;" />

<!-- ❌ Mauvais -->
<img src="/images/banner.jpg" alt="Description" />
```

## Workflow recommandé

### 1. Préparation
- Définir l'objectif de l'email
- Choisir les listes cibles
- Préparer le contenu (texte + visuels)

### 2. Rédaction
- Écrire le sujet accrocheur
- Rédiger le pré-header
- Composer le HTML (voir exemples ci-dessus)
- Préparer la version texte

### 3. Test
- Cliquer sur **"Envoyer un test"**
- Vérifier l'email reçu :
  - Logo s'affiche correctement
  - Mise en page correcte
  - Liens fonctionnels
  - Lien de désinscription présent
  - Rendu sur mobile

### 4. Ajustements
- Corriger les problèmes trouvés
- Re-tester si nécessaire

### 5. Envoi de masse
- Vérifier le nombre de destinataires
- Cliquer sur **"Envoyer à X destinataires"**
- Confirmer l'envoi
- Attendre la confirmation

## Structure finale de l'email envoyé

Voici ce que reçoit le destinataire :

```
┌─────────────────────────────────────────────┐
│         [Logo Overbound]                    │  ← Automatique
├─────────────────────────────────────────────┤
│                                             │
│  Votre contenu HTML ici                     │  ← Votre composition
│  (titre, texte, boutons, images, etc.)     │
│                                             │
├─────────────────────────────────────────────┤
│ Vous recevez cet email car vous êtes       │
│ inscrit·e sur Overbound.                   │  ← Footer automatique
│                                             │
│ Se désinscrire (lien unique)               │  ← Lien automatique
│                                             │
│ Pour toute question: support@overbound-race.com  │
│                                             │
│ Conformément au RGPD...                    │
└─────────────────────────────────────────────┘
```

## Exemples de cas d'usage

### Annonce d'événement
**Listes** : Annonces d'événements
**Sujet** : Nouveau : Trail des Montagnes 2025
**Pré-header** : 3 parcours, inscriptions ouvertes !

### Alerte tarifaire
**Listes** : Alertes de prix
**Sujet** : ⚡ Dernier jour pour profiter du tarif early bird
**Pré-header** : Demain, les prix augmentent de 20%

### Offre partenaire
**Listes** : Offres partenaires
**Sujet** : 🎁 -30% sur les chaussures de trail Salomon
**Pré-header** : Offre exclusive réservée à la communauté Overbound

### Article de blog
**Listes** : Actualités
**Sujet** : 📖 Comment préparer un ultra-trail : guide complet
**Pré-header** : Nos meilleurs conseils pour réussir votre premier ultra

## Dépannage

### Le logo ne s'affiche pas
Le logo est automatiquement ajouté. Si vous ne le voyez pas dans le test :
1. Vérifiez que `NEXT_PUBLIC_SITE_URL` est configuré
2. Vérifiez que le fichier existe : `https://overbound-race.com/images/totem_logo.png`
3. Certains clients email bloquent les images par défaut

### Le lien de désinscription ne fonctionne pas
Le lien est unique par utilisateur. Dans un email de test :
1. Le lien pointe vers vos propres préférences
2. Testez en cliquant dessus
3. Vous devriez arriver sur `/preferences/[token]`

### L'email n'est pas envoyé
Vérifiez :
1. Au moins une liste est sélectionnée
2. Les listes ont des abonnés
3. Les logs dans la console pour erreurs
4. Les limites de rate Resend

### Mise en page cassée
Les emails HTML sont délicats :
1. Utilisez toujours des styles inline
2. Évitez les CSS modernes (flex, grid)
3. Utilisez des tableaux pour le layout
4. Testez sur plusieurs clients email

## Ressources

- [Guide HTML email (Campaign Monitor)](https://www.campaignmonitor.com/css/)
- [Can I Email (support CSS)](https://www.caniemail.com/)
- [Really Good Emails (inspiration)](https://reallygoodemails.com/)
- [Resend Documentation](https://resend.com/docs)

## Support

Pour toute question sur l'utilisation du compositeur :
- Consulter cette documentation
- Tester avec un envoi test
- Vérifier les logs dans la console
- Demander à l'équipe technique
