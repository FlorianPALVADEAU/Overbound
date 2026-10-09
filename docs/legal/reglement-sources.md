---
title: "Sources du règlement officiel Overbound — règles décidées et où elles vivent"
version: 0.1
author: "florian.plvd@gmail.com"
legal_review: false
reviewed_by: ""
review_date: ""
notes: "Point d'entrée pour réécrire le règlement officiel (PDF) depuis une autre session. Chaque règle renvoie à son texte source dans le code et à son fondement. Rédigé sans avocat."
---

> Ce document n'est pas un conseil juridique. Consultez un avocat.

## Comment l'utiliser

Le règlement officiel (`public/documents/reglementation-officielle-overbound-6-2026.pdf`, chemin dans
`OFFICIAL_RULEBOOK_PDF_PATH`) date de juin 2026 et n'intègre pas les décisions d'octobre 2026. Pour le
réécrire : reprendre chaque section ci-dessous, vérifier le texte source indiqué (il fait foi), puis aligner le
PDF. Ne jamais introduire dans le règlement une règle qui contredit les CGV ou la décharge : en cas de conflit,
modifier d'abord la source, puis le règlement.

Documents qui font foi, par ordre de priorité pour un participant :

1. CGV — `src/app/cgv/page.tsx` (contrat de vente)
2. Décharge — `src/constants/waiver.ts` (signée, empreinte SHA-256 stockée à chaque signature ; version
   `REGULATION_VERSION` dans `src/constants/registration.ts`, à incrémenter à chaque changement de texte)
3. Règlement officiel (PDF) — règles sportives et de sécurité
4. CGU — `src/app/cgu/page.tsx` (usage du site)
5. Politique de confidentialité — `src/app/privacy-policies/page.tsx`

## Identité de l'organisateur

- Personne morale : **Palvadeau Organisation**, SASU au capital de 5 000 €, RCS Versailles 992 578 229,
  105 rue de la Brèche du Houx, 78760 Jouars-Pontchartrain. Marque exploitée : **Overbound**.
- Source : `src/constants/companyInfo.ts`. L'attestation d'assurance AXA est au nom de « SAS Palvadeau
  Organisation » : le règlement doit nommer la société, pas seulement la marque.

## Règles décidées

### Participation
| Règle | Source | Fondement |
|---|---|---|
| Édition 2026 réservée aux majeurs (18 ans révolus le jour J) ; aucun transfert vers un mineur | CGV art. 4 et 11, décharge §6, `MINIMUM_PARTICIPANT_AGE` | capacité à contracter et à signer la décharge |
| Aptitude physique attestée par le participant | décharge §5, CGV art. 11 | preuve de l'information |
| Justificatif de santé (PPS, licence ou certificat) exigible selon le format — **décision en attente** | CGV art. 11, décharge §5 | délégation FFA pour la course à obstacles ; PPS exigé par la FFA pour les non-licenciés en compétition |
| Pièce d'identité au retrait du dossard ; départ refusé si l'identité ne correspond pas | CGV art. 11, décharge §12, email billet | dossard personnel |
| Équipement adapté, contrôlable ; mise hors course sans remboursement | CGV art. 11 | sécurité |
| Respect du briefing, des consignes et des signaleurs ; arrêt en cas de danger | décharge §3 | obligation de sécurité (de moyens) de l'organisateur |

### Décharge et signature
| Règle | Source | Fondement |
|---|---|---|
| Chaque signature enregistre : image, date, IP, navigateur, compte, version et empreinte SHA-256 du texte | `src/lib/legal/waiverDocument.ts`, routes `registrations/create` et `account/tickets/claim` | art. 1366-1367 C. civ. |
| Pas de renonciation à recours pour une faute d'Overbound ni pour une faute lourde | décharge §2 et §4, CGV art. 12 | R212-1 6° C. conso (clause noire) |
| Commande de groupe : une seule signature ; l'acheteur atteste agir avec l'accord des participants, leur transmettre les documents, et se porte fort de leur acceptation | décharge §16, case « group-attestation » dans `ConfirmationStep`, CGV art. 4 | art. 1204 C. civ. (porte-fort) |
| Chaque participant d'une commande reçoit dans son email de billet un lien vers la décharge (`/decharge`), le règlement et les CGV | `src/emails/TicketEmail.tsx`, `src/app/decharge/page.tsx` | preuve de l'information du participant non signataire |
| Image : autorisation gratuite, monde entier, 10 ans, opposition possible | décharge §14 | droit à l'image (durée limitée) |

### Transfert de dossard
| Règle | Source | Fondement |
|---|---|---|
| Cession autorisée par avance, uniquement via la plateforme, une fois par dossard, jusqu'à la veille | CGV art. 8, `transferPolicy.ts` | art. 1216 C. civ. |
| Frais de 6,99 € TTC payés par le cédant, non remboursables, renonciation expresse à la rétractation | CGV art. 8.2, `TransferConsentDialog`, métadonnées Stripe `withdrawal_waived_at` | art. L221-28 1° C. conso |
| Le bénéficiaire renseigne son identité et signe sa propre décharge ; la cession prend effet à cette signature | CGV art. 8.3-8.4, décharge §13, `ClaimTicketForm` | art. 1216 al. 3 C. civ. (écrit à peine de nullité) |
| Le cédant est libéré pour l'avenir, perd ses droits ; nouveau QR code | CGV art. 8.4, `buildHandOverUpdate` | art. 1216-1 C. civ. |
| Emails aux deux parties ; copie de la décharge signée au bénéficiaire | `src/lib/tickets/transferAftermath.ts` | date certaine, support durable |
| Remboursement éventuel versé à l'acheteur d'origine ; arrangements entre parties hors Overbound | CGV art. 8.5 | — |
| Revente au-dessus du prix, sur plateforme ou habituelle interdite ; annulation sans remboursement | CGV art. 8.6 | art. 313-6-2 C. pén. |

### Annulation, report, remboursement
| Règle | Source | Fondement |
|---|---|---|
| Pas de rétractation (activité de loisir datée) ; pas de remboursement à l'initiative du participant | CGV art. 7 et 10, décharge §9 | art. L221-28 12° C. conso |
| Annulation par Overbound, même force majeure : remboursement du billet et des options non fournies à l'acheteur d'origine sous 30 jours ; frais de transfert exclus | CGV art. 9.1 | art. 1218, 1229 C. civ., R212-1 C. conso |
| Report : billet valable, ou remboursement sur demande sous 30 jours | CGV art. 9.2 | — |
| Adaptation (parcours, obstacles, horaires, interruption) sans remboursement si date et lieu maintenus | CGV art. 9.3, décharge §10 | — |
| Option « billet flexible » (décidée et implémentée le 2026-10-09) : 8,90 € fixes par billet, choisie par participant ; annulation par l'acheteur d'origine depuis son espace, sans justificatif, jusqu'à J-7 ; remboursement automatique (Stripe) du prix payé pour le billet, réductions réparties au prorata ; option, autres options et frais de transfert non remboursés ; perdue en cas de transfert ou après validation au check-in. Pas d'aléa ni de justificatif : ce n'est pas un contrat d'assurance | CGV art. 10, décharge §9, `src/lib/tickets/flexibleTicket.ts`, `flexibleRefund.ts`, migration `20261009110000_flexible_tickets.sql` | art. L310-1 C. assur. (ne pas conditionner le remboursement à un événement aléatoire) |

### Assurance
| Règle | Source | Fondement |
|---|---|---|
| RC organisateur AXA France IARD, contrat n° 0000011530476604, valable du 11/09/2026 au 01/01/2027, plafond 9 M€ dommages corporels par année | `COMPANY_INFO.insurance`, CGV art. 12, décharge §11 | art. L321-1 C. sport ; Cass. 1re civ. 28 janv. 2026 n° 24-20.866 |
| L'assurance ne couvre pas les dommages corporels du participant sans faute d'Overbound ; assurance individuelle accident recommandée | CGV art. 12, décharge §11, formulaire de transfert | même arrêt |
| Contrat à tacite reconduction : l'édition suivante est couverte aux mêmes conditions (confirmé par Florian le 2026-10-09). Mettre à jour `COMPANY_INFO.insurance` avec la nouvelle attestation dès qu'elle est disponible | `COMPANY_INFO.insurance` | — |
| **Question posée à AXA le 2026-10-09, réponse attendue** : la RC des participants entre eux est-elle couverte (exigée par L321-1) ? Un bénéficiaire de transfert est-il couvert comme un acheteur ? Tant que la réponse n'est pas écrite, ne rien affirmer sur ces deux points dans les textes | — | art. L321-1 C. sport |

### Données personnelles
| Règle | Source | Fondement |
|---|---|---|
| Infos de santé seulement avec consentement exprès séparé, sinon non enregistrées | `keepHealthDataWithConsent`, `ParticipantForm`, `ClaimTicketForm` | art. 9(2)(a) RGPD |
| Infos de santé et contact d'urgence effacés 30 jours après l'événement, et dès le transfert pour l'ancien titulaire | cron `safety-data-purge`, `redactFormerHolderWaiver` | minimisation |
| Décharges et preuves de transfert conservées 10 ans après l'événement | politique de confidentialité §6 | art. 2226 C. civ. |
| Pas de DPO désigné (non obligatoire) | politique de confidentialité §2, CGU | art. 37 RGPD |

## Points ouverts

- Décision PPS : formats concernés, mode de collecte, contrôle au check-in.
- Réponses écrites d'AXA (voir tableau Assurance).
- **Médiateur de la consommation** : aucune adhésion à ce jour (2026-10-09), alors que les CGV et CGU citent CM2C.
  L'adhésion est obligatoire avant toute vente à un consommateur (art. L612-1 C. conso), sanction jusqu'à
  15 000 € pour une personne morale (art. L641-1). Adhérer, puis vérifier que le nom et le site du médiateur
  affichés correspondent (`COMPANY_INFO.mediation`).
- Adresses `press@` et `partners@` : existent (confirmé le 2026-10-09).
