---
title: "Transfert de dossard, décharge v2026-10, CGV/CGU/confidentialité — revue préparatoire"
version: 0.1
author: "florian.plvd@gmail.com"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "Rédigé par un agent IA jouant le rôle de conseil, sans avocat. Mis en ligne sur décision explicite du porteur du risque (Florian, 2026-10-09), revue par un avocat à faire a posteriori."
---

> Ce document n'est pas un conseil juridique. Il a été rédigé sans avocat. Consultez un avocat.

## Décision de publication

Florian (porteur du risque légal) a demandé le 2026-10-09 la mise en ligne immédiate des textes ci-dessous,
sans revue d'avocat préalable, avec une revue a posteriori. `legal_review` reste `false` tant que cette revue
n'a pas eu lieu.

## Problème traité

Un dossard acheté et signé par A peut être transféré à B. Avant ce changement, B courait sous la signature de A :
aucune décharge, aucune acceptation du règlement, aucune identité propre. En droit, le transfert est une cession
de contrat (art. 1216 C. civ.), qui doit être constatée par écrit à peine de nullité.

## Ce qui a changé

| Sujet | Texte / code | Fondement |
|---|---|---|
| Le bénéficiaire renseigne son identité et signe sa propre décharge | `ClaimTicketForm`, `api/account/tickets/claim` | art. 1216 C. civ. (écrit), preuve de l'information sur les risques |
| Nouveau QR code à la récupération ; l'ancien est désactivé | `buildHandOverUpdate` | fraude au check-in |
| Empreinte SHA-256 du texte exact signé, à l'achat et au transfert | `src/constants/waiver.ts`, `src/lib/legal/waiverDocument.ts` | art. 1366 C. civ. (intégrité de l'écrit électronique) |
| Email au bénéficiaire avec copie de la décharge signée ; email à l'ancien titulaire | `TicketTransferEmail.tsx` | support durable, date certaine de la cession |
| Case de renonciation au droit de rétractation avant paiement des frais de transfert, tracée dans les métadonnées Stripe | `TransferConsentDialog`, `startTransferCheckout` | art. L221-28 1° C. conso |
| Consentement explicite séparé pour les informations de santé ; sinon elles ne sont pas enregistrées | `ParticipantForm`, `ClaimTicketForm`, `keepHealthDataWithConsent` | art. 9(2)(a) RGPD |
| Effacement des infos de santé et du contact d'urgence de l'ancien titulaire au transfert, et de tous 30 jours après l'événement | `redactFormerHolderWaiver`, cron `safety-data-purge` | minimisation, art. 5(1)(c) et (e) RGPD |
| Décharge v2026-10 : suppression de la renonciation à « tout recours », exclusion de la faute d'Overbound, image limitée à 10 ans, clauses assurance, identité, transfert | `src/constants/waiver.ts` | R212-1 6° C. conso (clause noire), Cass. 1re civ. 28 janv. 2026 n° 24-20.866 |
| CGV art. 8 : cession, frais de 6,99 €, revente interdite, remboursement à l'acheteur d'origine | `src/app/cgv/page.tsx` | art. 1216 et 1216-1 C. civ., art. 313-6-2 C. pén., information sur le prix |
| CGV art. 9 : remboursement si Overbound annule (remplace « aucun remboursement ») | idem | R212-1 C. conso, art. 1218 et 1229 C. civ. |
| CGV art. 12 : plus de plafond de responsabilité pour les dommages corporels ; information détaillée sur les assurances | idem | R212-1 6° C. conso, art. L321-1 C. sport, Cass. 2026 |
| CGV art. 4 et 11 : majorité alignée, commande multi-participants, contrôle d'identité, justificatif de santé | idem | — |
| Politique de confidentialité : données de sécurité, preuve de signature, transfert, durées | `src/app/privacy-policies/page.tsx` | art. 13 RGPD, art. 2226 C. civ. (prescription 10 ans) |
| FAQ, CGU, page événement : « transfert gratuit » corrigé | `faqFallback.ts`, seed Sanity, `cgu/page.tsx`, `EventInfoSections.tsx` | cohérence de l'information précontractuelle |

## Points ouverts pour l'avocat

1. **Commandes de groupe** (décidé le 2026-10-09, modèle Spartan) : une seule signature par commande ; l'acheteur
   coche une attestation et se porte fort de l'acceptation des autres participants (art. 1204 C. civ.) ; chaque
   participant reçoit un lien vers la décharge avec son billet. Limite : un participant non signataire n'est pas
   personnellement lié par la décharge (effet relatif, art. 1199 C. civ.) ; la protection repose sur la preuve
   qu'il a été informé et sur le recours contre l'acheteur.
2. **Assurance** (complété le 2026-10-09 avec l'attestation AXA) : contrat, plafonds et validité publiés en CGV
   art. 12. Reste à confirmer par écrit avec AXA : RC des participants entre eux (L321-1), bénéficiaires d'un
   transfert, renouvellement après le 01/01/2027.
3. **PPS / certificat médical** : la FFA est délégataire pour la course à obstacles. L'obligation de PPS dépend du
   régime de la manifestation (compétition avec classement, déclaration ou autorisation). Exigence à décider et à
   indiquer dans le règlement.
4. **Règlement officiel (PDF)** : non modifié ; il doit reprendre le transfert, le contrôle d'identité et le PPS.
5. **Politique de confidentialité et CGU** (corrigé le 2026-10-09) : les mentions inexactes ont été retirées (DPO
   « Cabinet LexData », adresse à Paris, audit annuel, bug bounty, MFA, sauvegardes quotidiennes). Raison sociale
   corrigée : Palvadeau Organisation, marque Overbound. Recommandation : activer la double authentification
   (TOTP Supabase) sur les comptes administrateurs.
6. **Signature électronique** : signature simple (dessin + cases + compte authentifié + IP + empreinte du texte).
   Pas de prestataire de signature avancée (Yousign) à ce stade : coût et friction jugés disproportionnés au risque
   de contestation de l'identité du signataire.

## Suite

Les règles décidées sont consolidées dans [reglement-sources.md](./reglement-sources.md), qui sert de base à la
réécriture du règlement officiel (PDF).
