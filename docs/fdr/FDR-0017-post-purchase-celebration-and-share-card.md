# FDR-0017 - Célébration post-achat et carte de partage

- Statut: Proposed
- Date: 2026-10-11
- Owner produit: Florian Palvadeau
- Référence(s): [FDR-0015](./FDR-0015-homepage-evergreen-and-conversion-funnel.md) (funnel avant achat, ce FDR couvre l'après-achat), [FDR-0006](./FDR-0006-ambassador-program-points-and-rewards.md) (parrainage, hors V1)

## Besoin métier

Après paiement confirmé, l'utilisateur voit une alerte avec une icône pendant 1,2 s, puis une redirection
vers `/account/tickets`. Le moment d'achat est le pic d'enthousiasme : aucune célébration, aucun levier
de partage. La commande gratuite redirige sans aucun écran. La page `events/[id]/success` existe
(détails, tracking `purchase`) mais aucun flux n'y mène.

## Décision fonctionnelle

1. Les deux flux (paiement Stripe, commande gratuite) redirigent vers
   `/events/{slug}/success?registration_id={id}` au lieu de `/account/tickets`.
2. La page succès affiche une célébration : confettis et flammes, puis une carte « à collectionner »
   qui se retourne. Sous la carte : actions de partage.
3. La carte est une image 1080x1920 (format story) générée côté serveur, réservée au propriétaire de
   l'inscription.
4. Partage : `navigator.share({ files })` en bouton principal (feuille native : Instagram Stories,
   Snapchat, etc.), repli « Télécharger la carte ». Liens URL : WhatsApp, X, Reddit, Facebook, copier le lien.
   Instagram et Snapchat n'ont pas d'URL web de publication de story : pas de lien dédié.
5. Le lien partagé pointe vers la page publique de l'événement, avec UTM `share`.

## Règles métier

- La carte n'affiche jamais : QR code, token, numéro de dossard, nombre total d'inscrits, rang d'inscription.
  Une story publique avec un QR lisible rend le billet copiable.
- Le prénom est affiché par défaut, désactivable avant partage (donnée personnelle rendue publique
  par choix de l'utilisateur). Source V1 : premier mot de `profiles.full_name` de l'acheteur.
- Format affiché lu depuis `registrations.race_format`, jamais déduit d'un nom de billet.
- `prefers-reduced-motion` : pas de confettis, carte révélée directement.
- Le Lucky Wheel n'est pas affiché sur cette route (allowlist de `placement.ts`, inchangé).

## Critères d'acceptation

- Après paiement Stripe et après commande gratuite : arrivée sur la page succès, inscription affichée.
- La carte ne se génère que pour le propriétaire (401/403 sinon).
- `name=0` retire le prénom de l'image.
- Le tracking `purchase` existant continue de ne partir qu'une fois.
- Tests purs : construction des liens et du texte de partage, extraction du prénom.

## Impacts UX / data

Aucune migration. Aucune dépendance nouvelle (`canvas-confetti` et `next/og` déjà présents).
`/account/tickets` reste accessible depuis le bouton « Voir mon billet ».

## Risques et mitigations

- `navigator.share` avec fichiers absent sur desktop et anciens navigateurs : repli téléchargement.
- Génération d'image à chaque affichage : réponse `Cache-Control: private, max-age=300`.
- Webhook Stripe pas encore passé quand la page charge : l'inscription est créée par
  `/api/registrations/create` avant la redirection ; la page garde le bouton « Réessayer ».

## Questions ouvertes

- Lien de parrainage dans le lien partagé (code ambassadeur ou code généré par acheteur) : à décider,
  touche FDR-0006. Hors V1.
- Prénom du participant plutôt que de l'acheteur pour les achats multi-participants.
