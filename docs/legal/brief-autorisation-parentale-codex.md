---
title: "Brief de rédaction : autorisation parentale papier (participant de 16 ou 17 ans)"
version: 0.1
author: "florian.plvd@gmail.com"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "Brief pour un agent qui crée le document dans Google Docs. Le document produit n'est pas relu par un avocat."
---

> Ce document n'est pas un conseil juridique. Consultez un avocat.

# Mission

Créer dans Google Docs (MCP Google Docs) le modèle imprimable de l'**autorisation parentale** remise au retrait du dossard pour tout participant de 16 ou 17 ans le jour de l'événement. Livrer : le Google Doc modifiable, son export PDF, et le lien du Doc. Ne pas partager le Doc publiquement. Ne modifier aucun fichier du dépôt.

Ce papier est celui que la clause 19 de la décharge appelle « l'autorisation parentale, sur le modèle fourni par Overbound, signée par le représentant légal et par le mineur ». Il n'existe pas encore.

# Contexte à lire avant d'écrire (dépôt `Overbound`, branche `feat/mineurs-16-17-open`)

Lire dans cet ordre, ce sont les sources de vérité. Ne rien inventer qui les contredise.

1. `docs/fdr/FDR-0022-minors-16-17-open-format.md` : toutes les décisions (qui, quel format, retrait du dossard, données, assurance).
2. `src/constants/waiver.ts` : clauses 1, 4, 5, 6, 11, 14, 18, 19, 20, 21 de la décharge (le papier doit rester cohérent avec elles).
3. `src/constants/participantNotice.ts` : `HEALTH_PROOF_MINOR_SENTENCE`, `MINOR_EMERGENCY_PROCEDURE`, `minorAttestationLabel`, `PARTICIPANTS_ARE_THIRD_PARTIES`. **Reprendre ces phrases mot pour mot** quand le papier en a besoin : une seule source par donnée.
4. `rulebook/overbound-reglement-officiel.md`, sections « Âge » et « Participant de 16 ou 17 ans ».
5. `src/components/admin/MinorPapersDialog.tsx` et `src/lib/checkin/minorPapers.ts` : le bénévole coche quatre contrôles. Le papier doit permettre chacun d'eux.
6. `docs/legal/2026-11-mineurs-16-17-review.md` : questions ouvertes pour l'avocat (le papier les rend visibles, il ne les tranche pas).
7. `docs/guides/legal.md` : règles de rédaction juridique du projet.

# Faits arrêtés (ne pas remettre en cause)

- Organisateur unique : **Palvadeau Organisation**, SASU, RCS Versailles 992 578 229, 105 rue de la brèche du houx, 78760 Jouars-Pontchartrain, représentée par Florian Palvadeau, Président. Nom commercial : Overbound. Contact : contact@overbound-race.com. L'association Overbound Race n'existe plus : ne jamais la citer.
- Événement : édition du **24 avril 2027**. Lieu : ne pas l'écrire en dur, laisser un champ à compléter `[lieu de l'événement]` et me le signaler.
- Mineur admis : 16 ou 17 ans le jour de l'événement, **format OPEN uniquement**, jamais RANKED. Jamais avant 16 ans.
- **Aucune renonciation à recours au nom du mineur** (article 387-1 du Code civil). Le papier ne contient ni « je renonce », ni « je décharge Overbound de toute responsabilité ». Le représentant légal reconnaît seulement avoir été informé des risques et des règles de sécurité.
- Le papier est signé **par le représentant légal et par le mineur**, à la main, au retrait du dossard.
- Au retrait, l'organisation contrôle : autorisation signée, pièce d'identité du mineur, adulte référent présent et joignable, attestation de santé pour mineurs. Sans l'un d'eux, départ refusé et billet non remboursé.
- Overbound n'assure ni garde ni surveillance de mineurs hors épreuve (village, parking, attente, trajets). Cela ne remet pas en cause ses obligations de sécurité pendant l'épreuve.
- Secours : reprendre `MINOR_EMERGENCY_PROCEDURE`. Écrire « dès que possible », jamais « sans délai ».
- Assurance : ne **jamais** affirmer que l'assurance couvre le mineur. AXA ne l'a pas confirmé par écrit. Dire seulement ce que dit la clause 11 (reprendre sa substance) et recommander une assurance individuelle accident.
- Données : coordonnées du représentant légal et de l'adulte référent effacées 30 jours après l'événement. Le papier signé est scanné et conservé avec la décharge **jusqu'aux 28 ans du participant**, puis détruit. L'attestation de santé n'est jamais enregistrée : seuls la date du contrôle et l'identité du bénévole le sont.
- Image : le représentant légal donne, pour le mineur, l'autorisation de la clause 14 (gratuite, tout support, 10 ans, opposition possible par email à contact@overbound-race.com).

# Contenu attendu du document

Une seule feuille A4 recto verso au maximum, imprimable en noir et blanc, lisible une fois scannée.

1. **En-tête** : « Autorisation parentale » ; sous-titre « Participant de 16 ou 17 ans, format OPEN » ; Overbound, 24 avril 2027, lieu à compléter ; organisateur Palvadeau Organisation.
2. **Rappel en trois lignes** : à remettre signée au retrait du dossard avec la pièce d'identité du mineur et l'attestation de santé pour mineurs ; sans cela le départ est refusé.
3. **Le participant mineur** : nom, prénom, date de naissance, email du compte Overbound (pour retrouver l'inscription), format OPEN coché.
4. **Le représentant légal** : nom, prénom, qualité (père, mère, tuteur), téléphone, email. Case : « J'agis avec l'accord de l'autre titulaire de l'autorité parentale, s'il y en a un » (proposition, à signaler à l'avocat, question 1 de la revue).
5. **L'adulte référent** : nom, prénom, téléphone, lien avec le mineur ; case « c'est le représentant légal ». Rappeler : majeur, présent sur le site, joignable pendant toute la participation.
6. **Déclarations** (cases à cocher ou paragraphes courts, une idée par ligne) :
   - j'autorise la participation du mineur au seul format OPEN ;
   - j'ai pris connaissance de la décharge (clauses 1 et 18 à 21) et du règlement officiel, je les ai expliqués au mineur ;
   - j'ai été informé des risques de la clause 1 sans renoncer à aucun droit du mineur ;
   - j'autorise les premiers secours, tout traitement médical d'urgence et toute hospitalisation jugés nécessaires par les secours ;
   - j'ai pris connaissance de la procédure de secours (texte exact de `MINOR_EMERGENCY_PROCEDURE`) ;
   - je donne l'autorisation d'image de la clause 14 pour le mineur ;
   - je suis informé de la clause 11 sur l'assurance et de l'intérêt d'une assurance individuelle accident ; j'ai vérifié les garanties dont le mineur bénéficie déjà ;
   - je garantis l'exactitude des coordonnées et leur joignabilité pendant tout l'événement.
7. **Santé** : rappeler le justificatif exigé pour un mineur, via `HEALTH_PROOF_MINOR_SENTENCE` (attestation du questionnaire de santé FFA pour mineurs, ou licence FFA ; certificat médical de moins de six mois si une réponse est « oui »). Préciser qu'il est montré, jamais conservé.
8. **Données personnelles** : finalités (inscription, contrôle des papiers, prévenir en cas d'incident), durées ci-dessus, droits et contact (contact@overbound-race.com), renvoi à la politique de confidentialité d'Overbound.
9. **Signatures** : lieu, date, signature du représentant légal précédée de « Lu et approuvé », signature du mineur. Prévoir de la place. Pas de zone de signature électronique.
10. **Cadre réservé à l'organisation** (en bas, séparé) : les quatre contrôles du bénévole à cocher (autorisation signée par les deux, pièce d'identité conforme, adulte référent identifié et joignable, attestation de santé vue), nom du bénévole, heure. Ce cadre reprend exactement les libellés de `MinorPapersDialog.tsx`.
11. **Pied de page** : « Version 2026-11-a » (valeur de `REGULATION_VERSION`), mention « Modèle non relu par un avocat » retirée seulement après revue, et la phrase « Ceci n'est pas un conseil juridique. Consultez un avocat. » dans la version de travail, hors page imprimée si la place manque.

# Style et mise en page

- Français. Déclarations à la première personne (« Je soussigné(e) »), ton clair et sobre, phrases de 20 mots au plus. Pas de jargon juridique inutile.
- **Jamais de tiret demi-cadratin (U+2013)**, et pas de tiret cadratin non plus. Plages : « 16 à 17 ans ». Incises : virgule ou deux-points. Un test du dépôt échoue sinon.
- Typographie française : espace insécable avant `:` `;` `?` `!`, guillemets « ».
- Noir sur blanc, police sans empattement (Arial ou Helvetica), 10 à 11 pt, champs à remplir avec lignes de 0,7 cm minimum, aucune image de fond. Logo Overbound optionnel, en noir et blanc, jamais bloquant.
- Titres de section courts, numérotés. Cases à cocher avec le caractère ☐.
- Pas de données personnelles réelles dans le modèle.

# Ce qui est hors périmètre

- Modifier le dépôt, la décharge, les CGV ou le règlement.
- L'email d'envoi du modèle au représentant légal, le choix de l'adresse d'expédition.
- Tribal Kids et tout participant de moins de 16 ans, les mineurs en B2B.

# Rendu attendu

Dans votre message final : le lien du Google Doc, le chemin du PDF exporté, la liste des phrases reprises mot pour mot des constantes (avec leur fichier), la liste des points où vous avez dû décider seul, et tout conflit détecté entre ce brief et le code. Ne pas déclarer le document « validé juridiquement ».
