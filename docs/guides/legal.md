# Légal / Juridique — Guide pour les agents

Objectif : fournir des règles claires et des modèles minimaux pour rédiger des textes sensibles (disclaimers, clauses, communications légales), et indiquer les obligations de revue avant publication.

1) Principe général
- Toujours ajouter une mention explicite : « Ceci n'est pas un conseil juridique. Consultez un avocat. » quand vous rédigez ou reformulez un texte contractuel, fiscal, médical, ou toute information ayant des conséquences légales.
- Ne pas prétendre être un avocat ou fournir des recommandations contraignantes.

2) Quand déclencher une revue juridique
- Drafts impliquant contrats, conditions générales, politiques de confidentialité, transferts de responsabilité, ou obligations réglementaires.
- Modifications d'opérations critiques (scripts SQL qui modifient l'état d'un enregistrement, transferts de données entre organisations).
- Communications publiques qui contiennent garanties, promesses ou conditions d'offre commerciale.

3) Clauses et formulations obligatoires (usage recommandé)
- Disclaimer standard : « Les informations fournies ici sont à titre informatif uniquement et ne constituent pas un conseil juridique. Pour toute décision, consultez un avocat qualifié dans la juridiction concernée. »
- Clause de juridiction (si applicable) : préciser la loi applicable et le for compétent si le texte contractuel le requiert.
- Limitation de responsabilité : ne jamais supprimer une clause limitant la responsabilité sans validation légale.
- Protection des données : inclure une phrase rappelant le respect du RGPD/lois locales lorsque des données personnelles sont traitées.

4) Protection des données et confidentialité
- Ne pas inclure dans les drafts d'exemples des données personnelles réelles (PII). Utiliser des données fictives/masquées.
- Indiquer les obligations de conservation, droit d'accès/suppression (DSAR), et pointer vers la politique de confidentialité formelle.
- Pour les envois d'email marketing, respecter les opt-outs/unsubscribe et la conformité locale (CAN-SPAM, RGPD ePrivacy).

5) Contenu sensible (santé, finance, fiscalité)
- Pour tout contenu médical, financier ou fiscal : afficher disclaimer renforcé et orienter systématiquement vers un professionnel (médecin, comptable, avocat).
- Ne pas fournir d'instructions pratiques permettant un dommage (ex. traitements médicaux, contournement réglementaire).

6) Propriété intellectuelle
- Vérifier les sources : si un texte reprend une clause d'un tiers (modèle, loi, contrat), citer la source et s'assurer des droits de réutilisation.
- Ne pas générer ou conseiller des clauses copiées sans adaptation et revue juridique.

7) Processus de publication et approbation
- Tout document légal doit passer par : 1) Rédaction initiale 2) Revue juridique interne/externe 3) Validation écrite (email) 4) Publication versionnée.
- Ajouter métadonnées au fichier : auteur, date, version, approbateur juridique.

8) Modèles courts (exemples)
- Disclaimer minimal : « Les informations fournies ne constituent pas un conseil juridique. Pour toute question juridique, consultez un avocat. »
- Clause de confidentialité (exemple) : « Les données collectées seront utilisées conformément à notre Politique de Confidentialité et aux lois applicables. Vous pouvez demander la suppression de vos données à [contact]. »

9) Checklist rapide avant publication
- Contient‑il un disclaimer clair ?
- Les mentions sur la protection des données sont présentes si nécessaire ?
- Un avocat a‑t‑il validé le texte ? (nom + date)
- Le fichier contient métadonnées versionnées ?
- Aucun PII réel n'est publié dans les exemples ?
---

# Légal / Juridique — Guide pratique et modèles

Objectif : fournir règles, templates et procédures concrètes pour rédiger ou reviewer du contenu sensible (disclaimers, clauses contractuelles, communications publiques, gestion de données).

---

## 0) Métadonnées recommandées (frontmatter)
Ajoutez en tête des documents légaux une frontmatter YAML pour traçabilité :

---
title: "Titre du document"
version: 0.1
author: "nom.prenom@example.com"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "résumé court"
---

Conserver ces champs et mettre `legal_review: true` + `reviewed_by` une fois validé.

## 1) Disclaimer (templates)

- Minimal (court) :

« Les informations fournies ici sont à titre informatif uniquement et ne constituent pas un conseil juridique. Pour toute décision, consultez un avocat qualifié dans la juridiction concernée. »

- Renforcé (document contractuel / page publique) :

« Ce document est fourni à titre informatif et ne remplace pas un conseil juridique professionnel. Les parties prenantes doivent consulter un avocat qualifié avant de s'engager contractuellement. Aucun élément présenté ici n'a vocation contraignante sans signature formelle. »

Toujours insérer au moins la version minimale pour tout contenu potentiellement contraignant.

## 2) Exemples concrets — Protection des données

- Notification RGPD (formulation courte) :

« Les données collectées seront utilisées conformément à notre Politique de Confidentialité et aux lois applicables. Vous pouvez exercer vos droits (accès, rectification, suppression) en contactant [contact@example.com]. »

- Consentement marketing (case à cocher) :

« J'accepte de recevoir des communications marketing par e‑mail de la part de [Nom]. Je peux me désabonner à tout moment via le lien en bas des e‑mails. »

- Bannière cookie (exemple) :

« Nous utilisons des cookies pour améliorer votre expérience. En poursuivant, vous acceptez notre utilisation des cookies conformément à la Politique de Cookies. [Gérer mes préférences] [Accepter] »

## 3) DSAR (Demande d'accès aux données) — Processus et email modèle

Processus court :
- Réception de la demande → Authentifier le demandeur → Rassembler les données → Répondre sous 1 mois (RGPD) → Archiver preuve de réponse.

Email modèle interne pour lancer la révision :

Subject: DSAR received — [request-id]

Body:
Bonjour équipe Legal/Privacy,

Nous avons reçu une demande d'accès aux données de la part de :
- Nom : [X]
- Email : [x@example.com]
- Date réception : [YYYY-MM-DD]

Merci de valider l'authentification et d'indiquer les prochains pas. Dossier : [lien interne].

— [nom demandeur interne]

## 4) Exemples contractuels (squelette minimal)

Utiliser ce squelette comme point de départ ; **NE PAS** publier sans revue juridique.

- Parties :
	- Prestataire : [Nom SIREN]
	- Client : [Nom]

- Définitions : définir les termes clés (Services, Deliverables, Confidential Information).

- Objet : description brève des prestations.

- Durée / Résiliation : durée, préavis, motifs de résiliation pour faute.

- Rémunération : montants, facturation, pénalités de retard.

- Limitation de responsabilité (exemple) :

« Sauf en cas de faute lourde ou dolosive, la responsabilité de chaque partie est limitée au montant total effectivement payé par le Client au titre du présent contrat au cours des 12 derniers mois. »

- Indemnisation : obligations de défense et indemnisation pour tiers.

- Confidentialité : durée, exception légale, mesures techniques.

- Loi applicable et juridiction :

« Le présent contrat est régi par le droit français. Tout litige sera soumis aux tribunaux compétents de [ville]. »

## 5) Clause de limitation de responsabilité (template court)

« Dans toute la mesure permise par la loi, la responsabilité de [Partie] envers [Autre partie] pour tout dommage indirect, perte de profits, perte de données ou conséquence spéciale est expressément exclue. »

## 6) Demande de revue juridique — template email

Subject: Legal review request — [doc-title] v[version]

Body:
Bonjour [Nom du juriste],

Merci de reviewer le document suivant :
- Titre : [doc-title]
- Chemin : [docs/...] 
- Version : [x.y]
- Auteur : [nom]
- Objectif : [qui utilisera/le but]

Points spécifiques à vérifier :
- Clause de limitation de responsabilité
- Mention RGPD / conservation des données
- Mentions commerciales / offres promotionnelles

Date souhaitée de retour : [YYYY-MM-DD]

Merci,
[nom]

## 7) Checklist rapide avant publication (à cocher)

- [ ] Frontmatter complété (author, version, legal_review=false)
- [ ] Disclaimer présent
- [ ] Pas de PII réel dans les exemples
- [ ] Clauses sensibles identifiées (liability, jurisdiction, data)
- [ ] Envoyé pour revue juridique (email + date)
- [ ] Validation enregistrée (legal_review=true)

## 8) Contacts & ressources

- Contact legal interne : [legal@example.com] (remplacer par le bon contact)
- Référence RGPD FR : CNIL ([https://www.cnil.fr](https://www.cnil.fr))

---
Notes :
- Ce guide est un support rédactionnel. L'IA ne remplace pas un avocat : toute publication juridique doit être validée par une personne qualifiée.

## 9) Prefilled examples for Overbound (do not publish without review)

Below are ready-to-review frontmatter and template snippets populated with the information you provided. Use these as drafts only — send to your legal contact for validation.

### Association — `ASSOCIATION OVERBOUND RACE` (example frontmatter)

---
title: "Convention de partenariat - ASSOCIATION OVERBOUND RACE"
version: 0.1
author: "Florian PALVADEAU <florian.plvd@gmail.com>"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "Draft de convention + clauses standard — vérifier statuts et subventions"
---

### Association — sample clause (contact + RGPD)

Contact légal : Florian PALVADEAU — florian.plvd@gmail.com — 06 52 26 60 54

Protection des données : Les données collectées par l'ASSOCIATION OVERBOUND RACE seront utilisées conformément à la Politique de Confidentialité de l'association et aux lois applicables (RGPD). Les personnes peuvent exercer leurs droits en contactant le président à l'adresse ci‑dessus.

### SASU — `Palvadeau Organisation / OVERBOUND` (example frontmatter)

---
title: "Contrat de prestation - Palvadeau Organisation (OVERBOUND)"
version: 0.1
author: "Florian PALVADEAU <florian.plvd@gmail.com>"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "Draft commercial: prestations événementielles et merchandising"
---

### SASU — sample clause (identification)

Société : Palvadeau Organisation (SASU) — RCS Versailles 992 578 229 — Siège : 105 Rue de la Brèche du Houx, 78760 Jouars-Pontchartrain

Représentant légal : Florian PALVADEAU — florian.plvd@gmail.com

TVA intracom: À compléter si nécessaire

---

Use these snippets to create drafts for your jurist. They include only the textual details you provided and no attached documents.
