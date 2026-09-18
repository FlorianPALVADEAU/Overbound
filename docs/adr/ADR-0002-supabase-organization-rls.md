# ADR-0002 — Modèle d’organisation et RLS Supabase

- **Statut** : Accepted — architecture cible ; rollout non démarré
- **Date de décision initiale** : 2026-04-05
- **Mise à jour** : 2026-09-18
- **Portée** : isolation multi-organisation des comptes, événements et données opérationnelles
- **Références** : [FDR-0008](../fdr/FDR-0008-admin-operations-workspace.md), [FDR-0010](../fdr/FDR-0010-ticket-financial-correction-policy.md), [registre d’audit bloqué](../audit/admin-operation-audit-register-blocked.md), [data-and-rls](../security/data-and-rls.md)

> Cette ADR décrit une cible et un plan de migration réversible. Elle n'autorise pas encore une
> migration SQL. Le dump Supabase vérifié le 18 septembre 2026 ne contient ni organisation,
> ni membership, ni `organization_id`. Tant que l'owner initial des données et le contrat des rôles
> ne sont pas prouvés, toute valeur par défaut serait une hypothèse dangereuse.

## 1. Contexte et problème

Overbound doit passer d'un modèle actuellement mono-espace à un modèle dans lequel plusieurs
opérateurs peuvent gérer plusieurs événements sans voir ni modifier les données d'une autre
organisation. Le registre d'opérations admin et les confirmations `NO_MOVEMENT` de FDR-0010
nécessitent cette portée avant toute activation.

L'autorisation actuelle repose principalement sur `profiles.role = 'admin'`. Cette information
identifie éventuellement un rôle global, mais ne prouve ni l'appartenance à une organisation, ni le
droit sur un événement, une commande ou une inscription. Une policy `TO authenticated` ou une
policy basée uniquement sur le rôle serait donc insuffisante.

### Preuves disponibles

- Le dump distant du projet lié ne contient pas `organizations`, `organization_memberships` ni
  de colonne `organization_id` dans le périmètre métier.
- `profiles.role` existe, mais aucun rôle SQL ou contrat `finance` n'est versionné.
- Les policies admin existantes ne portent pas de filtre d'organisation.
- `admin_request_logs` ne peut pas devenir le registre métier : grants trop larges et sémantique
  de log HTTP différente d'un journal append-only.
- Les fonctions privilégiées et leurs grants réels doivent être vérifiés avant toute policy ou RPC.

Ces éléments sont des faits du contrat distant inspecté, pas une invitation à fabriquer un
backfill. Le code de production peut avoir des relations implicites non représentées dans Git ;
elles doivent être extraites et rapprochées avant l'étape de données.

## 2. Décision d'architecture cible

### 2.1 Entités

```text
organizations
  └── organization_memberships ── auth.users / profiles
        └── accès aux événements et données métier

organizations ── events ── event_waves
              ├─ registrations ── tickets
              ├─ orders
              └─ groups ── group_members
```

`organizations` est la racine de tenancy. `organization_memberships` est la source de vérité de
l'appartenance et du rôle opérationnel. Une identité peut avoir plusieurs memberships ; un rôle
global stocké dans `profiles.role` ne doit donc pas être traité comme une membership.

### 2.2 Rôle de `profiles`

Le profil représente l'identité applicative, pas l'appartenance à un tenant. Par défaut, la cible
est donc :

- `profiles` reste une table d'identité globale ;
- les rôles d'accès à une organisation vivent dans `organization_memberships` ;
- `profiles.organization_id` **n'est pas canonique** : le modèle V1 assume une relation plusieurs-à-
  plusieurs via `organization_memberships`.

Un raccourci `profiles.organization_id` n'est pas prévu. Toute évolution vers un modèle un-à-un
devra faire l'objet d'un ADR séparé et préserver la source de vérité des memberships.

### 2.3 Rôles minimaux

| Rôle | Portée initiale | Droits V1 |
|---|---|---|
| `owner` | organisation | administrer membres et paramètres sensibles |
| `admin` | organisation | gérer événements, participants et commandes autorisées |
| `finance` | organisation | approuver les exceptions financières selon FDR-0010 |
| `operator` | événement/organisation | lecture et opérations explicitement accordées ; hors périmètre initial |

Les rôles ne sont pas préremplis pour les comptes existants. Le bootstrap de l'owner est une
décision explicite, traçable et réversible, jamais « le premier profil trouvé ».

## 3. Périmètre des colonnes et de l'ownership

Le tableau décrit la cible et la méthode de preuve. Il ne constitue pas encore du DDL.

| Table | `organization_id` cible | Source de backfill privilégiée | Invariant après contract |
|---|---|---|---|
| `organizations` | clé primaire | création d'un tenant approuvé | slug/nom et statut contrôlés |
| `organization_memberships` | obligatoire | relation explicitement validée entre profil et organisation | un membership actif par paire ; rôle allowlisté |
| `events` | obligatoire, direct | owner déclaré de l'événement ou mapping validé | événement et ressources du même tenant |
| `registrations` | obligatoire, direct | organisation de l'événement parent | égale à `events.organization_id` |
| `orders` | obligatoire, direct | organisation de l'événement/registration référencé | une commande ne traverse pas les tenants |
| `tickets` | obligatoire, direct ou catalogue approuvé | relation événement/catalogue à déterminer | billet sélectionnable dans le tenant de l'inscription |
| `event_waves` | obligatoire, direct | organisation de l'événement parent | SAS jamais hors tenant |
| `groups` | obligatoire, direct | organisation de l'événement parent | groupe et ancre du même tenant |
| `group_members` | obligatoire, direct ou dérivé | organisation du groupe parent | cohérence groupe/événement |
| `profiles` | aucune colonne canonique | aucune valeur automatique | identité globale ; accès exclusivement via memberships |

Les colonnes directes sur les tables opérationnelles permettent des policies et index simples. Elles
doivent toutefois être vérifiées par des contraintes ou contrôles transactionnels pour éviter deux
organisations différentes dans une même chaîne de relations.

## 4. Plan expand / backfill / verify / contract

La migration doit rester compatible avec les anciennes versions. Chaque phase a une sortie
mesurable et ne déclenche pas implicitement la suivante.

### Phase 0 — contrat et inventaire, avant DDL

1. Capturer tables, colonnes, contraintes, propriétaires, RLS, policies, grants, fonctions, vues et
   triggers en lecture seule.
2. Cartographier tous les lecteurs/writers des tables ci-dessus, y compris RPC et scripts historiques.
3. Définir l'owner initial, le fuseau et le périmètre du tenant de bootstrap, avec approbation écrite.
4. Décider si `tickets` est catalogue global, organisationnel ou événementiel, et si une commande
   peut contenir plusieurs événements.
5. Appliquer la décision de membership multiple : un profil peut appartenir à plusieurs
   organisations ; ne pas ajouter `profiles.organization_id` comme source de vérité.
6. Capturer sauvegarde, environnement de test et plan de rollback.

**Gate :** inventaire signé, owner prouvé, mapping complet, contradictions listées. Sinon, arrêt sans
migration.

### Phase 1 — expand, sans enforcement destructif

Créer après le gate 0 :

1. `organizations` (id stable, nom, slug, statut, timezone, timestamps).
2. `organization_memberships` (organisation, profil/utilisateur, rôle, statut, timestamps et
   unicité adaptée au contrat Auth).
3. Colonnes `organization_id` **nullable** sur `events`, `registrations`, `orders`, `tickets`,
   `event_waves`, `groups` et `group_members`.
4. Index dédiés aux filtres/RLS, avec plans vérifiés sur volume réaliste.
5. FKs vérifiables (`NOT VALID` si approprié), validées après backfill ; aucun `DEFAULT` arbitraire.
6. Policies de transition sans retirer l'ancien chemin avant convergence des writers.

Les anciennes et nouvelles versions peuvent coexister. Une valeur `organization_id` fournie par le
client n'est jamais une preuve d'appartenance.

### Phase 2 — backfill contrôlé et observable

Le backfill est un job versionné, par lots, rejouable et sans suppression. Il produit par table :
total, remplis, ambigus, orphelins, incohérences et erreurs.

Ordre :

1. créer le tenant de bootstrap seulement si son owner et son périmètre sont approuvés ;
2. créer les memberships explicitement validées ;
3. remplir `events` ;
4. propager vers `event_waves`, `groups`, `registrations`, `orders` et `group_members` ;
5. remplir `tickets` selon le contrat catalogue validé, jamais par simple égalité de nom ;
6. traiter les memberships de `profiles` selon la relation plusieurs-à-plusieurs validée ; aucune
   valeur n'est déduite automatiquement depuis le profil.

Règles : une relation parent doit être unique et cohérente ; toute ligne sans owner démontré va en
quarantaine/reporting ; les ambiguïtés sont bloquantes ; aucune ligne n'est supprimée ou fusionnée ;
chaque batch possède un checkpoint et ne réécrit pas une ligne déjà validée.

### Phase 3 — verify, avant enforcement

Vérifier : zéro `NULL` requis, zéro FK orpheline, égalité parent/enfant, aucun groupe croisé,
aucun ticket hors tenant, cardinalités conservées, writers convergents, plans acceptables et
rejouabilité concurrente du job.

#### Matrice RLS minimale

| Sujet | Même org admin | Même org finance | Même org operator | Autre org admin | Auth sans membership | Anon |
|---|---:|---:|---:|---:|---:|---:|
| lire événements autorisés | oui | oui | selon périmètre | non | non | non |
| lire participants/inscriptions | oui | selon besoin | non par défaut | non | non | non |
| lire opérations/audit | oui | oui | non | non | non | non |
| confirmer opération admin | oui | selon FDR | non | non | non | non |
| gérer memberships | owner seulement | non | non | non | non | non |
| lire une ligne avec UUID d'un autre tenant | non | non | non | non | non | non |

Les tests couvrent tables, RPC, vues, Data API et chemins serveur, y compris les erreurs d'écriture.
Une UI correcte n'est pas une preuve RLS.

**Gate :** rapport sans ambiguïté, matrice RLS verte, grants audités et parcours admin/finance
validé. Sinon, retour à expand/backfill.

### Phase 4 — contract, après preuve

1. rendre `organization_id NOT NULL` sur les tables requises ;
2. valider FKs et contraintes parent/enfant ;
3. activer les policies finales, supprimer fallbacks globaux et grants anonymes ;
4. converger tous les writers et désactiver le double-écriture ;
5. activer le registre d'opérations avec idempotence et audit ;
6. seulement ensuite activer les confirmations `NO_MOVEMENT`.

Le retrait d'une colonne, d'un RPC ou d'un chemin legacy est une migration distincte, observée et
réversible. Il ne fait pas partie du premier contract.

## 5. Compatibilité, rollback et incidents

Pendant expand/backfill/verify, les nouvelles lectures refusent les lignes sensibles sans
organisation au lieu de les attribuer silencieusement. Les nouvelles écritures échouent avec un
code explicite ou passent par un adaptateur serveur temporaire audité.

- avant backfill : retirer les objets expand seulement dans un environnement sans dépendants ;
- pendant backfill : arrêter au checkpoint, sans annulation massive non prouvée ;
- après verify : revenir aux writers legacy uniquement si cela ne réouvre pas l'accès cross-tenant ;
- après contract : pas de rollback destructif automatique ; utiliser le runbook et le backup validés.

Tout échec partiel est observable par batch, code, nombre de lignes et checkpoint. Un timeout ne
prouve jamais qu'un rollback a réussi.

## 6. Décisions encore requises

1. Qui est l'owner initial et quel périmètre lui est attribué ?
2. `tickets` est-il global, organisationnel ou attaché à un événement ?
3. Une commande peut-elle contenir plusieurs événements ou organisations ?
4. Quels rôles sont provisionnés et comment sont-ils révoqués ?
5. Comment rattacher les participants invités sans compte ?
6. Quelle rétention et quel accès RGPD pour les snapshots d'audit ?
7. Quel environnement permet d'appliquer, tester et restaurer les migrations ?

Ces questions bloquent le DDL et le registre d'audit, mais pas les previews en lecture seule.

## 7. Critères d'acceptation

- contrat live exporté et daté ;
- owner initial et relations ticket/commande/événement prouvés ;
- backfill rejouable avec rapport sans ambiguïté ;
- tests RLS same-org, cross-org, sans membership et anon sur tables et RPC ;
- phases séparées et observables avec rollback documenté ;
- confirmation admin désactivée tant que le gate contract n'est pas validé.

## 8. Conséquences

Le coût initial augmente (inventaire, backfill, tests RLS et double lecture), mais l'isolation ne
repose plus sur un rôle global. Le modèle devient compatible avec plusieurs événements et fournit la
frontière nécessaire à l'audit/idempotence avant toute confirmation admin.
