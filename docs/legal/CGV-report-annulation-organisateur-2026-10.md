---
title: "CGV Overbound — Report / annulation par l'organisateur (article 9, v2026-10-27)"
version: 0.1
author: "florian.plvd@gmail.com"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "Ajout 9.2.1-9.2.3 : remboursement 80 % en cas de report pour cause extérieure. A faire relire par un avocat avant publication."
---

Ceci n'est pas un conseil juridique. Consultez un avocat qualifié.

## Décisions du porteur du risque (2026-10-27)

- Report pour cause extérieure (force majeure, décision d'autorité, météo/sécurité) : report automatique, remboursement de 80 % du prix payé sur demande, 20 % retenus au titre de frais engagés non récupérables.
- Autre report, ou nouvelle date à plus de 12 mois : remboursement 100 %.
- Annulation sans nouvelle date : remboursement 100 % (inchangé, article 9.1).
- Transfert à 6,99 € maintenu aussi en cas de report (choix assumé, point exposé).
- Demande de remboursement : 15 jours après l'annonce, au plus tard la veille de la nouvelle date. Préavis de report possible jusqu'à J-1.

## Points de risque à faire valider

- La retenue de 20 % reste contestable (clause abusive, L212-1 ; clause pénale, art. 1231-5 Code civil). Les frais doivent être réels et justifiables.
- Facturer le transfert alors que le report vient de l'organisateur peut être jugé abusif.
- Les billets vendus avant cette version restent soumis à l'ancien article 9.2 (remboursement complet sur demande) : ne pas leur appliquer 80 %.
- Aucune assurance annulation : l'exposition financière réelle reste à couvrir.
- Aucune règle automatique en base : traitement manuel des demandes.

> **POUR UNE PROCHAINE IA : toute modification de fond de `src/app/cgv/page.tsx` impose de changer `CGV_VERSION` (`src/constants/legalVersions.ts`) dans le même commit. Ne jamais appliquer une clause plus récente à une commande portant une `cgv_version` antérieure. Voir CLAUDE.md, « CGV : versionnage obligatoire ».**

## Ajouts du 2026-10-27 (2e passe)

- 9.2 : droit de report énuméré (force majeure, autorité, météo/santé/sécurité, indisponibilité du site ou d'un prestataire essentiel), annonce par email au plus tard J-1 avec motif, nouvelle date et délais. Sans nouvelle date sous 90 jours, l'événement est réputé annulé (remboursement 100 %, art. 9.1).
- 9.2.3 : l'email d'annonce rappelle le délai de 15 jours (atténue le risque d'acceptation par silence). Remboursement billet par billet, versé à l'acheteur d'origine (packs B2B inclus), fin des avantages liés (points ambassadeur).
- 9.4 : recommandation de réservations modifiables (information, sans exclusion de responsabilité, qui serait abusive).

## Non traité, décision à prendre

- Preuve de la version des CGV : faite. `CGV_VERSION` (`src/constants/legalVersions.ts`) est figée dans les métadonnées du PaymentIntent à la création, puis copiée dans `orders.cgv_version` (webhook Stripe et `registrations/create`; commandes gratuites : version du serveur). Migration `20261027120000_orders_cgv_version.sql` écrite, NON appliquée : l'appliquer AVANT de déployer le code, sinon l'insert de commande échoue. Penser à changer `CGV_VERSION` à chaque modification de fond de la page CGV.
- Email d'annonce de report (Resend) : non rédigé. A produire selon `docs/guides/email-conventions.md` le jour où un report est décidé ; il doit mentionner motif, nouvelle date, délai de 15 jours et lien de demande.
- Assurance annulation événementielle : à souscrire.
- Relecture par un avocat : à faire avant publication (`legal_review` reste `false`).
