---
title: "Revue juridique : participation des mineurs de 16 et 17 ans (format OPEN)"
version: 0.1
author: "florian.plvd@gmail.com"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "Textes rédigés sans avocat, à relire avant d'ouvrir un événement aux mineurs. Voir FDR-0022."
---

> Ce document n'est pas un conseil juridique. Consultez un avocat.

## Textes modifiés ou ajoutés (à relire)

| Texte | Fichier | Changement |
|---|---|---|
| Décharge, clause 5 | `src/constants/waiver.ts` | renvoi à la clause 19 pour un mineur |
| Décharge, clause 6 | idem | 18 ans, exception 16 et 17 ans en OPEN quand l'événement est ouvert, jamais RANKED avant 18 ans |
| Décharge, clauses 18 à 21 (nouvelles) | idem | représentant légal et signataire, papiers au retrait, adulte référent et non-garde, secours, image, données, assurance |
| Notice « avant de signer » | `src/constants/participantNotice.ts` | section « Si le participant a 16 ou 17 ans », âge requis |
| Justificatif de santé mineur, procédure de secours | idem | `HEALTH_PROOF_MINOR_SENTENCE`, `MINOR_EMERGENCY_PROCEDURE` |
| CGV art. 4 et 11 | `src/app/cgv/page.tsx` | conditions d'âge, billet d'un mineur, participants de 16 et 17 ans, décharge signée par le représentant légal |
| CGU art. 5 (compte) | `src/app/cgu/page.tsx` | renvoi à l'article 4 des CGV |
| Politique de confidentialité, « mineurs » | `src/app/privacy-policies/page.tsx` | données du représentant légal et de l'adulte référent, durées |

## Questions pour l'avocat

1. **Capacité et signature.** Un mineur de 16 ou 17 ans peut-il acheter un billet ? La clause 18 fait attester à l'acheteur qu'il est le représentant légal ou agit avec son accord. Suffit-il de l'accord d'un seul parent (présomption de l'article 372-2 du Code civil) ? La signature électronique du porteur de la commande, plus l'autorisation papier signée par le représentant légal et le mineur au retrait du dossard, valent-elles autorisation parentale probante ?
2. **Renonciation à recours (clause 4) et acceptation des risques (clauses 1 et 2) pour un mineur.** Opposables à lui ? L'article 387-1 du Code civil soumet à l'autorisation du juge la renonciation à un droit au nom du mineur : la clause 18 (« accepte la présente décharge en son nom et pour le compte du mineur ») doit-elle exclure la clause 4 pour un mineur et ne garder que la reconnaissance des risques ?
3. **Non-garde (clause 20).** « Overbound n'assure ni garde ni surveillance de mineurs » : la formulation protège-t-elle sans exclure la responsabilité de l'organisateur pendant l'épreuve ? Un engagement de l'organisation est-il implicite quand elle accepte des mineurs ?
4. **Droit à l'image (clauses 14 et 21).** Autorisation donnée par le représentant légal pour 10 ans : elle dépasse la majorité du mineur. Faut-il une durée plus courte ou un droit d'opposition à la majorité ?
5. **Conservation.** Décision prise (2026-11-03) : la décharge et l'autorisation parentale d'un mineur sont conservées jusqu'à ses 28 ans, la prescription de l'action en réparation d'un dommage corporel (10 ans, article 2226) ne courant qu'à sa majorité (article 2235). La politique de confidentialité ne promet plus d'effacement sur simple demande pour ces pièces (exception de l'article 17.3.e du RGPD). À confirmer : durée suffisante quand la consolidation du dommage est tardive ?
6. **Santé.** L'attestation du questionnaire mineurs et le certificat médical en cas de réponse « oui » (clause 19, `HEALTH_PROOF_MINOR`) : est-ce la bonne règle pour une course à obstacles dont la FFA est délégataire ?
7. **Adulte référent.** Ses nom et téléphone sont collectés sans qu'il le sache. Quelle information lui donner (article 14 du RGPD) ? L'intérêt légitime de sécurité est-il la bonne base ?
8. **Assurance.** AXA (2026-11-03) : aucune exclusion d'âge, aucune condition imposée, mais pas de confirmation écrite d'une dispense de formalité. Les textes (clause 11, notice, CGV art. 12) reprennent le contrat : pratiquants tiers entre eux, garantie sous réserve de ses conditions. Faut-il faire confirmer par écrit l'absence de formalité avant d'ouvrir ? L'exclusion de la page 7 (non-respect des règles des fédérations délégataires) change-t-elle l'obligation de contrôler le justificatif de santé ?
9. **Secours (clauses 21 et règlement).** La procédure promet de prévenir « dès que possible » l'adulte référent puis le représentant légal (« sans délai » retiré le 2026-11-03) : engagement à tenir côté organisation (poste de secours, téléphone joignable).
10. **Cohérence.** Corrigé le 2026-11-03 : « Membre » dès 16 ans (CGU), règle des mineurs alignée dans les CGU, mention « édition 2026 » retirée, limitation des dommages indirects des CGU sans effet sur un dommage corporel ni sur les droits du consommateur (article R212-1 6° du Code de la consommation), validité du contrat AXA présentée avec sa tacite reconduction (CGV art. 12), durée de conservation des données des mineurs alignée sur la décharge.
11. **Obligation de sécurité.** Les CGU (« responsabilité engagée qu'en cas de faute prouvée ») et les CGV art. 12 traitent l'obligation de sécurité comme une obligation de moyens. Est-ce tenable pour les obstacles où le participant n'a pas de rôle actif (glissade, tyrolienne), et face à la responsabilité du fait des choses (article 1242) ?
12. **Format enfants.** `src/constants/raceFormats.ts` décrit un format « Tribal Kids » (6 à 14 ans) affiché par `/races/[id]`. Les CGV et la décharge refusent toute participation avant 16 ans : un événement enfants demanderait ses propres conditions.

## Règlement officiel (PDF)

Non modifié. Il doit reprendre : conditions d'âge et format OPEN, papiers au retrait du dossard, adulte référent, procédure
de secours (`MINOR_EMERGENCY_PROCEDURE`), absence de garde hors épreuve.
