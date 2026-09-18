# Registre d’opérations admin — migration bloquée par contrat non prouvé

- **Statut** : BLOCKED — aucune migration SQL exécutable dans ce lot
- **Date** : 2026-09-17
- **Périmètre** : registre append-only pour les confirmations administratives sans mouvement financier
- **Références** : [FDR-0010](../fdr/FDR-0010-ticket-financial-correction-policy.md), [gap de confirmation](./admin-no-movement-confirmation-gap.md), [audit sécurité phase 0](./admin-operations-phase-0-security-audit.md)

> Ce document est volontairement bloquant. Une migration qui inventerait une organisation, une
> relation d'appartenance ou un rôle finance serait plus dangereuse qu'une confirmation désactivée.
> Le lot suivant pourra transformer le contrat proposé ci-dessous en migration uniquement après les
> gates listées en section 7.

## 1. Vérifications effectuées

Le checkout contient bien Supabase CLI `2.84.2` et la commande `supabase --help` a été consultée avant
toute décision de migration. `supabase status` ne peut pas vérifier une base locale : le daemon Docker
n'est pas disponible dans l'environnement de travail. Aucun changement de schéma n'a été appliqué.

Les vérifications statiques du dépôt montrent :

- aucune migration versionnée ne crée une table `organizations`, `organization_memberships` ou un
  équivalent de tenant ;
- aucune colonne `organization_id` n'est prouvée sur `events`, `registrations`, `profiles`, `orders`,
  `tickets`, `event_waves`, `groups` ou `group_members` ;
- l'autorisation admin actuelle repose sur `profiles.role = 'admin'` dans
  `src/lib/auth/requireAdmin.ts` ; aucun rôle `finance`, aucune table de permissions et aucun lien
  organisation→acteur n'est établi dans le dépôt ;
- les migrations ne contiennent pas le catalogue complet des tables et RPC consommées par les routes
  admin ; les grants et le mode `SECURITY DEFINER` réellement déployés restent donc à vérifier ;
- `20260915_admin_change_registration_ticket.sql` est une migration non approuvée pour cette feature
  et n'a pas été modifiée.

Ces constats ne prouvent pas l'absence de ces objets dans Supabase production. Ils prouvent seulement
qu'ils ne peuvent pas être déduits de Git. Une migration RLS ou une clé étrangère fondée sur ces objets
serait donc spéculative.

### Vérification distante en lecture seule — 2026-09-18

Un dump de schéma du projet Supabase lié (`lffqqthmcimksgbcbzwb`) a été réalisé avec la CLI
Supabase `2.84.2`. Il confirme les points suivants dans la base distante :

- aucune table ou colonne `organization`/`organization_id` n'est présente dans le schéma `public` ;
- `profiles` contient un champ `role`, mais aucune valeur ou table `finance` n'est définie par le
  contrat SQL exporté ;
- les policies admin existantes testent directement `profiles.role = 'admin'`, sans portée par
  organisation ;
- `admin_request_logs` existe, mais reçoit des `GRANT ALL` pour `anon` et `authenticated`, alors que
  sa seule policy de lecture exportée vise `supabase_admin` ; cette table ne peut donc pas être
  réutilisée telle quelle comme registre métier append-only ;
- le démarrage local Supabase échoue avant initialisation complète sur la migration historique
  `20260416_ambassador_promotional_codes.sql`, qui référence `ambassadors` avant que le socle local
  correspondant soit disponible. Cette migration est hors périmètre et n'a pas été modifiée.

La preuve distante renforce donc le blocage : avant le registre d'audit, il faut décider et migrer le
modèle d'organisation/permissions, puis réduire les grants de toute nouvelle table à un chemin serveur
contrôlé. Aucun secret, contenu de données ou dump complet n'est commité ; seul ce constat de contrat
est conservé.

## 2. Pourquoi aucune migration n'est livrée

Le registre demandé doit porter `organization_id` et ses policies doivent distinguer au minimum :

1. l'acteur authentifié ;
2. son appartenance à l'organisation ;
3. son rôle métier (`admin` ou `finance`) ;
4. son droit sur l'événement et l'inscription ciblés.

Le modèle actuel ne permet de prouver aucun des points 2 à 4 au niveau SQL. Une policy du type
`TO authenticated` serait insuffisante et exposerait potentiellement toutes les opérations. Une
policy basée uniquement sur `profiles.role` ne fournirait pas de portée organisationnelle. Ajouter
une colonne nullable ou une valeur par défaut arbitraire ne corrigerait pas ce problème et rendrait
l'idempotence inter-organisation ambiguë.

Le registre doit également être append-only. RLS seule ne suffit pas à empêcher un propriétaire de
table ou un rôle privilégié de modifier/supprimer une ligne. Il faut prouver le rôle propriétaire, les
ACL, le mécanisme de confirmation et, si nécessaire, un trigger de refus ou une fonction interne
strictement contrôlée. Ces éléments ne sont pas disponibles dans le checkout.

## 3. Contrat de table proposé (design, non exécutable)

Le nom proposé est `private.admin_operation_commands` afin de ne pas exposer directement le registre
au Data API. Le schéma `private` doit lui-même être créé et protégé après vérification de la
configuration Supabase cible.

Colonnes minimales proposées :

| Colonne | Règle |
|---|---|
| `id uuid` | clé primaire, générée côté base |
| `organization_id uuid` | obligatoire, FK vers le modèle d'organisation validé |
| `event_id uuid` | obligatoire, FK vers `events`, même organisation vérifiée par le use-case |
| `registration_id uuid` | obligatoire pour ticket/SAS, FK vers `registrations` |
| `command_id uuid` | clé d'idempotence fournie par le client, unique avec `organization_id` |
| `preview_id uuid` | preview serveur à durée limitée |
| `expected_version text` | version opaque revalidée au moment de la confirmation |
| `operation_kind text` | enum/check fermé : `CHANGE_TICKET`, `CHANGE_WAVE` |
| `policy_variant text` | V1 : `NO_MOVEMENT` ou `NO_MOVEMENT_EXCEPTION` |
| `status text` | V1 : `PENDING`, `SUCCEEDED`, `FAILED`, `REJECTED` |
| `reason_code text` | valeur allowlistée et obligatoire |
| `reason_note text` | note obligatoire pour l'exception, longueur bornée |
| `requested_by uuid` | acteur `auth.users`, snapshot d'identité minimal si nécessaire |
| `approver_id uuid` | obligatoire pour `NO_MOVEMENT_EXCEPTION` |
| `approver_role text` | `admin` ou `finance`, déterminé côté serveur |
| `request_hash text` | hash du payload canonique, utilisé pour détecter le rejeu divergent |
| `before_snapshot jsonb` | champs métier minimisés avant mutation, jamais de secret/CB |
| `after_snapshot jsonb` | champs métier minimisés après mutation, nullable tant que pending |
| `external_reference text` | réservé aux futurs prestataires, jamais un secret |
| `created_at timestamptz` | UTC, immuable |
| `completed_at timestamptz` | UTC, renseigné à la clôture |

Contraintes prévues :

- `UNIQUE (organization_id, command_id)` ;
- `CHECK` sur les variantes, états et types d'opération ;
- `CHECK` imposant `approver_id`, `approver_role` et `reason_note` pour
  `NO_MOVEMENT_EXCEPTION` ;
- `CHECK` interdisant les variantes financières hors V1 ;
- index `(organization_id, created_at desc)`, `(organization_id, event_id, created_at desc)` et
  `(organization_id, registration_id, created_at desc)` ;
- aucun `updated_at` mutable : chaque transition doit créer un événement append-only ou être réalisée
  dans une fonction transactionnelle qui conserve la preuve de transition.

La commande qui réutilise le même `command_id` doit retourner le résultat existant uniquement si le
`request_hash` est identique. Un hash différent doit produire un conflit explicite, sans mutation.

## 4. RLS et grants attendus après preuve du modèle

Ces policies sont des exigences de conception, pas du SQL à déployer immédiatement :

- aucune permission `anon` ;
- lecture pour un admin/finance appartenant à la même organisation ;
- insertion uniquement via une fonction/use-case serveur contrôlé, jamais une écriture arbitraire de
  ligne depuis le navigateur ;
- aucune permission directe `UPDATE` ou `DELETE` pour `anon`/`authenticated` ;
- `service_role` non utilisé dans le navigateur et non présenté comme substitut à une policy ;
- si une fonction privilégiée est nécessaire, elle doit être dans un schéma non exposé, avoir un
  `search_path` fixé, des grants explicites et une revue de son corps ;
- l'accès à `before_snapshot`/`after_snapshot` doit être limité aux rôles opérationnels autorisés ;
- les tables métier et les opérations doivent vérifier la même organisation dans la transaction, pas
  seulement dans l'UI.

La définition exacte des policies dépend du nom réel de la table d'appartenance et de la manière dont
les rôles sont stockés. Elle ne doit pas être remplacée par `auth.uid() = requested_by` : un admin doit
pouvoir consulter les opérations de son organisation, tandis qu'un acteur hors organisation doit être
refusé.

## 5. Rollback prévu

Lorsque le contrat live sera prouvé, la migration devra être générée via `supabase migration new`
avec :

1. création du schéma privé et de la table ;
2. activation RLS et grants minimaux ;
3. contraintes et index ;
4. éventuellement trigger de refus `UPDATE`/`DELETE` si l'append-only ne peut pas être garanti par
   les ACL ;
5. commentaire de rollback documenté.

Le rollback ne devra jamais supprimer les audits produits en production sans politique de rétention
validée. Il pourra retirer les policies/table uniquement dans un environnement sans commandes, ou
marquer la table comme obsolète et conserver les données selon la politique légale. Le lot de
confirmation restera désactivé tant que la stratégie de rollback n'est pas testée.

## 6. Ce qui reste explicitement désactivé

- aucune activation de `POST .../change-ticket/confirm` ;
- aucune activation de `POST .../change-wave/confirm` ;
- aucune réutilisation des RPC de `20260915_admin_change_registration_ticket.sql` comme audit ;
- aucune insertion dans `admin_request_logs` comme substitut au registre métier ;
- aucun stockage de payload de paiement, numéro de carte, token, email ou IP dans le snapshot ;
- aucun mouvement financier, avoir, remboursement ou collecte.

## 7. Gates nécessaires avant création de la migration

Le prochain agent doit obtenir et consigner, en lecture seule :

1. project ref, environnement et owner Supabase ;
2. `pg_catalog` des tables, colonnes, contraintes, owners, RLS, policies, grants et rôles ;
3. présence et définition exacte de l'organisation/tenant et de la relation acteur→organisation ;
4. valeur et provenance des rôles (`profiles.role`, claims ou table de permissions) ;
5. définition des événements et inscriptions, notamment leurs clés d'organisation ;
6. fonctions RPC appelées et ACL (`pg_get_functiondef`, `prosecdef`, `search_path`, grants) ;
7. tests d'intégration avec anon, authenticated non-admin, admin, finance et service ;
8. stratégie de rétention et accès RGPD pour les snapshots ;
9. présence de Docker ou connexion à un environnement d'intégration pour appliquer la migration et
   tester son rollback.

Une fois ces preuves disponibles, il faudra mettre à jour ce document avec les noms réels, écrire la
migration via `supabase migration new admin_operation_commands`, lancer les advisors, tester
concurrence/idempotence/RLS et faire relire le diff avant d'activer la confirmation.

## 8. Résultat du lot

Ce lot livre une décision de sécurité et un contrat de conception réutilisable. Il ne livre pas de
DDL volontairement incomplet. Le blocage est attendu et cohérent avec l'audit phase 0 : activer une
confirmation sans organisation, rôle et ACL prouvés créerait une fausse impression de traçabilité et
pourrait autoriser une lecture ou une écriture inter-organisation.
