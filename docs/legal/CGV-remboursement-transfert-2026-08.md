---
title: "CGV Overbound — Politique remboursement / transfert de dossard (v2026-08)"
version: 0.1
author: "florian.plvd@gmail.com"
legal_review: true
reviewed_by: "florian.plvd@gmail.com"
review_date: "2026-08-13"
notes: "Refonte des sections 8, 9, 10 de src/app/cgv/page.tsx (transfert de dossard + annulation participant/organisateur). Introduit une fenêtre de remboursement discrétionnaire J-30 qui n'existait pas dans la version précédente."
---

## Contexte

Modification non commitée de `src/app/cgv/page.tsx` (sections 8, 9, 10) : réécriture de la politique de transfert de dossard et d'annulation. Changement le plus significatif : introduction d'une fenêtre "jusqu'à J-30, remboursement possible à titre commercial" qui n'existait pas dans la version précédente de la CGV (ancienne version : uniquement "étudié au cas par cas" pour raisons médicales, aucune mention de délai en jours).

Fichier concerné : [src/app/cgv/page.tsx](../../src/app/cgv/page.tsx#L227-L324)

## Base légale invoquée

- Les billets pour événements sportifs datés sont exclus du droit de rétractation classique de 14 jours (article L221-28 12° du Code de la consommation).
- Confirmé par :
  - DGCCRF — [Revente de billets de spectacles ou de compétitions sportives](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/revente-de-billets-de-spectacles-ou-de-competitions-sportives)
  - Service-public.fr — [Exceptions au droit de rétractation](https://entreprendre.service-public.gouv.fr/vosdroits/F23455)
- Conséquence : Overbound peut légalement exclure le remboursement/échange par CGV, à condition que la règle soit claire **avant achat** et cohérente entre CGV, FAQ et emails transactionnels.

## Politique retenue (résumé)

| Délai avant l'événement | Remboursement | Transfert de dossard |
|---|---|---|
| Jusqu'à J-30 | Possible, étudié à titre commercial (hors frais bancaires/plateforme irréversibles) | — |
| J-30 à J-7 | Non dû | Autorisé gratuitement |
| Après J-7 | Non dû | Non garanti, exceptionnel uniquement |
| Annulation par l'organisateur | Remboursement selon modalités communiquées (14 jours ouvrés max) | — |
| Cas exceptionnels dûment justifiés (blessure grave, pathologie, grossesse, décès d'un proche, mobilisation autorité) | Étudiés au cas par cas, **sans droit automatique** — réponse possible : refus, report, avoir, remboursement partiel/total | — |

## Écart identifié avec la recommandation externe (Codex, 2026-08-13)

Codex recommandait de **ne pas lister nommément** les cas exceptionnels (blessure, grossesse, décès...) pour éviter que chaque contrainte personnelle devienne un point d'appui revendiqué ("je suis dans le cas listé, donc j'ai un droit"), et suggérait une formulation volontairement plus générique : *"Les situations exceptionnelles dûment justifiées peuvent être étudiées au cas par cas [...], sans que cela crée un droit automatique au remboursement."*

La version actuelle de la CGV liste explicitement ces cas (plus transparente pour l'utilisateur, mais legèrement plus exposée si un cas non listé mais similaire est refusé — argument d'iniquité de traitement possible). **Décision à trancher par le porteur du risque légal avant publication** : garder la liste explicite ou repasser à une formulation générique.

## Cohérence à vérifier avant mise en ligne

Le principe DGCCRF impose que la règle soit visible **avant achat**, pas seulement dans la CGV. À vérifier/aligner :

- [ ] CGV (`src/app/cgv/page.tsx`) — fait, en attente de revue
- [ ] FAQ publique (`src/datas/faqFallback.ts`, `src/sanity/seed/faq-questions.ndjson` — déjà modifiés dans cette session, à vérifier que le contenu correspond à la même politique J-30/J-7)
- [ ] Emails transactionnels de confirmation d'inscription (rappel du délai de transfert/remboursement)
- [ ] Étape de checkout / `ConfirmationStep.tsx` (déjà modifié dans cette session — vérifier cohérence)
- [ ] Aucune règle codée automatiquement pour le remboursement J-30 aujourd'hui (contrairement au transfert J-7, voir `src/lib/tickets/transferPolicy.ts`) — la fenêtre de remboursement reste 100% manuelle/discrétionnaire côté support. À date, rien n'empêche un participant de demander un remboursement après J-30 ; la CGV sert de base pour refuser, mais aucun système ne bloque ou n'alerte automatiquement.

## Checklist avant publication (voir docs/guides/legal.md §7)

- [x] Base légale jugée suffisante par le porteur du risque (DGCCRF + Service-public citées ci-dessus) — pas de revue externe jugée nécessaire
- [x] Décision sur l'écart "liste explicite vs formulation générique" : liste explicite conservée telle quelle (choix assumé)
- [x] Validation par le porteur du risque légal : Florian, 2026-08-13
- [ ] Reste à couvrir avant que la clause soit fiable en pratique (opérationnel, pas légal) :
  - [ ] Process support pour traiter les demandes J-30 de façon cohérente d'un cas à l'autre
  - [ ] Cohérence FAQ / emails transactionnels / checkout avec cette politique (voir section précédente)
