# Vision Produit

## Contexte

Overbound est un événement de course à obstacles prévu le **12 septembre 2026**
(Île de loisirs de Saint-Quentin-en-Yvelines). Le produit est le **site événementiel
public complet** qui porte l'acquisition et l'opération de cet événement : catalogue
d'événements/courses, inscription multi-étapes avec paiement Stripe, gestion de
groupes entreprise avec ancrage de vague, programme ambassadeur, back-office admin,
check-in bénévoles le jour J, système d'emails RGPD à 4 phases, blog, bootcamps,
volontariat.

Il n'y a pas de module CRM partenariats fonctionnel dans le code — ce document a
longtemps décrit une cible produit ("CRM léger pour piloter les partenariats") qui
n'a jamais été implémentée. Voir [ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md)
pour l'historique de cet écart. Le présent document reflète désormais le produit réel.

## Problèmes à résoudre

- Vendre des dossards pour un événement daté avec une charge de trafic concentrée
  avant la date limite d'inscription et le jour de l'événement.
- Répartir des milliers de participants OPEN sur des créneaux de départ échelonnés
  sans créer de congestion sur le site.
- Permettre à des groupes (entreprises, clubs, familles) de s'inscrire et de
  démarrer ensemble.
- Faire grandir l'acquisition via un programme de parrainage (ambassadeurs) plutôt
  que par la seule publicité payante.
- Communiquer par email en conformité RGPD (consentement, désinscription,
  préférences) sans dépendre d'un outil marketing tiers non intégré.
- Donner aux bénévoles un outil de check-in fiable le jour J.

## Domaines fonctionnels

- **Catalogue d'événements/courses** : présentation publique des courses, tickets,
  tarifs par palier (tiers), codes promo.
- **Inscription & paiement** : tunnel multi-étapes (participants, billets, upsells,
  code promo, paiement Stripe), génération de billet, emails de confirmation.
- **Wave Assignment** : répartition des formats OPEN sur 24 vagues échelonnées vs
  départ unique pour le format RANKED. Voir [FDR-0004](../fdr/FDR-0004-wave-assignment-open-vs-ranked.md).
- **Groupes entreprise** : packs captain + membres avec ancrage de vague pour
  démarrer ensemble. Voir [FDR-0005](../fdr/FDR-0005-group-membership-and-wave-anchoring.md).
- **Programme ambassadeur** : points par filleul inscrit, paliers de récompense,
  billets bonus. Voir [FDR-0006](../fdr/FDR-0006-ambassador-program-points-and-rewards.md).
- **Emails RGPD** : désabonnement, listes de diffusion, préférences granulaires,
  interface d'envoi admin. Voir [FDR-0007](../fdr/FDR-0007-email-distribution-and-preferences.md).
- **Back-office admin** : gestion des inscriptions, événements, groupes,
  ambassadeurs, codes promo, distribution lists.
- **Check-in bénévoles** : scan des billets le jour J, workflow d'approbation
  (claim_status / approval_status / checked_in).
- **Contenus** : blog, bootcamps, pages de volontariat.

## Hors périmètre

- CRM partenariats structuré (pipeline, relances, fiches partenaires) — seule une
  page marketing statique de logos sponsors existe (`src/datas/Partners.ts`).
- Automations marketing avancées multi-campagnes au-delà des 4 phases email.
- Scoring ou BI avancés.

## Acteurs

- Participants publics (inscription individuelle ou en groupe).
- Ambassadeurs (programme de parrainage).
- Bénévoles (check-in jour J).
- Administrateurs (back-office : événements, inscriptions, emails, promo codes).

## Références

- [CLAUDE.md](../../CLAUDE.md) — vue d'ensemble produit et technique à jour.
- [ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md) — écart
  architecture réelle vs théorique.
- [docs/fdr/README.md](../fdr/README.md) — décisions fonctionnelles structurantes
  par domaine.
- [docs/roadmap/mvp-plan.md](../roadmap/mvp-plan.md) — roadmap (à vérifier/mettre à
  jour séparément, décrit encore la cible CRM).
