# Migration — fondation tenant admin

Migration SQL : `20260918155059_admin_tenant_foundation.sql`

## Objectif

Cette migration implémente uniquement la phase **expand** définie par
[ADR-0002](../adr/ADR-0002-supabase-organization-rls.md). Elle prépare une frontière
d'organisation sans attribuer de données historiques à un propriétaire non validé.

Elle crée :

- `public.organizations` : racine du tenant, avec slug unique, statut et fuseau horaire ;
- `public.organization_memberships` : relation plusieurs-à-plusieurs entre une organisation et
  un profil, avec les rôles V1 `owner`, `admin` et `finance`.

Elle ajoute une colonne `organization_id` nullable et un index aux tables métier suivantes :

`events`, `registrations`, `orders`, `tickets`, `event_waves`, `groups`, `group_members`.

## Sécurité transitoire

- RLS est activé sur les deux nouvelles tables.
- `anon` ne reçoit aucun privilège.
- Les utilisateurs authentifiés ne peuvent lire que leurs propres memberships actives.
- La lecture d'une organisation est limitée aux membres actifs de cette organisation.
- Aucune policy d'écriture n'est créée : le bootstrap owner et la gestion des memberships sont
  volontairement bloqués jusqu'à validation du contrat d'autorisation.
- Les tables métier existantes ne reçoivent pas de policy tenant dans cette migration : tant que
  leur backfill et la convergence de leurs writers ne sont pas prouvés, une policy partielle
  pourrait donner une fausse impression d'isolation.

## Ce qui n'est volontairement pas fait

- aucun backfill ;
- aucun `DEFAULT` sur les nouvelles colonnes métier ;
- aucune colonne rendue `NOT NULL` ;
- aucune clé étrangère `organization_id` ajoutée avant le backfill validé ;
- aucune modification des RPC, triggers ou de `20260915_admin_change_registration_ticket.sql` ;
- aucun owner initial créé automatiquement ;
- aucune migration du registre d'audit ou activation de confirmation financière.

## Gates avant la phase suivante

La migration ne doit pas être suivie d'un backfill avant que les éléments suivants soient
explicitement validés :

1. owner initial et périmètre de son organisation ;
2. relation live entre `profiles` et `auth.users` ;
3. inventaire des commandes multi-événements et règles de quarantaine ;
4. mapping déterministe événement → organisation ;
5. contrat de provisioning/révocation des memberships ;
6. tests RLS same-org, cross-org, sans membership et anonymous ;
7. sauvegarde/restauration testée et rapport de volume avant backfill.

Après backfill, un gate séparé doit confirmer zéro ambiguïté, zéro orphelin et la cohérence
parent/enfant avant d'ajouter des contraintes ou de rendre les colonnes obligatoires.

## Rollback

Le rollback n'est pas exécuté automatiquement. Avant toute suppression, vérifier qu'aucun code,
vue, policy, index de requête ou migration ultérieure ne dépend des objets.

Dans un environnement sans dépendants, exécuter les instructions commentées en fin de migration,
dans cet ordre :

1. supprimer les index `organization_id` ;
2. supprimer les colonnes nullable des sept tables métier ;
3. supprimer les tables `organization_memberships`, puis `organizations`.

Ce rollback ne doit jamais être utilisé après un backfill ou une activation de policies finales
sans restaurer d'abord les dépendances dans un environnement de restauration vérifié. Le rollback
ne supprime aucune donnée métier dans cette phase, mais il supprimerait les memberships créées
manuellement : il est donc destructif pour les nouvelles données et nécessite un backup/export.

## Vérification

Avant merge :

- `git diff --check` ;
- relecture SQL contre le dump live daté ;
- application sur une base de test vide et vérification des policies/grants ;
- test d'accès `anon`, utilisateur sans membership et membre actif ;
- vérification que les RPC historiques et la migration du 15 septembre restent inchangées.

## État du déploiement — 2026-09-18

La CLI Supabase `2.84.2` a exécuté les contrôles suivants en lecture seule :

- `supabase db push --linked --dry-run` propose de rejouer toutes les migrations locales, de
  `20260416` jusqu'à cette migration, car aucune n'est reconnue comme appliquée dans l'historique
  distant affiché par la CLI ;
- `supabase migration list --linked` laisse la colonne `Remote` vide pour ces versions ;
- `supabase start` local ne peut pas fournir une validation indépendante : l'initialisation échoue
  sur une migration historique qui référence `ambassadors` avant son socle local.

**GATE BLOQUANT** — ne pas exécuter `supabase db push`, même avec `--include-all`, tant que
l'historique distant n'a pas été réconcilié et qu'un plan de déploiement des migrations historiques
n'a pas été approuvé. La migration tenant est committée comme artefact expand, mais elle n'est pas
déployée et ne doit pas être considérée comme active.
