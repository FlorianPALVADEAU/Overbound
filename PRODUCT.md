# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Participants** : grand public qui découvre, s'inscrit et paie pour une course à obstacles (tunnel multi-étapes, paiement Stripe).
- **Acheteurs entreprise / groupes** : packs entreprise avec captain + membres, ancrage de vague pour démarrer ensemble.
- **Ambassadeurs** : participants qui recrutent via code promo/lien de parrainage, suivent leurs points et récompenses sur un dashboard dédié.
- **Admin et bénévoles** : équipe interne qui gère événements, inscriptions, groupes, ambassadeurs, emails RGPD depuis le back-office, et bénévoles qui font le check-in des dossards le jour J.

## Product Purpose

Overbound organise des courses à obstacles (OCR) événementielles. Le site couvre tout le cycle : découverte de l'événement, inscription et paiement, gestion de groupe, programme ambassadeur, blog, bootcamps, bénévolat, et opérations le jour J (check-in). Succès = inscriptions complétées sans friction, vagues de départ bien gérées, jour J sans incident opérationnel.

## Positioning

Overbound est une course à obstacles organisée en **boucle** (environ 2 km, répétée plusieurs tours) — un format qui n'existe pas encore ailleurs sur ce marché. Sur cette même boucle coexistent deux formats :

- **OPEN** : le participant choisit librement son SAS de départ (vagues toutes les 10 minutes, 12h00 à 15h50), sans limite de temps au tour, pénalité de 10 burpees par obstacle raté.
- **RANKED** : départ unique compétitif à 8h00, pénalité de 30 burpees par obstacle raté, chronos de tour stricts.

La boucle est le mécanisme différenciant ; OPEN/RANKED est la manière dont deux publics (grand public flexible vs compétiteurs) cohabitent sur le même parcours.

## Operating Context

- Deux éditions à ce jour : 1re édition le 12 septembre 2026, 2e édition le 24 avril 2027.
- Inscription multi-étapes avec signature électronique / décharge de responsabilité (sport à risque), paiement Stripe.
- Groupes entreprise avec ancrage de vague (synchronisation des membres OPEN sur une même vague).
- Programme ambassadeur à points (saison continue, paliers en base, dossard bonus).
- Système d'emails RGPD à 4 phases (désinscription, listes de diffusion, préférences granulaires, interface admin). Transactionnel via Resend, marketing via Amazon SES.
- Jour J : check-in bénévoles par QR code / dossard.
- Back-office admin complet : événements, billetterie, groupes, ambassadeurs, communication, utilisateurs.

## Capabilities and Constraints

- Next.js App Router, TypeScript strict, Supabase (auth/DB/RLS/storage).
- Pas de module CRM partenariats fonctionnel — seulement une page marketing statique de logos sponsors.
- Format detection (OPEN vs RANKED) toujours via `isOpenFormatTicket`/détection de nom, jamais par ID de ticket codé en dur.
- Pas de `any` en TypeScript, Zod aux frontières d'entrée API (en cours de généralisation, voir FDR-0009).
- CGV versionnées : toute modification de fond exige un changement de `CGV_VERSION` dans le même commit.
- Pas de tiret demi-cadratin (U+2013) dans aucun texte produit (site, emails, docs).

## Brand Commitments

- Nom de marque : **Overbound** (sans accent). Organisateur légal : SASU Palvadeau Organisation (l'association Overbound Race n'est plus utilisée, fermeture prévue).
- Contact : contact@overbound-race.com.
- Identité visuelle existante et documentée : voir DESIGN.md / `docs/design/design-system.md` (tokens dans `src/app/globals.css`, primitives dans `src/components/ds/`). Fond sombre par défaut (#141414), vert `primary` comme seule couleur d'action, rouge `signal` réservé au CTA d'inscription du header.

## Evidence on Hand

- Photothèque réelle : `public/images/images/` (photos d'obstacles, d'équipe), `public/images/obstacles/`.
- Documentation produit et technique déjà très étoffée sous `docs/` (FDR, ADR, guides) — source de vérité à consulter avant toute décision structurante, notamment `docs/fdr/FDR-0015-homepage-evergreen-and-conversion-funnel.md` pour l'accueil/funnel/responsive.
- Pas de case study ni témoignage sourcé de manière fiable à ce jour pour les chiffres de preuve sociale (voir point ouvert dans FDR-0015 §4 sur le "50+ avis positifs").

## Product Principles

1. Le mécanisme de boucle est le cœur du positionnement : toute communication doit pouvoir l'expliquer visuellement avant de détailler OPEN/RANKED.
2. OPEN et RANKED sont deux manières d'habiter la même boucle, jamais deux produits séparés — ne jamais les présenter comme concurrents ou hiérarchisés.
3. Le jour J ne doit jamais être mis en danger par une fonctionnalité web : fiabilité opérationnelle (wave assignment, check-in, paiement) prime sur la nouveauté visuelle.
4. Conformité RGPD et clarté légale (CGV, décharge de responsabilité) sont non négociables, même quand elles ajoutent de la friction au tunnel.
5. L'accueil et la page événement doivent rester evergreen : changer d'édition est un changement de données, jamais de code (FDR-0015).

## Accessibility & Inclusion

Aucune exigence spécifique confirmée par l'utilisateur à ce jour au-delà des standards déjà couverts par le design system (contrat responsive mobile-first 320px à 3840px, cibles tactiles 44px, `prefers-reduced-motion`, voir `docs/design/design-system.md`).
