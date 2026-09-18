# Audit de baseline Supabase — historique des migrations

- **Statut** : BLOCKED — baseline distante non régénérée dans ce lot
- **Date** : 2026-09-18
- **Projet lié** : `lffqqthmcimksgbcbzwb`
- **CLI** : Supabase `2.84.2`
- **Périmètre** : vérifier l'historique distant et produire un dump `public` sans modifier la base

## Résultat

Aucune commande exécutée dans ce worktree n'a modifié la base distante et aucun fichier de migration
n'a été généré par `supabase db pull`.

Les commandes suivantes ont été tentées :

```text
supabase migration list --linked
supabase db pull --linked --schema public --yes
supabase db push --linked --dry-run
```

Elles échouent toutes avant connexion avec :

```text
Access token not provided. Supply an access token by running supabase login
or setting the SUPABASE_ACCESS_TOKEN environment variable.
```

La vérification locale n'est pas disponible non plus : Docker/Postgres n'est pas joignable sur
`127.0.0.1:54322`. Aucun fallback par mot de passe n'est inventé, car le pooler seul ne permettrait
pas de prouver l'historique Supabase (`supabase_migrations.schema_migrations`) de façon sûre.

## Preuves antérieures à conserver

Le commit `02a8038` documente une exécution antérieure, en lecture seule, de la CLI liée :

- `supabase db push --linked --dry-run` proposait de rejouer toutes les migrations locales,
  de `20260416` jusqu'à la fondation tenant ;
- `supabase migration list --linked` laissait la colonne `Remote` vide pour ces versions ;
- `supabase start` échouait sur la migration historique
  `20260416_ambassador_promotional_codes.sql`, qui référence `ambassadors` avant son socle local.

Cette preuve est suffisante pour maintenir le gate « ne pas pousser ». Elle ne constitue pas une
nouvelle lecture distante et ne doit pas être présentée comme une réconciliation terminée.

## Procédure sûre de réconciliation

À exécuter par un opérateur authentifié, depuis un checkout propre, avec le même project ref :

```bash
supabase login
supabase link --project-ref lffqqthmcimksgbcbzwb
supabase migration list --linked
supabase db pull --linked --schema public --yes
git diff -- supabase/migrations
```

Le résultat doit être sauvegardé hors des données utilisateur et comparé aux migrations du dépôt.
Si `db pull` génère un snapshot de baseline, il faut d'abord vérifier :

1. que le fichier n'est pas une répétition d'un schéma déjà versionné ;
2. que les objets absents du dépôt sont identifiés comme drift historique, et non comme migration à
   rejouer ;
3. que les versions effectivement présentes dans `supabase_migrations.schema_migrations` sont
   comparées aux noms/timestamps locaux ;
4. que les migrations manquantes sont classées en `appliquée mais non versionnée`, `versionnée mais
   non appliquée` ou `divergente` ;
5. qu'aucun `db push`, `--include-all`, `repair` ou suppression d'historique n'est exécuté avant
   approbation d'un plan de réconciliation et d'un rollback.

La commande suivante reste interdite tant que la classification n'est pas approuvée :

```bash
supabase db push --linked --include-all
```

## Suite recommandée

1. Ré-authentifier la CLI avec un compte owner/maintainer du projet ciblé.
2. Capturer `migration list --linked` et `db pull --linked --schema public --yes` sans données.
3. Comparer le baseline à la liste locale et aux dépendances historiques, notamment
   `ambassadors`, `events`, `profiles` et les RPC admin.
4. Produire un tableau de réconciliation signé : version, état distant, état Git, action proposée,
   risque et rollback.
5. Seulement après validation, décider si la fondation tenant
   `20260918155059_admin_tenant_foundation.sql` doit être appliquée seule ou précédée d'une
   réparation de l'historique.

La migration tenant et le registre d'opérations restent donc non déployés. Ce lot ne contient aucun
DDL supplémentaire et ne change aucun état Supabase.
