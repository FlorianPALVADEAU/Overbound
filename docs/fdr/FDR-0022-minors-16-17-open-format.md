# FDR-0022 - Participation des mineurs de 16 et 17 ans (format OPEN)

- **Statut** : Proposed (code livré, désactivé par défaut, textes juridiques non relus)
- **Date** : 2026-11-03
- **Owner produit** : Florian Palvadeau
- **Références** : [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md), [FDR-0012](./FDR-0012-user-selected-open-wave.md),
  [reglement-sources](../legal/reglement-sources.md), [revue juridique](../legal/2026-11-mineurs-16-17-review.md)

## Contexte

L'assureur (agence AXA) a répondu que le projet « n'exclut pas la participation de mineurs » et recommande
d'informer systématiquement participants et représentants légaux sur l'assurance individuelle accident. La réponse
est floue. Décision du 2026-11-03 (Florian Palvadeau) : ne pas insister auprès de l'agence ; la confirmation écrite point par point n'est plus un préalable, le risque est assumé en connaissance de cause (voir ligne Assurance).

## Décision

| Sujet | Règle |
|---|---|
| Qui | 16 et 17 ans le jour de l'événement. Jamais avant 16 ans. |
| Quel format | OPEN uniquement. Jamais RANKED avant 18 ans. Un billet dont le format est ambigu est refusé (détection par `isOpenFormatTicket`). |
| Interrupteur | `events.minimum_age` : 18 (défaut, majeurs uniquement) ou 16. Champ dans le formulaire admin de l'événement. Revenir à 18 est refusé tant que des mineurs non annulés sont inscrits. |
| À l'inscription | Nom et téléphone du représentant légal et de l'adulte référent, obligatoires. Une case « c'est la même personne ». Stockés dans la décharge signée (`registration_signatures.signature_data.participant`), jamais dans Stripe. |
| Qui signe | Le représentant légal, ou la personne qui agit avec son accord (clause 18 de la décharge). Un seul texte de décharge pour tous, avec les clauses 18 à 21 pour les mineurs. Commande groupée parent + mineur : l'acheteur signe une fois, et doit cocher une case dédiée (`minorAttestation`, libellé `minorAttestationLabel`) disant qu'il est le représentant légal des mineurs de la commande, qu'il leur a expliqué les risques et que chacun signera l'autorisation parentale papier au retrait. La case est exigée par le serveur (422 sinon) et conservée avec la signature, avec l'identité du compte signataire (`signature_data.signer`), car l'acheteur n'est pas toujours un participant (parent qui commande pour des mineurs seulement). Le mineur ne signe que le papier. Parcours couverts par `e2e/checkout-minors.spec.ts` (un mineur, deux mineurs, parent et enfant, adultes seuls, moins de 16 ans, événement réservé aux majeurs) et par les tests de `registrations/create`. |
| Au retrait du dossard | Contrôle sur papier par un bénévole : autorisation parentale signée par le représentant légal et le mineur, pièce d'identité du mineur, adulte référent présent et joignable, attestation de santé pour mineurs. Le serveur refuse le check-in (409 `MINOR_PAPERS_REQUIRED`) tant que les quatre cases ne sont pas cochées, et enregistre qui a contrôlé et quand. |
| Santé | Attestation du questionnaire de santé pour mineurs de la FFA, ou licence FFA ; certificat médical si une réponse est « oui ». Source unique : `HEALTH_PROOF_MINOR` dans `participantNotice.ts`. À confirmer avec la FFA. |
| Secours | Procédure unique (`MINOR_EMERGENCY_PROCEDURE`) reprise dans la décharge, les CGV et le notice. À reprendre dans le règlement officiel (PDF). |
| Surveillance | Overbound n'assure ni garde ni surveillance de mineurs hors épreuve : l'adulte référent en répond. |
| Transfert | Un dossard ne se transfère qu'à un majeur. Le transfert remet à zéro les champs mineur. |
| Données | Coordonnées effacées 30 jours après l'événement (purge existante). Autorisation parentale papier conservée avec la décharge jusqu'aux 28 ans du participant (prescription suspendue pendant la minorité, article 2235 du Code civil). Attestation de santé jamais enregistrée. |
| Assurance | Décision du 2026-11-03 : ouverture sans confirmation écrite d'AXA sur les formalités. Réponse d'AXA du 2026-11-03 et contrat : aucune exclusion liée à l'âge ni aux obstacles, aucune condition d'autorisation parentale, d'adulte référent ou de questionnaire ; les pratiquants sportifs sont tiers entre eux. AXA ne confirme pas par écrit une dispense de toute formalité pour les mineurs, donc les textes ne promettent pas la couverture du mineur. Le représentant légal est informé de l'intérêt d'une assurance individuelle accident (non couverte par le contrat actuel) et de la clause 11. **Risque** : le contrat exclut les dommages résultant du non-respect des règles techniques et sportives des fédérations délégataires (p. 7) : le contrôle des papiers et du justificatif de santé protège aussi la garantie. |

## Versions

- `REGULATION_VERSION` : `2026-11-a` (nouvelles clauses 6, 18 à 21 de la décharge).
- `CGV_VERSION` : `2026-11-03` (art. 4 et 11). Les billets déjà vendus restent soumis à l'ancienne version.

## Checklist avant d'ouvrir un événement aux mineurs

1. ~~Appliquer la migration `20261104100000_minor_participants.sql`~~ : appliquée en production par Florian Palvadeau le 2026-11-03, puis déployer.
2. ~~Confirmation écrite d'AXA~~ : abandonnée par décision du 2026-11-03 (risque assumé par l'organisateur, voir ligne Assurance).
3. Confirmer avec la FFA que le questionnaire mineurs vaut pour Overbound et ce que donne un « oui ».
4. Faire relire par un avocat les textes listés dans la revue juridique, puis corriger les constantes.
5. Régénérer le règlement officiel (PDF) depuis `rulebook/overbound-reglement-officiel.md` (version 1.1 : âge, participant de 16 ou 17 ans, secours, image) et corriger l'entité organisatrice (voir revue juridique, question 13).
6. Imprimer le modèle d'autorisation parentale et le remettre aux bénévoles du retrait des dossards. Les autorisations signées seront scannées et stockées en base (décision du 2026-11-03) jusqu'aux 28 ans du participant, puis détruites : bucket privé, accès réservé aux administrateurs, aucune URL publique, journal des accès. Le papier original peut être détruit une fois le scan vérifié.
7. Aligner la FAQ Sanity publiée (voir ci-dessous).
8. Passer l'événement à `minimum_age = 16` dans l'admin.

## Autres décisions du 2026-11-03

- Organisateur unique : Palvadeau Organisation (SASU). L'association Overbound Race n'apparaît plus dans le règlement ni dans les guides.
- Flux de paiement historique : `webhooks/stripe` ne crée plus d'inscription (le chemin à billet unique ne contrôlait ni l'âge ni la décharge, et plus rien n'en crée les paiements). Un paiement qui n'est pas du flux multi-participants déclenche une alerte admin « flux inconnu ».
- Format Tribal Kids : hors périmètre de l'édition 2027, il aura ses propres conditions.

## Textes statiques

Les pages sans événement (formats, SEO, page entreprises, FAQ de repli) disent la même chose dans les deux états, via
`AGE_RULE_SHORT` et `AGE_RULE_ANSWER` (`raceFormatRules.ts`) : 18 ans, et dès 16 ans au format OPEN sur les événements
ouverts aux mineurs. Elles n'ont donc pas à changer à l'ouverture. La page de l'événement, le tunnel et les CGV
donnent la règle exacte de l'événement depuis `events.minimum_age`. À aligner à la main : la FAQ Sanity publiée
(`fallback-inscriptions-assurance-pps` et la question sur l'âge) et le règlement officiel (PDF).

## Hors périmètre

PDF d'autorisation parentale et e-mail au représentant légal (à faire côté Overbound), dossards compagnons et mineurs,
mineurs de moins de 16 ans, mineurs en B2B.
