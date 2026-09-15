# FDR-0008 — Espace opérations admin orienté événement

- **Statut** : Proposed
- **Date** : 2026-09-15
- **Owner produit** : à désigner
- **Owner technique** : à désigner
- **Portée** : expérience et opérations d’administration des événements Overbound
- **Références prioritaires** : [FDR-0004](./FDR-0004-wave-assignment-open-vs-ranked.md), [FDR-0005](./FDR-0005-group-membership-and-wave-anchoring.md), [FDR-0006](./FDR-0006-ambassador-program-points-and-rewards.md), [FDR-0007](./FDR-0007-email-distribution-and-preferences.md), [critical operations](../guides/critical-operations.md), [ADR-0004](../adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md)

> **Document de cadrage, pas autorisation de déploiement.** Cette FDR définit la cible et les prérequis. Aucun changement de politique RLS, de fonction SQL privilégiée, de prix, ou de données de production ne découle automatiquement de sa lecture.

## 0. Guide de reprise pour un agent

### Ordre de lecture obligatoire

1. Lire cette FDR entièrement, puis FDR-0004 et FDR-0005 avant toute action sur un billet, une SAS ou un groupe.
2. Lire `critical-operations.md` et `rpc-reference.md` avant toute mutation sensible. La signature réellement déployée d’un RPC doit toutefois être vérifiée dans la base cible : la documentation seule n’est pas un contrat live.
3. Lire ADR-0004 avant de déplacer du code : l’architecture courante est organisée par `src/lib`, non hexagonale stricte.
4. Pour une modification Supabase : réaliser l’audit live prévu en phase 0, vérifier RLS, rôles, vues et fonctions avant d’écrire une migration.

### Règles qui ne peuvent pas être contournées

- Un groupe ancré force toutes les inscriptions **OPEN** concernées à sa SAS ; RANKED n’est jamais touché.
- Le changement RANKED → OPEN doit passer par l’assignation OPEN et respecter l’ancre de groupe.
- Le changement OPEN → RANKED efface les attributs de SAS OPEN et place le départ RANKED selon FDR-0004.
- Une écriture métier doit être autorisée côté serveur, validée, atomique quand elle modifie plusieurs entités, et auditée avec des données minimisées.
- L’UI n’accède jamais directement à une clé `service_role` ni ne décide seule d’une autorisation.

### Ce qu’un agent ne doit pas faire

- Ne pas déployer la migration locale éventuelle de changement de billet tant que la revue RLS / fonctions n’est pas validée.
- Ne pas remplacer la détection OPEN/RANKED par un champ hypothétique `race_format` sans décision de migration et plan de backfill.
- Ne pas transformer une route `GET` en écriture implicite ; l’initialisation des SAS doit devenir une commande explicite.
- Ne pas fusionner ce programme entier dans une seule PR.

## 1. Convention normative et registre de décisions

| Marqueur | Sens | Effet pour l’implémentation |
|---|---|---|
| **DECISION** | Choix validé par cette FDR ou une FDR citée | À appliquer et tester. |
| **REQUIREMENT** | Critère nécessaire pour accepter un lot | À satisfaire avant validation du lot. |
| **PROPOSAL** | Direction privilégiée, non encore engagée | Ne pas coder sans validation de l’owner. |
| **OPEN QUESTION** | Arbitrage produit / légal / technique manquant | Bloque le périmètre indiqué, pas forcément le programme entier. |
| **OBSERVED** | Constat dans le dépôt au 15 septembre 2026 | À confirmer dans l’environnement visé avant décision de production. |

### Décisions prises ici

1. **DECISION** — L’admin devient un espace de travail centré sur un événement, et non une suite de tabs hétérogènes.
2. **DECISION** — Les listes opérationnelles sont server-side, recherchables, filtrables, triables et sélectionnables ; elles ont une URL partageable seulement lorsque cela ne divulgue pas de PII.
3. **DECISION** — Les mutations sensibles sont des commandes serveur dédiées, jamais des `PATCH` génériques de lignes.
4. **DECISION** — Les FDR spécialisées prévalent sur cette FDR en cas de conflit métier.
5. **DECISION** — Cette FDR est un programme. Les décisions d’architecture, d’autorisation et de politique financière devront être extraites dans les documents indiqués en section 14 avant leur lot concerné.

## 2. Besoin métier et diagnostic

L’administration actuelle permet de nombreuses actions, mais ne donne pas un flux de travail fiable à un administrateur occasionnel : trop de sections, contexte événement insuffisant, tables non homogènes, vocabulaire ambigu et actions métier critiques difficiles à découvrir ou à sécuriser.

### État observé dans le dépôt

- **OBSERVED** — `AdminDashboard`, `AdminSidebar` et `useAdminDashboardStore` organisent l’admin autour de nombreuses sections ; l’onglet sélectionné est persistant côté navigateur plutôt que représenté par une route métier.
- **OBSERVED** — `RegistrationsSection` et `UsersSection` portent des logiques de listes distinctes. L’API utilisateurs a une limite de récupération de 5 000 comptes.
- **OBSERVED** — `AdminDataGrid` n’est pas aujourd’hui une primitive complète de recherche, filtres, tri, sélection, vues enregistrées et pagination serveur.
- **OBSERVED** — les inscriptions utilisent `get_registrations_with_filters`; son contrat déployé doit être vérifié avant réutilisation.
- **OBSERVED** — `GET /api/admin/events/:id/waves` appelle une initialisation de SAS. C’est une lecture à effet de bord à supprimer dans la cible.
- **OBSERVED** — OPEN/RANKED est détecté par `isOpenFormatTicket(ticket.name, race.name)`, donc par les libellés.

Ces observations décrivent le checkout courant, non la production. Elles constituent le point de départ de la phase 0.

## 3. Vocabulaire canonique

| Terme affiché | Définition | À ne pas confondre avec |
|---|---|---|
| **Événement** | Édition organisée à une date et un lieu donnés | course / format |
| **Participant** | Personne portant une inscription à un événement, avec ou sans compte réclamé | compte utilisateur |
| **Inscription** | Droit de participation individuel lié à un billet, un événement et un statut | commande |
| **Compte** | Identité Auth / profil, potentiellement sans inscription | participant |
| **Billet** | Produit attribué à une inscription ; il détermine notamment son format | offre / code promo |
| **Format** | OPEN ou RANKED dans l’implémentation actuelle | SAS |
| **SAS** | Créneau de départ OPEN ; une inscription RANKED n’a pas de SAS | heure de départ RANKED |
| **Groupe** | Ensemble de comptes avec éventuelle ancre de SAS par événement | commande groupée |
| **Offre / code** | Règle commerciale ; ne change pas rétroactivement un billet déjà vendu | billet |
| **Campagne** | Envoi marketing ou opérationnel à une audience définie | email transactionnel |

Le menu peut afficher « Ambassadeurs », mais le modèle métier reste un programme distinct du rôle d’accès administrateur.

## 4. Décision UX : espace événement

### Navigation cible

```
Admin
├── Vue générale
├── Événements
│   └── [Événement sélectionné]
│       ├── Vue d’ensemble
│       ├── Participants
│       ├── Départs & SAS
│       ├── Groupes
│       ├── Billets, offres & prix
│       ├── Communications
│       └── Équipe opérationnelle
├── Comptes
├── Ambassadeurs
└── Paramètres & audit
```

**DECISION** — le contexte événement est visible dans l’en-tête sur toutes les pages événementielles. La route contient l’identifiant stable de l’événement ; le slug, s’il existe, ne remplace pas l’UUID tant qu’un contrat de redirection/collision n’est pas défini.

### Contrat du sélecteur d’événement

**REQUIREMENT** — il affiche au minimum nom, date, fuseau, statut (`draft`, `published`, `completed`, `cancelled` si ces états existent), et limite les choix aux événements que l’opérateur peut gérer.

**OPEN QUESTION Q-01** — la liste inclut-elle les événements passés/cancelled par défaut, et quel est l’événement sélectionné lors de plusieurs événements actifs ? Proposition : événement à venir le plus proche dans son fuseau ; aucune sélection implicite si plusieurs événements sont simultanément en cours.

**OPEN QUESTION Q-02** — Europe/Paris est-il une contrainte produit durable ou un paramètre de chaque événement ? La conception doit conserver `event.timezone` comme source de formatage.

### Écran d’accueil

Vue courte et actionnable : alertes prioritaires, inscriptions à traiter, remplissage SAS, campagnes en échec, liens vers les vues filtrées. Aucune carte décorative sans action ou décision associée.

**OPEN QUESTION Q-03** — définir « À traiter » avant son développement. Chaque règle doit préciser source, gravité, propriétaire attendu et durée de vie. Exemple de départ : document requis manquant, paiement à confirmer, SAS sur-capacité, inscription en conflit de groupe, échec d’email critique.

## 5. Système commun de listes « Google-like »

### Contrat `OperationsList`

Chaque liste événementielle réutilise une primitive de présentation commune, mais garde ses colonnes et règles métier dans son domaine.

| Élément | Requirement |
|---|---|
| Recherche | Debounce, requête côté serveur, champs explicitement autorisés par ressource. |
| Filtres | Filtres lisibles, combinables, réinitialisables et sérialisés par version. |
| Tri | Une colonne active au minimum ; tri stable avec identifiant comme dernier tie-breaker. |
| Pagination | Curseur opaque ; taille de page bornée ; jamais chargement intégral pour filtrer dans le navigateur. |
| Colonnes | Ordre et visibilité par vue, avec libellés métier stables. |
| Sélection | Une, plusieurs ou toutes les lignes correspondant au filtre ; le serveur reçoit le périmètre explicite. |
| Détail | Panneau latéral pour consulter et préparer une action ; une confirmation peut être modale, jamais une pile de modales. |
| États | Chargement, vide, erreur, données périmées et permission insuffisante distincts. |
| Accessibilité | Navigation clavier, focus restauré, libellés accessibles, statut non transmis par la seule couleur. |

### URL et confidentialité

**DECISION** — le contexte événement, les filtres non sensibles, le tri et la page/cursor peuvent être dans l’URL.

**REQUIREMENT** — la recherche libre pouvant contenir email, téléphone, nom ou identifiant personnel n’est ni intégrée à une URL partageable, ni stockée dans une vue partagée. Une vue partagée est référencée par son identifiant, jamais par une chaîne PII.

**OPEN QUESTION Q-04** — les vues enregistrées sont-elles privées, partagées dans l’organisation, ou les deux ? À décider avant la persistance. La table de vues devra stocker `schema_version` pour migrer les filtres ultérieurement.

### Densité et responsive

**PROPOSAL** — densité compacte par défaut sur desktop ; sur mobile, une liste devient une suite de cartes avec actions dans un menu explicite. Les couleurs servent à signaler, jamais à remplacer un texte ou un badge. Un prototype basse fidélité doit être validé avant le lot UI transversal.

## 6. Participants : fiche, listes et opérations

### Liste Participants

Colonnes initiales : participant, statut, billet, format, SAS/départ, groupe, paiement, documents, date d’inscription, dernière modification. Les colonnes « compte » et « commande » sont secondaires afin de ne pas confondre identité et droit de participer.

### Fiche participant

Le panneau latéral présente : identité et moyen de contact avec minimisation, statut d’inscription, billet/format, départ, groupe, paiement, documents, communications et historique métier. Il distingue explicitement :

- **compte réclamé** / **invité sans compte** / **compte introuvable** ;
- inscription individuelle / plusieurs inscriptions d’une même commande ;
- statut de transfert, annulation, remboursement, liste d’attente, si ces états existent dans le modèle.

**OPEN QUESTION Q-05** — la FDR ne crée pas de flux de création ou de fusion de comptes. Définir le parcours des invités et de la réclamation d’inscription avant d’exposer une action de compte.

### Commande : changer le billet

**DECISION** — une action « Changer le billet » cible une inscription, jamais une commande entière par défaut. Elle ouvre un aperçu serveur indiquant billet actuel/cible, format actuel/cible, SAS avant/après, groupe impacté et avertissements.

**REQUIREMENT** — validation Zod côté API, autorisation serveur, contrôle de cohérence événement/billet, transaction atomique, recalcul des compteurs SAS, journal métier, réponse idempotente et gestion claire du conflit de concurrence.

| Transition | Règle obligatoire |
|---|---|
| OPEN → OPEN | Conserver la SAS seulement si elle reste compatible ; sinon réassigner selon les règles OPEN et l’ancre de groupe. |
| RANKED → OPEN | Vérifier l’ancre de groupe ; sinon appliquer l’assignation OPEN officielle. |
| OPEN → RANKED | Réinitialiser les attributs de SAS OPEN et affecter le départ RANKED de FDR-0004. |
| RANKED → RANKED | Pas de SAS ; conserver les données compatibles uniquement. |

**OPEN QUESTION Q-06 — politique financière** : un changement de billet peut-il modifier le prix, déclencher un avoir, une collecte ou aucune opération comptable ? Tant qu’elle n’est pas acceptée, le premier lot autorise seulement les changements sans impact financier prouvable. Toute autre transition est bloquée, et une sous-FDR « correction financière » est requise.

### Commande : changer la SAS

Accessible uniquement pour une inscription OPEN. Le serveur renvoie la disponibilité au moment de la confirmation, pas seulement lors de l’ouverture du panneau.

**REQUIREMENT** — en cas de concurrence ou de SAS pleine, la commande échoue sans mutation et propose un rafraîchissement ; elle ne sur-réserve jamais une capacité.

**OPEN QUESTION Q-07** — définir la politique de position : trous conservés ou compactage, et exception éventuelle de capacité lorsqu’une ancre de groupe impose une synchronisation. FDR-0005 demeure prioritaire : pas de désynchronisation silencieuse d’un groupe.

### Commande : groupe

Les actions ajouter/retirer/déléguer/changer l’ancre montrent l’étendue exacte de la cascade avant confirmation. Une action d’ancre est une opération critique avec motif obligatoire et audit de chaque inscription affectée.

## 7. Format : contrat présent et migration future

**DECISION** — jusqu’à une décision séparée, la source de vérité fonctionnelle est `isOpenFormatTicket(ticket.name, race.name)` conformément à FDR-0004. Aucun écran ne doit introduire `race_format` comme vérité concurrente.

**PROPOSAL** — migrer ultérieurement vers une donnée structurée de format, probablement portée par le billet ou la course selon le modèle commercial retenu.

Cette migration nécessite, avant tout affichage ou écriture :

1. ADR/FDR définissant le propriétaire de la donnée ;
2. backfill reproductible depuis les libellés ;
3. rapport des ambiguïtés et conflit bloquant si libellé et donnée structurée divergent ;
4. période de double lecture instrumentée ;
5. bascule explicite, puis suppression de l’heuristique seulement après validation.

## 8. Architecture applicative et contrats d’API

### Direction

**DECISION** — l’UI appelle des endpoints de lecture dédiés et des commandes métier dédiées. Les routes valident l’entrée, délèguent au module métier (`src/lib` dans l’architecture actuelle), puis retournent des DTO stables ; elles ne contiennent pas la logique de transition.

Exemples de contrats cibles :

```text
GET  /api/admin/events/:eventId/participants?filter=...&sort=...&cursor=...
GET  /api/admin/events/:eventId/participants/:registrationId
POST /api/admin/events/:eventId/participants/:registrationId/change-ticket/preview
POST /api/admin/events/:eventId/participants/:registrationId/change-ticket/confirm
POST /api/admin/events/:eventId/participants/:registrationId/change-wave/preview
POST /api/admin/events/:eventId/participants/:registrationId/change-wave/confirm
```

Les routes précises ne sont pas une obligation de nommage ; le contrat important est la séparation lecture / aperçu / confirmation et un `command_id` idempotent pour les confirmations.

### Read models

**PROPOSAL** — créer des queries / vues de lecture spécifiques aux listes opérationnelles plutôt qu’un mega-join réutilisé pour toute l’interface. Si une vue SQL est ajoutée sur Postgres 15+, elle utilise `security_invoker = true`, ou reste inaccessible aux rôles client. Toute exposition est contrôlée par RLS et autorisation applicative.

**REQUIREMENT** — une page de liste définit : champs filtrables, triables, PII retournée, filtres `organization_id` et `event_id`, index à vérifier via plan de requête et limites de page.

### Objectifs de performance à valider en phase 1

| Mesure sur jeu réaliste de 10 000 inscriptions | Cible initiale |
|---|---|
| Réponse API de liste, p95 | < 800 ms hors réseau |
| Premier rendu de la liste, p95 | < 2 s sur poste desktop standard |
| Taille de page | 25–100 lignes, choix explicite |
| Données chargées côté client | une page, jamais la collection complète |

Ces seuils sont des critères de validation initiale, à réviser avec mesures réelles, pas des garanties d’infrastructure.

## 9. Autorisation, RLS, audit et confidentialité

### Principe

**DECISION** — une permission métier est évaluée côté serveur pour chaque commande. Être authentifié ne vaut pas autorisation administrateur.

**REQUIREMENT** — aucune nouvelle policy ne se limite à `auth.role() = 'authenticated'`; les policies ciblent le rôle SQL adéquat et un prédicat d’appartenance/organisation. Une fonction `SECURITY DEFINER` n’est jamais ajoutée pour contourner une erreur de permission ; si elle est exceptionnellement justifiée, elle est dans un schéma non exposé, sans `EXECUTE` public, avec vérification d’identité et revue dédiée.

### Phase 0 : audit obligatoire avant mutation de sécurité

Livrables :

1. inventaire live des tables exposées, RLS, grants, vues, fonctions, propriétaires et `EXECUTE` ;
2. résultat des advisors et inspection manuelle des chemins admin ;
3. tableau `finding / sévérité / ressource / impact / correction / test / rollback / owner` ;
4. validation écrite du périmètre de correction ;
5. sauvegarde/plan de rollback adapté à l’environnement avant migration.

Les constats issus du dump ou du code sont des pistes d’audit, pas des faits de production.

### Rôles

**OPEN QUESTION Q-08** — définir une matrice de permissions avant d’ajouter des rôles. Le lot initial peut conserver le rôle administrateur existant pour les commandes sensibles ; un rôle check-in ou opérateur événement est reporté tant que ses limites lecture/écriture ne sont pas acceptées.

### Journal métier

Chaque commande sensible produit un événement avec : type, acteur, cible, événement/organisation, avant/après minimisés, motif si requis, `command_id`, date, résultat et corrélation. Ne pas enregistrer mot de passe, token, payload HTTP complet, ni PII sans nécessité démontrée.

**OPEN QUESTION Q-09** — définir rétention, accès, export, suppression/masquage RGPD et propriétaire opérationnel des journaux. Une politique minimale acceptée est requise avant la mise en production d’un nouveau journal.

## 10. Mapping de l’existant vers la cible

| Élément actuel observé | Destination | Critère de sortie |
|---|---|---|
| `src/components/admin/AdminDashboard.tsx` | shell admin + routes événement | aucune navigation principale par tab local persistant seule |
| `src/components/admin/AdminSidebar.tsx` | navigation par domaines et contexte événement | labels canoniques, liens routables |
| `src/store/useAdminDashboardStore.ts` | état UI local non métier | contexte/filtre partageable hors PII dans la route ou la query |
| `registrations/RegistrationsSection.tsx` | liste Participants + panneau détail | pagination, filtres et commandes dédiées |
| `users/UsersSection.tsx` | espace Comptes global | aucune récupération massive pour filtrer côté client |
| `ui/AdminDataGrid.tsx` | primitive `OperationsList` ou retrait | contrat section 5 couvert et testé |
| `GET .../events/:id/waves` avec initialisation | lecture sans effet de bord + commande setup SAS | GET idempotent et sans `INSERT`/`UPDATE` |
| RPC / endpoints admin hétérogènes | contrats de lecture/commande versionnés | contrat live vérifié et tests de non-régression |

Chaque migration est incrémentale : conserver l’ancien chemin jusqu’à validation du nouveau, instrumenter l’usage, puis retirer l’ancien code dans un lot séparé.

## 11. Phases d’exécution et gates

### Phase 0 — preuve de l’état réel

- Audit RLS/fonctions/grants live, inventaire des routes, data model et volumes.
- Décisions Q-01, Q-02, Q-06, Q-07, Q-08 et Q-09 suffisamment tranchées pour le premier lot.
- Gate : aucune écriture de sécurité ou opération critique sans revue et rollback documentés.

### Phase 1 — fondations de lecture

- Routes événement + sélecteur + `OperationsList` sur une seule ressource pilote : Participants.
- Recherche, filtres, tri et cursor côté serveur ; aucune nouvelle mutation de billet/SAS.
- Gate : objectifs de performance, accessibilité clavier, non-régression des listes existantes.

### Phase 2 — consultation et audit minimal

- Panneau participant, détails sans PII superflue, événements d’audit pour les nouvelles commandes seulement.
- Gate : politiques de rétention et d’accès au journal acceptées.

### Phase 3 — commandes participantes sans impact financier

- Aperçu/confirmation de billet et SAS avec invariants FDR-0004/0005, idempotence et conflits.
- Gate : tests de transitions, capacité, groupe, autorisation et rollback fonctionnel.

### Phase 4 — autres domaines événementiels

- Groupes, SAS, offres, communications et équipe opérationnelle réemploient les primitives validées.

### Phase 5 — rôles, vues partagées et historique avancé

- Seulement après matrice de permissions, stockage des vues versionné et audits de sécurité.

### Phase 6 — décommissionnement

- Retrait des tabs, endpoints et composants devenus obsolètes après mesure d’usage et plan de rollback expiré.

## 12. Tests et critères d’acceptation

### Tests requis par commande

Chaque use-case a au minimum un succès et un échec, suivant la stratégie de tests du projet.

| Domaine | Cas minimaux |
|---|---|
| Autorisation | opérateur autorisé, utilisateur authentifié non autorisé, organisation différente |
| Changement de billet | chaque transition de format, billet d’un autre événement, commande idempotente, erreur de concurrence |
| SAS | place disponible, SAS pleine au commit, changement vers même SAS, compteur cohérent |
| Groupe | ancre présente, ancre absente, cascade OPEN, absence de mutation RANKED |
| Liste | filtre/tri/cursor déterministes, PII absente de l’URL, vues incompatibles versionnées |
| API | schéma Zod invalide, réponse d’erreur explicite, no-op sans écriture inattendue |
| Sécurité | RLS/grants/fonctions testés dans une base d’intégration, vérification que les GET n’écrivent pas |

### Definition of Done d’un lot

- règle métier extraite hors composant et testée ;
- validation Zod aux frontières ;
- tests unitaires, intégration et E2E proportionnés au risque, passants ;
- audit event documenté pour toute commande sensible ;
- revue des politiques RLS/RPC si le lot touche Supabase ;
- mesure de performance si le lot touche une liste ;
- documentation, contrat et mapping de retrait mis à jour ;
- build, lint et tests passants sans contournement.

## 13. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Réécriture admin trop large | phases, ressource pilote, retrait séparé |
| Régression OPEN/RANKED/groupe | FDR prioritaires, aperçu, transaction, tests de cascade |
| Escalade de privilèges Supabase | audit live, RLS, fonctions invoker par défaut, aucun rôle secret client |
| Liste lente ou incomplète | pagination cursor, index/plan vérifiés, SLO mesurés |
| PII dans URL/logs | exclusion explicite, journal minimisé, vues par identifiant |
| Ambiguïté financière | blocage des changements avec impact jusqu’à sous-FDR validée |
| Incohérence fonction SQL/documentation | contrat live testé et versionné avant consommation |

## 14. Documents dérivés nécessaires

| Document | Type | Déclencheur | Bloque |
|---|---|---|---|
| Matrice d’autorisation admin | ADR ou FDR | avant rôle opérateur/check-in | phase 5 et permissions nouvelles |
| Contrat read models / routage événement | ADR | avant généralisation de la ressource pilote | phase 4 |
| Correction financière de billet | FDR | avant toute transition tarifaire | phase 3 pour ces cas |
| Source structurée du format | ADR + plan migration | avant `race_format` | toute bascule de détection |
| Rétention et accès audit | FDR / politique légale | avant journal en production | phase 2 |
| Spécification visuelle compacte | guide design | avant généralisation UI | phase 4 |

## 15. Questions ouvertes à arbitrer

| ID | Question | Owner attendu | Échéance |
|---|---|---|---|
| Q-01 | règle de sélection et visibilité des événements | Produit | phase 0 |
| Q-02 | fuseau par événement ou Europe/Paris fixe | Produit + tech | phase 0 |
| Q-03 | critères, gravité et propriétaire de « À traiter » | Opérations | phase 1 |
| Q-04 | vues privées/partagées et gouvernance | Produit + sécurité | phase 5 |
| Q-05 | cycle de vie invité / compte / transfert | Produit | avant action compte |
| Q-06 | politique financière de changement de billet | Produit + finance | phase 3 |
| Q-07 | position/capacité SAS et exception groupe | Opérations + tech | phase 3 |
| Q-08 | matrice de rôles | Produit + sécurité | phase 0/5 |
| Q-09 | rétention et accès audit | Produit + légal | phase 2 |

## 16. Première tranche autorisable après validation phase 0

La première livraison doit rester volontairement petite : routes événement, sélecteur, liste Participants en lecture seule, cursor, recherche/tri/filtres non sensibles, panneau détail en lecture seule et tests de performance/autorisation. Elle ne comprend ni changement de billet, ni changement de SAS, ni rôle nouveau, ni migration de données métier.

