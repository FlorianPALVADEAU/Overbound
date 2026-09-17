# FDR-0010 — Politique financière des corrections de billet et de SAS

- **Statut** : Accepted — V1 sans mouvement financier
- **Date** : 2026-09-17
- **Owner produit** : à désigner (responsable opérations / finance)
- **Owner technique** : à désigner
- **Périmètre** : changements administratifs d’inscription, de billet, de format et de SAS
- **Dépendances** : [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md), [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md), [FDR-0008](./FDR-0008-admin-operations-workspace.md), [critical operations](../guides/critical-operations.md)

> Cette FDR est un contrat de décision, pas une autorisation de modifier la base ou de rembourser un participant. Aucun flux de confirmation ne doit être activé tant que les owners n’ont pas accepté la politique et que les contrats de paiement live n’ont pas été vérifiés.

## Décisions produit validées pour la V1

- Le **prix historique payé est conservé** lors d’un changement de billet.
- Tout **écart financier est bloquant** ; il n’est ni collecté, ni remboursé, ni transformé en avoir.
- La V1 ne permet que les corrections **sans mouvement financier**.
- Une exception gratuite (`NO_MOVEMENT_EXCEPTION`) peut être validée par un **admin habilité ou un responsable finance**.
- Toute exception financière exige un **motif obligatoire**, un approbateur identifiable et une trace d’audit.
- Les **taxes, frais de paiement et promotions ne sont pas recalculés** en V1. Si leur impact ne peut pas être prouvé comme nul, l’aperçu est bloqué.
- Les avoirs et remboursements sont **hors périmètre** et non applicables à cette version.
- Toute correction est **interdite à partir de J-1 inclus**, calculé par rapport au début de l’événement dans son fuseau horaire.
- Aucune double approbation n’est requise en V1. Les rôles admin habilité et responsable finance restent distincts dans le modèle d’autorisation, même s’ils sont actuellement détenus par la même personne.

## 0. Guide de reprise autonome

Un agent qui implémente cette FDR doit :

1. Lire cette FDR, FDR-0008, puis FDR-0004 et FDR-0005.
2. Identifier le fournisseur de paiement et le système comptable réellement utilisés ; ne pas déduire la politique depuis le seul montant stocké dans `registrations` ou `orders`.
3. Réaliser un dry-run serveur avant toute écriture et afficher le résultat à l’admin.
4. Ne jamais faire varier silencieusement le montant payé, le remboursement ou le statut de paiement.
5. Faire valider chaque correction financière par l’owner habilité, avec un motif et un identifiant de commande idempotent.
6. Ajouter des tests de succès et d’échec pour chaque use-case, puis vérifier RLS, audit, concurrence et rollback.

## 1. Problème et objectifs

Un admin doit pouvoir corriger une inscription sans connaître l’implémentation interne des billets, mais un changement de billet peut avoir un effet financier, fiscal, contractuel ou opérationnel. Le système doit donc distinguer clairement :

- la **correction opérationnelle** (format, SAS, groupe, départ) ;
- le **calcul d’écart** (prix catalogue, remise, taxes, frais, montant payé) ;
- la **décision financière** (aucun mouvement, collecte, avoir, remboursement, annulation) ;
- l’**exécution financière** par le prestataire ;
- la **réconciliation** et la clôture de l’opération.

Objectifs :

- empêcher les mutations financières implicites lors d’un simple changement de billet ;
- rendre le résultat compréhensible avant confirmation ;
- garantir une trace complète, minimisée et exportable ;
- permettre la reprise après timeout, double clic, webhook tardif ou échec partiel ;
- conserver un rollback réaliste, sans prétendre annuler une transaction déjà capturée automatiquement.

Non-objectifs : tarification générale, politique commerciale des offres, émission d’un nouveau moyen de paiement, comptabilité générale et remboursement automatique sans décision séparée.

## 2. Vocabulaire normatif

| Terme | Définition | Interdit de confondre avec |
|---|---|---|
| Billet actuel | Produit actuellement lié à l’inscription | Commande historique |
| Billet cible | Produit demandé par l’admin | Prix réellement payé |
| Prix catalogue | Prix du billet dans la devise et le contexte de l’événement | Montant net encaissé |
| Montant payé | Somme effectivement enregistrée comme payée, après vérification de la source | Prix catalogue |
| Écart calculé | Différence documentée entre le scénario actuel et le scénario cible | Décision de débit/remboursement |
| Collecte complémentaire | Paiement additionnel autorisé par l’owner | Mutation de `total` locale |
| Avoir | Crédit interne traçable et consommable selon une politique dédiée | Remboursement bancaire |
| Remboursement | Reversement via le prestataire de paiement | Suppression d’une inscription |
| Correction sans mouvement | Changement opérationnel sans débit, avoir ou remboursement | “Gratuit” non documenté |
| Commande | Opération idempotente de confirmation, distincte d’une commande commerciale | `order_id` du prestataire |

Les libellés UI doivent utiliser ces termes. “Ajuster le prix”, “Forcer”, “Changer l’offre” et “Annuler” seuls sont insuffisamment précis.

## 3. Matrice de politique

### 3.1 Variantes proposées

| Code | Cas | Autorisation par défaut | Effet financier |
|---|---|---|---|
| `NO_MOVEMENT` | Billet de même prix, changement de format approuvé, ou changement de SAS | Admin opérations | Aucun mouvement ; le montant payé reste inchangé |
| `NO_MOVEMENT_EXCEPTION` | Billet plus cher ou moins cher mais décision explicite de conserver le prix historique | Admin habilité ou responsable finance | Aucun mouvement ; motif obligatoire et approbation tracée |
| `COLLECT_DIFFERENCE` | Billet cible plus cher | Owner finance + paiement réussi | Collecter l’écart avant de finaliser, ou laisser l’inscription en attente |
| `ISSUE_CREDIT` | Billet cible moins cher | Owner finance requis | Émettre un avoir selon durée, usage et éligibilité définis |
| `REFUND_DIFFERENCE` | Billet cible moins cher | Owner finance requis | Remboursement explicite via prestataire, asynchrone et réconcilié |
| `REJECT` | Écart non calculable, commande non payée, conflit de remise/taxe, ou cas non supporté | Tout admin | Aucune mutation |

**DECISION** — V1 n’active que `NO_MOVEMENT` pour les changements sans écart et `NO_MOVEMENT_EXCEPTION` pour une exception explicitement approuvée. Tout autre cas retourne `REJECT`. `COLLECT_DIFFERENCE`, `ISSUE_CREDIT` et `REFUND_DIFFERENCE` sont hors périmètre et ne doivent générer aucun mouvement.

### 3.2 Choix à valider

- **DECISION Q-10** — Le prix historique payé est conservé en V1.
- **DECISION Q-11** — `NO_MOVEMENT_EXCEPTION` est accessible à un admin habilité ou à un responsable finance, avec motif et approbation tracée.
- **DECISION Q-12** — Les frais de paiement, taxes et promotions ne sont pas recalculés en V1 ; toute incertitude bloque l’opération.
- **DECISION Q-13** — Aucun avoir ni remboursement n’est applicable en V1 ; ces scénarios sont hors périmètre.
- **DECISION Q-14** — Aucune correction n’est autorisée à partir de J-1 inclus avant le début de l’événement. Le serveur applique cette règle avec le fuseau horaire de l’événement ; l’UI ne fait qu’afficher le blocage.
- **DECISION Q-15** — Aucune double approbation ni seuil supplémentaire en V1. Une seule approbation par un admin habilité ou un responsable finance suffit.

## 4. Contrat d’aperçu (dry-run)

L’aperçu est calculé côté serveur à partir de données fraîches. Il ne réserve pas de SAS, ne modifie pas l’inscription, ne crée pas de paiement et ne crée pas d’avoir.

Entrée minimale : `event_id`, `registration_id`, `target_ticket_id` ou `target_wave_id`, `policy_variant` éventuelle, et version de schéma de requête. L’admin ne peut pas envoyer les montants comme source de vérité.

Réponse minimale :

```text
preview_id, expires_at, source_version
current: ticket, format, SAS/departure, paid_amount, currency, payment_status
target: ticket, format, proposed SAS/departure
financial: catalogue_delta, estimated_tax_delta, refundable_delta, action_required
operational_impacts: group_anchor, affected_registrations, counters
blocking_reasons[]
required_approver_role
```

L’UI doit présenter “Aucun mouvement financier” explicitement ; elle ne doit jamais masquer un montant nul derrière un badge neutre. Un aperçu expiré ou dont la version des données a changé doit être recalculé avant confirmation.

## 5. Contrat de confirmation

La confirmation est une commande serveur dédiée, jamais un `PATCH` générique de `registrations`.

Requête minimale :

```json
{
  "preview_id": "uuid",
  "command_id": "uuid",
  "reason_code": "DATA_ENTRY_ERROR",
  "reason_note": "Correction demandée par…",
  "policy_variant": "NO_MOVEMENT",
  "expected_version": "opaque-version",
  "approver_id": "uuid"
}
```

Exigences :

1. Authentifier l’appelant et vérifier son organisation, son rôle et le rôle d’approbateur.
2. Recharger et verrouiller les ressources nécessaires ; vérifier que l’aperçu n’est pas expiré et que l’événement n’est pas à J-1 ou moins.
3. Revalider billet, événement, format, statut, groupe ancré, disponibilité SAS et état de paiement.
4. Refuser si `expected_version` ne correspond plus ; ne pas écraser la modification concurrente.
5. Exécuter dans une transaction atomique pour l’opération métier et son audit local.
6. Pour une action financière externe, persister d’abord un état `pending`, utiliser une clé idempotente côté prestataire, puis clôturer uniquement sur confirmation.
7. Retourner le même résultat pour une répétition du même `command_id` ; refuser la réutilisation avec un payload différent.
8. Ne jamais déclarer “remboursé” sur un simple appel réseau accepté : attendre le webhook ou une vérification de réconciliation.

États recommandés : `previewed`, `awaiting_approval`, `pending`, `succeeded`, `failed`, `reconciliation_required`, `rolled_back`. Un échec ne doit pas réappliquer une mutation métier ou générer un second mouvement financier.

## 6. Rollback et incidents

Le rollback dépend de l’étape :

- avant confirmation : invalider l’aperçu ; aucune donnée métier à restaurer ;
- après correction opérationnelle sans mouvement : restaurer billet/SAS/format depuis le snapshot d’audit, en repassant par les invariants FDR-0004/0005 ;
- après création d’un paiement ou remboursement : ne jamais modifier directement un montant pour “annuler” ; créer une opération compensatoire via le prestataire et la réconcilier ;
- après cascade de groupe : restaurer l’ensemble des inscriptions affectées ou bloquer la restauration partielle ;
- après timeout : consulter `command_id`, l’état de paiement et les webhooks avant toute relance.

Chaque commande conserve un snapshot minimal des champs métier précédents et nouveaux, l’identifiant de version, les ressources affectées et les références prestataire. Les données sensibles de paiement (numéro de carte, secret, payload complet) sont interdites dans l’audit.

## 7. Audit, preuve et confidentialité

L’audit doit répondre à : qui, quand, dans quelle organisation, sur quelle inscription/commande, quelle décision, quel avant/après, quel motif, quel approbateur, quel montant/devise, quelle référence externe et quel résultat.

**REQUIREMENT** :

- journal append-only ou protection équivalente contre la modification silencieuse ;
- horodatage UTC et affichage dans le fuseau de l’événement ;
- minimisation des emails, noms, adresses et données de paiement ;
- corrélation par `command_id` et `provider_operation_id` ;
- accès aux détails limité aux admins habilités et aux owners finance ;
- rétention et droit d’export définis avec le responsable légal/RGPD.

## 8. Supabase, RLS et séparation des responsabilités

- Les tables d’opérations, approbations et audit portent `organization_id` et, lorsque pertinent, `event_id`.
- RLS doit limiter la lecture/écriture à l’organisation et au rôle métier ; `authenticated` seul n’est pas une autorisation.
- Les routes utilisent le client serveur approprié et ne transmettent jamais `service_role` au navigateur.
- Une fonction `SECURITY DEFINER` publique n’est pas acceptable comme raccourci ; toute fonction privilégiée doit être dans un schéma non exposé, avec `search_path` contrôlé, grants minimaux et revue dédiée.
- Les mutations de `registrations`, `event_waves`, `groups` et opérations financières doivent être atomiques et auditées.
- Vérifier en environnement cible les policies, grants, fonctions, contraintes d’unicité, index, triggers et contrats de webhook avant migration.

## 9. UX d’un admin occasionnel

Le parcours tient en une vue : sélectionner l’inscription, choisir le billet/SAS cible, consulter l’aperçu, voir le badge financier explicite, saisir le motif, obtenir l’approbation si nécessaire, confirmer une fois, puis suivre l’état.

Libellés obligatoires : “Prévisualiser”, “Aucun mouvement financier”, “Collecte complémentaire”, “Avoir”, “Remboursement”, “Confirmation requise”, “Opération en attente”, “Échec — aucune modification appliquée”.

La confirmation affiche l’impact opérationnel (groupe, SAS, départ, autres inscriptions) et financier côte à côte. Les boutons irréversibles sont désactivés si l’aperçu est expiré, bloqué, incomplet ou si l’owner requis manque.

## 10. API et observabilité

Routes cibles, à adapter aux conventions existantes :

```text
POST /api/admin/events/:eventId/participants/:registrationId/change-ticket/preview
POST /api/admin/events/:eventId/participants/:registrationId/change-ticket/confirm
POST /api/admin/events/:eventId/participants/:registrationId/change-wave/preview
POST /api/admin/events/:eventId/participants/:registrationId/change-wave/confirm
GET  /api/admin/financial-operations/:commandId
```

Les logs contiennent `organization_id`, `event_id`, `registration_id`, `command_id`, résultat, durée et code d’erreur, mais pas de secrets ni de payload de paiement. Mesures minimales : taux de previews bloqués, confirmations par variante, échecs de concurrence, opérations pending, temps de réconciliation et divergences de montant.

## 11. Plan de livraison par lots

| Lot | Contenu | Sortie / gate |
|---|---|---|
| 0 | Décider Q-10 à Q-15, inventorier paiements et live Supabase | politique acceptée, owners nommés |
| 1 | Aperçus billet/SAS, règles `NO_MOVEMENT`/`REJECT` | zéro écriture depuis preview, tests contrats |
| 2 | Confirmation sans mouvement, audit, idempotence, rollback | tests concurrence + RLS + dry-run |
| 3 | Approbations et `NO_MOVEMENT_EXCEPTION` | matrice rôles/seuils validée |
| 4 | Collecte complémentaire | prestataire, webhook, retry et réconciliation testés |
| 5 | Avoir et remboursement | validation finance/légale, runbook incident, pilote |

Chaque lot est livrable séparément et doit inclure migration réversible si nécessaire, tests unitaires/use-case/route, vérification manuelle happy path + edge case et documentation du rollback.

## 12. Critères d’acceptation

- Un changement sans écart affiche et journalise explicitement `NO_MOVEMENT`.
- Une correction est refusée dès J-1, côté serveur, quelle que soit la date de création de l’aperçu.
- Un écart ou une donnée incohérente est bloqué sans écriture partielle.
- Un admin non habilité ne peut ni approuver ni confirmer une variante protégée.
- Un double clic et une répétition réseau produisent un seul résultat via `command_id`.
- Une course de concurrence échoue proprement si billet, SAS, groupe ou paiement a changé.
- Une cascade de groupe respecte FDR-0005 et expose toutes les inscriptions affectées.
- Un paiement externe pending est visible et réconciliable ; aucun statut final mensonger n’est affiché.
- L’audit est exploitable sans exposer de données de carte ou de secrets.
- Les tests, le lint, le build et les vérifications RLS sont passants avant activation.

## 13. Risques et points d’attention

- Les données historiques peuvent mélanger prix brut, remise, taxe et devise ; impossible de calculer un écart fiable sans contrat source.
- Un webhook peut arriver après une réponse HTTP ; le modèle doit être asynchrone et idempotent.
- Le rollback d’un remboursement n’est pas une simple inversion SQL.
- Les promotions cumulatives et les commandes multi-inscriptions exigent une règle explicite ; ne pas recalculer toute la commande par défaut.
- Le changement OPEN/RANKED modifie aussi départ, SAS et potentiellement une ancre de groupe ; la politique financière ne remplace jamais FDR-0004/0005.
- Les permissions admin existantes et les grants SQL observés doivent être vérifiés : la documentation seule ne prouve pas la sécurité en production.

## 14. Questions bloquantes et décisions à extraire

Avant les lots 2 à 5, publier :

1. Une décision finance acceptant une ou plusieurs variantes de la matrice.
2. Un ADR sur l’intégration prestataire, l’idempotence et le modèle d’état si elle n’est pas déjà documentée.
3. Un runbook de remboursement/incident avec contacts et délais de réconciliation.
4. La politique légale/RGPD de conservation et d’accès à l’audit.
5. Le contrat live des tables, RPC, fonctions, webhooks et rôles Supabase.

Tant que ces artefacts ne sont pas validés, seule la préparation et la prévisualisation sans écriture sont autorisées.
