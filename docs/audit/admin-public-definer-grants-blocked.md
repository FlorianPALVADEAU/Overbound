# Fonctions `SECURITY DEFINER` publiques — remédiation bloquée

- **Statut** : BLOCKED — aucune migration SQL exécutable dans ce lot
- **Date** : 2026-09-18
- **Périmètre** : `public.admin_overview_safe` et `public.get_registrations_with_filters`
- **Références** : [audit phase 0](./admin-operations-phase-0-security-audit.md), [registre d’opérations bloqué](./admin-operation-audit-register-blocked.md)

## Décision

La migration de restriction des grants n’est pas livrée. Le dépôt ne contient pas les définitions
SQL ni les signatures complètes de ces fonctions. Le dump live mentionné dans l’audit n’est pas
présent dans ce checkout et la connexion Supabase n’est pas disponible (`supabase db dump --linked`
échoue faute de `SUPABASE_ACCESS_TOKEN`). Une commande `REVOKE` avec une signature inventée peut
échouer en production, cibler la mauvaise surcharge, ou casser un consommateur légitime sans fournir
de rollback fiable.

Le finding reste toutefois prioritaire : l’advisor live indique que ces fonctions publiques
`SECURITY DEFINER` sont exécutables par `anon` et `authenticated`. Une fonction privilégiée dans
`public` ne doit pas conserver l’ACL par défaut `PUBLIC`.

## Preuves actuellement disponibles

| Fonction | Preuve | Manque bloquant |
|---|---|---|
| `public.admin_overview_safe` | présente dans les résultats d’advisor consignés le 2026-09-18 | liste exacte des arguments, propriétaire, `prosecdef`, `search_path`, ACL, dépendances et appelants |
| `public.get_registrations_with_filters` | appelée par `src/app/api/admin/registrations/route.ts` et signalée par l’advisor | signature exacte/surcharges, contrat de retour, ACL complète, appelants non-admin et besoin éventuel d’un rôle SQL dédié |

Les signatures ne doivent pas être déduites du TypeScript : l’application envoie une enveloppe
`args`, mais cela ne prouve ni les types PostgreSQL ni l’existence d’une surcharge unique.

## Collecte obligatoire, en lecture seule

À exécuter par l’owner Supabase dans l’environnement ciblé, puis à conserver hors des données
utilisateur :

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosecdef,
  p.proconfig,
  pg_get_userbyid(p.proowner) as owner,
  coalesce(pg_get_functiondef(p.oid), '') as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_overview_safe', 'get_registrations_with_filters');
```

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  coalesce(p.proacl, acldefault('f', p.proowner)) as function_acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_overview_safe', 'get_registrations_with_filters');
```

Avant toute modification, inventorier les appelants applicatifs, les rôles SQL utilisés par le
serveur, et les tests anon/authenticated/admin. Vérifier également si `admin_overview_safe` contient
déjà un contrôle d’identité et si les deux fonctions utilisent un `search_path` fixé. Le fait
qu’une route Next.js appelle une RPC ne justifie pas un grant `authenticated` : la route doit
utiliser un chemin serveur contrôlé et une ACL minimale.

## Migration candidate — uniquement après preuve

Une fois chaque signature confirmée, générer le fichier avec `supabase migration new` puis écrire
une instruction par surcharge, par exemple :

```sql
revoke execute on function public.admin_overview_safe(<types-confirmed>) from public;
revoke execute on function public.admin_overview_safe(<types-confirmed>) from anon;
revoke execute on function public.admin_overview_safe(<types-confirmed>) from authenticated;

revoke execute on function public.get_registrations_with_filters(<types-confirmed>) from public;
revoke execute on function public.get_registrations_with_filters(<types-confirmed>) from anon;
revoke execute on function public.get_registrations_with_filters(<types-confirmed>) from authenticated;
```

Les marqueurs `<types-confirmed>` sont intentionnels et rendent ce document non exécutable. Ils ne
doivent jamais être committés dans une migration. Le rôle de remplacement doit être choisi après
lecture des call paths : idéalement aucun accès direct Data API, et seulement un rôle serveur
explicitement autorisé. Ne pas accorder `service_role` à un navigateur et ne pas utiliser
`SECURITY DEFINER` pour contourner RLS.

Après la migration :

1. tester l’appel avec `anon`, `authenticated` non-admin et admin ;
2. vérifier que la route admin fonctionne via son chemin serveur ;
3. relancer les advisors sécurité ;
4. inspecter `has_function_privilege` pour chaque rôle et chaque surcharge ;
5. vérifier qu’aucune autre fonction de même nom n’a conservé un grant public ;
6. consigner le résultat sans exporter de données utilisateur.

## Rollback

Le rollback doit restaurer exactement les ACL capturées avant changement, et non appliquer un grant
large par défaut. Il doit donc être généré à partir de l’inventaire live :

```sql
-- Exemple non exécutable tant que les signatures et ACL d’origine ne sont pas prouvées.
grant execute on function public.<function>(<types-confirmed>) to <role-confirmed>;
```

Conserver l’ACL originelle dans le ticket de changement sécurisé, pas dans le dépôt si elle contient
des informations sensibles. Tester le rollback sur un environnement d’intégration avant production.
Ne pas restaurer `PUBLIC` automatiquement : si un appelant légitime est découvert, il doit recevoir
un rôle explicite ou passer par un endpoint serveur authentifié.

## Critère de déblocage

Ce finding peut devenir une migration lorsqu’un export sans données prouve, pour les deux fonctions :

- signature et absence/présence de surcharge ;
- `prosecdef`, owner et `search_path` ;
- ACL avant changement ;
- appelants autorisés et rôle SQL cible ;
- tests de refus `anon`/`authenticated` non autorisé ;
- test de non-régression de la route admin ;
- rollback ACL testé.

Jusqu’à ces preuves, la confirmation admin et le registre d’opérations restent désactivés.
