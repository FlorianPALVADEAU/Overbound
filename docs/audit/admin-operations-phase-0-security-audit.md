# Audit phase 0 — sécurité des opérations admin

- **Statut** : audit documentaire — aucune vérification live effectuée
- **Date** : 15 septembre 2026
- **Périmètre** : routes `/api/admin`, client Supabase serveur, migrations versionnées et journalisation admin
- **Hors périmètre** : modification de données, migration, politique RLS live, scan de secrets et revue Stripe/Resend
- **Références** : [FDR-0008](../fdr/FDR-0008-admin-operations-workspace.md), [FDR-0004](../fdr/FDR-0004-wave-assignment-open-vs-ranked.md), [FDR-0005](../fdr/FDR-0005-group-membership-and-wave-anchoring.md), [data-and-rls](../security/data-and-rls.md), [rpc-reference](../guides/rpc-reference.md)

> Ce document décrit le checkout inspecté le 15 septembre 2026. Il ne prouve ni la configuration ni les grants de la base Supabase déployée. Toute action de production doit commencer par les vérifications live de la section 5.

## 1. Verdict et gate

La phase 1, limitée à la lecture de Participants, peut être préparée à condition que son endpoint soit revu contre l’état live de RLS/RPC. Les nouvelles commandes participant (billet, SAS, groupe), les nouvelles fonctions privilégiées et toute migration de sécurité sont **bloquées** jusqu’à la clôture des findings P0 ci-dessous.

Les invariants métier de FDR-0004 et FDR-0005 restent applicables pendant cet audit : une ancre de groupe contraint les inscriptions OPEN, jamais RANKED ; une bascule de format doit conserver cette règle et la cohérence des compteurs de SAS.

## 2. Méthode et limites

### Sources inspectées

- 59 fichiers de routes sous `src/app/api/admin`, 92 handlers exportés.
- `src/lib/supabase/server.ts`, `src/lib/logging/adminRequestLogger.ts` et les routes admin représentatives.
- Les sept migrations présentes dans `supabase/migrations/`.
- Les contrats documentés dans `docs/guides/rpc-reference.md`.

### Ce qui n’a pas été vérifié

- projet/ref Supabase cible, version Postgres, Data API exposée ou non ;
- RLS, ownership, `EXECUTE`, `PUBLIC` grants, vues, triggers et fonctions réellement déployés ;
- variables d’environnement, secret manager, logs hébergeur et rétention effective ;
- données, index, plans de requêtes et capacité de rollback réelle.

Un résultat présenté comme « observed » est donc une preuve de dépôt ; un résultat présenté comme « à confirmer » nécessite une interrogation de la base cible.

## 3. Findings priorisés

| ID | Sévérité | Ressource / preuve | Impact | Décision avant livraison |
|---|---|---|---|---|
| SEC-01 | P0 | `src/lib/supabase/server.ts:45` crée un client `SUPABASE_SERVICE_ROLE_KEY`; 47 des 59 routes admin l’emploient | Une omission de garde applicative contourne RLS et expose toutes les lignes accessibles au rôle de service | Inventaire et garde centralisée avant nouvelle commande privilégiée |
| SEC-02 | P0 | `supabase/migrations/` ne contient pas le schéma complet ni les définitions des RPC critiques ; `rpc-reference.md` dit explicitement que les signatures doivent être vérifiées | Impossible de déduire les privilèges, `SECURITY DEFINER`, `search_path` et grants réels depuis Git | Exporter le catalogue live et traiter chaque fonction exposée |
| SEC-03 | P0 | `src/lib/logging/adminRequestLogger.ts:20-81,150-169` conserve query params, corps HTTP et IP ; limite de taille mais pas de liste de champs autorisés | PII, contenu marketing, identifiants financiers ou données sensibles peuvent entrer dans `admin_request_logs` | Stopper l’ajout de nouveaux logs bruts ; adopter un audit métier minimisé et une politique de rétention |
| SEC-04 | P1 | 38/59 routes admin utilisent `withRequestLogging`; seules 2 routes admin possèdent un test de route | Couverture d’audit et de contrôle d’accès inégale ; une régression est difficile à détecter | Standardiser le middleware/garde et ajouter tests de refus aux routes prioritaires |
| SEC-05 | P1 | Les routes répètent la lecture `profiles.role === 'admin'`, p. ex. `src/app/api/admin/registrations/route.ts:42-60` ; bootcamps accepte aussi `super_admin` | Règle d’autorisation divergente, aucune portée organisation/événement démontrée | Définir une matrice et une primitive serveur unique avant rôle opérateur |
| SEC-06 | P1 | `supabase/migrations/20260416_ambassador_promotional_codes.sql` et `20260514_ambassador_manual_referrals.sql` créent des tables sans RLS ni policies dans le dépôt | Si ces tables sont exposées et grants accordés, accès direct non maîtrisé possible | Vérifier exposition/RLS/grants live puis créer une migration corrective si nécessaire |
| SEC-07 | P1 | `supabase/migrations/20260609_bootcamps.sql:53-96` emploie `auth.role()` dans certaines policies et des sous-requêtes rôle dupliquées | Politique non homogène ; la sémantique réelle dépend de la configuration Auth/RLS live | Revoir les policies live, remplacer de manière testée par `TO authenticated` + prédicats d’autorisation |
| SEC-08 | P1 | `src/app/api/admin/registrations/route.ts:62-70` appelle `get_registrations_with_filters` avec une enveloppe `args`; contrat SQL absent du dépôt | Le read model Participants peut casser ou renvoyer plus de PII/colonnes que prévu | Versionner et tester le contrat live avant réemploi |
| SEC-09 | P2 | `src/app/api/admin/logs/route.ts:48-91` retourne `select('*')` sur les logs à tout admin | Les administrateurs accèdent aux corps, IP, emails, erreurs et métadonnées sans politique de minimisation | Restreindre projection, rôles et export après décision Q-09 |
| SEC-10 | P2 | `src/app/api/admin/events/[id]/waves/route.ts:55-149` lit des emails et noms via client de service | Surface PII plus large que nécessaire pour la vue SAS | Définir les champs nécessaires par écran et minimiser la projection dans le nouveau read model |

### SEC-01 — client de service et frontière d’autorisation

**Constat.** `supabaseAdmin()` construit un client serveur avec la clé de service. Les routes inspectées effectuent généralement une authentification via cookie et comparent `profiles.role` avant cet appel. Ce pattern est une barrière applicative, non une garantie RLS : une route oubliée, une réutilisation hors route, ou une erreur de branche bénéficie du contournement RLS du rôle de service.

**Preuves.** `src/lib/supabase/server.ts:41-47`; `src/app/api/admin/events/[id]/waves/route.ts:6-27,55`; `src/app/api/admin/registrations/route.ts:42-60,107`.

**À confirmer live.** rôle effectif de la clé, exposition Data API, RLS des tables lues via le client admin, et éventuellement accès par organisation.

**Correction proposée.** Introduire une seule primitive serveur `requireAdmin` (puis permission ciblée lorsque la matrice existe), qui retourne l’acteur auditable. Réserver le client de service aux opérations qui nécessitent objectivement un bypass, documenter ces appels et préférer le client de session pour les lectures que RLS peut autoriser. Ne pas exposer la clé au client ; aucun changement de clé n’est requis par ce rapport.

**Tests.** 401 sans session, 403 utilisateur authentifié non admin, 403 organisation/événement hors portée quand cette portée sera définie, 200 admin autorisé. Tester qu’aucune commande ne s’exécute lorsque la garde échoue.

**Rollback.** Déployer d’abord la primitive sans supprimer les gardes locales, migrer route par route, instrumenter les refus, puis retirer les duplications après une fenêtre d’observation.

### SEC-02 — fonctions SQL, vues et grants non versionnés

**Constat.** Les RPC essentiels à l’admin et à l’assignation de SAS sont appelés par le code mais leurs définitions ne sont pas toutes présentes dans les migrations. La référence RPC prévient elle-même que ses signatures ne sont pas le contrat live.

**Preuves.** `docs/guides/rpc-reference.md:5-16`; `src/app/api/admin/overview/route.ts:25`; `src/app/api/admin/registrations/route.ts:62`; `src/app/api/registrations/create/route.ts` pour l’assignation OPEN.

**Risque spécifique.** Une fonction `SECURITY DEFINER`, en particulier en schéma exposé, peut devenir appelable via le rôle `PUBLIC` si ses grants ne sont pas explicitement révoqués. Une vue peut aussi contourner RLS suivant son mode de sécurité. Ceci ne peut pas être conclu du dépôt actuel : c’est précisément l’objet du contrôle live.

**Correction proposée.** Cataloguer puis versionner les fonctions/vues requises. Par défaut, utiliser `SECURITY INVOKER`; lorsqu’un `SECURITY DEFINER` est indispensable, le placer dans un schéma non exposé, fixer `search_path`, ajouter les vérifications d’autorisation dans la fonction, révoquer `EXECUTE` à `PUBLIC` et accorder seulement le rôle requis.

**Tests.** Exécuter chaque RPC avec anon, authenticated non admin, admin et rôle service ; prouver l’absence d’accès inter-organisation ; exercer succès, échec, idempotence et concurrence pour les commandes SAS/billet.

**Rollback.** Sauvegarder la définition/grants originels (`pg_get_functiondef`, ACL) avant migration ; restaurer la définition et les grants dans une migration de rollback si un consommateur approuvé échoue.

### SEC-03 et SEC-09 — journalisation et PII

**Constat.** Le logger générique lit le corps de chaque mutation, y compris des formulaires, puis le stocke avec l’email de l’acteur, IP, query params, métadonnées et messages d’erreur. La troncature à 8 192 caractères réduit le volume, pas la sensibilité. L’endpoint de logs sélectionne toutes les colonnes.

**Correction proposée.** Pour les nouvelles commandes, remplacer la capture générique par des événements métier allowlistés : `command_id`, acteur interne, cible, événement/organisation, type, résultat, date, motif validé si requis et diff minimal. Retirer/masquer email, IP, payload, token, HTML et PII non nécessaires des projections. Décider Q-09 (rétention, export, accès, purge/masquage) avant production d’un nouveau journal.

**Migration de données.** Ne pas supprimer des logs existants sans décision légale. D’abord mesurer les colonnes sensibles et les consommateurs (`src/lib/email/adminDigest.ts`, `/api/admin/logs`), sauvegarder selon la politique validée, puis appliquer suppression/masquage par migration réversible ou export approuvé.

**Tests.** Un test de logger doit prouver que `email`, `phone`, `token`, `authorization`, `paymentIntentId`, contenu HTML et corps arbitraire ne sont jamais persistés. Un test d’API de logs vérifie projection minimale et refus pour un rôle insuffisant.

### SEC-05 à SEC-08 — politiques et contrats à rendre vérifiables

- Les rôles `admin` et `super_admin` ne sont pas utilisés uniformément. La future matrice doit définir ressources, actions, périmètre événement/organisation et défaut de refus.
- Les migrations créent certaines tables sans activer explicitement RLS. Cela ne prouve pas que la production est vulnérable, mais rend le dépôt incapable de prouver sa sécurité.
- La policy bootcamps documentée doit être relue à partir du SQL live, y compris les `USING`/`WITH CHECK`, les grants table et les politiques `SELECT` nécessaires aux `UPDATE`.
- Le read model Participants ne doit pas hériter aveuglément des colonnes du RPC historique. Son contrat doit exposer explicitement les champs et pagination nécessaires, sans PII dans les URLs ou colonnes inutiles.

## 4. Inventaire des surfaces à traiter en priorité

| Surface | Usage observé | Priorité |
|---|---|---|
| `profiles` | rôle admin lu dans la plupart des routes | P0 : modèle d’autorisation et RLS live |
| `registrations`, `orders`, `tickets`, `events`, `event_waves` | lecture/admin et futures commandes participant/SAS | P0 : RLS, indexes, RPC et transactions |
| `groups`, `group_members` | ancre OPEN ; RLS présente dans migration initiale | P0 : vérifier cascade, authorisation et contraintes live |
| `admin_request_logs` | payloads et PII potentiellement stockés | P0 : minimisation et rétention |
| fonctions RPC admin / waves | contrat absent ou incomplet du dépôt | P0 : définition, owner, ACL, tests |
| tables ambassadeur et bootcamps | migrations partielles / policies hétérogènes | P1 : RLS et grants live |

## 5. Procédure live obligatoire

Exécuter dans un environnement de test représentatif puis production en lecture seule, avec un owner Supabase identifié. Conserver les exports dans un emplacement d’accès restreint, jamais dans Git si elles contiennent des ACL/données sensibles.

1. **Identifier la cible et sauvegarder.** Noter project ref, environnement, version Postgres, timestamp et owner. Vérifier sauvegarde/restauration et fenêtre de changement.
2. **Lancer les advisors.** Lancer `supabase db advisors` (ou l’équivalent MCP) et archiver le résultat sécurité/performance. Les findings non corrigés doivent être acceptés explicitement avec un propriétaire.
3. **Inventorier les tables exposées.** Pour chaque table des schémas exposés : RLS activée, policies par opération/role, grants table/séquence, owner, colonnes PII, index et appartenance organisationnelle.
4. **Inventorier fonctions et vues.** Relever schéma, identité, arguments, owner, `prosecdef`, `proconfig`/`search_path`, ACL, dépendances et rôle appelant de chaque RPC utilisé. Relever le mode de sécurité et grants de chaque vue.
5. **Exercer les rôles.** Dans une base d’intégration avec utilisateurs fixtures : anon, authenticated non admin, admin, super_admin si conservé, et service. Vérifier lecture, écriture, exfiltration inter-organisation, RPC et views.
6. **Vérifier les routes.** Tester les endpoints prioritaires sans cookie, avec cookie non admin et admin. Contrôler que toute écriture échouée ne produit ni mutation ni événement d’audit trompeur.
7. **Contrôler les logs.** Échantillonner de façon approuvée `admin_request_logs`, identifier PII/payloads, consommateurs, rétention effective, exports et accès.

### Livrable d’inventaire minimal

| Finding | Sévérité | Ressource live | Preuve | Impact | Correction | Test de preuve | Rollback | Owner | Échéance |
|---|---|---|---|---|---|---|---|---|---|
| Exemple : fonction publique privilégiée | P0 | `schema.function(args)` | ACL + `prosecdef` | écriture non autorisée possible | revoke/grant + contrôle | appel anon = refus | restauration ACL | Tech | avant phase 3 |

La validation écrite de cette table est le gate de clôture de phase 0.

## 6. Plan de correction séquencé

### Lot A — preuve et réduction immédiate du risque (P0)

1. Réaliser la procédure live ; ne pas modifier de politique sur une hypothèse de dépôt.
2. Définir la primitive d’autorisation serveur et les tests de refus des routes Participants/SAS.
3. Geler l’ajout de capture de body générique ; définir l’événement métier minimal et Q-09.
4. Versionner ou exporter de manière contrôlée les contrats live des RPC nécessaires au lot pilote.

**Sortie :** findings P0 fermés ou explicitement acceptés ; sauvegarde/rollback documentés ; aucun `SECURITY DEFINER` public non justifié ; aucune nouvelle commande sensible sans test de rôle.

### Lot B — correction RLS / RPC contrôlée (P1)

1. Créer une migration par sujet, générée selon le workflow Supabase, avec tests d’intégration.
2. Corriger RLS, `TO` roles, `USING` et `WITH CHECK`; ne pas remplacer une autorisation par une élévation de privilège.
3. Corriger grants de fonctions/vues, indexer les chemins de liste prouvés nécessaires, et ajouter migrations de rollback associées.
4. Migrer progressivement les routes vers la primitive d’autorisation, sans mélange avec la refonte UX.

**Sortie :** tests de matrice de rôles passants sur une base intégration, advisors relancés, diff SQL relu, plan de rollback exercé.

### Lot C — nouvelles commandes participant/SAS (P2, après A et B)

1. Implémenter une commande dédiée par opération, validation Zod, `command_id`, transaction et événement d’audit minimal.
2. Prouver idempotence, capacité concurrente et invariants FDR-0004/FDR-0005.
3. Déployer en mode contrôlé, observer les logs minimisés et retirer l’ancien chemin dans un lot distinct.

## 7. Ownership, tests et rollback

| Sujet | Owner proposé | Preuve d’acceptation | Rollback |
|---|---|---|---|
| Inventaire RLS/RPC/grants | Tech lead + owner Supabase | export catalogue + advisors + matrice d’accès | aucun changement, lecture seule |
| Autorisation route | Tech lead | tests 401/403/200 et revue code | conserver garde locale durant migration |
| RLS/grants/fonctions | Owner Supabase | tests intégration multi-rôles + advisors | migration inverse testée après sauvegarde ACL/DDL |
| Journal métier / rétention | Produit + légal + tech | Q-09 acceptée, test de redaction | conserver ancien accès en lecture limitée jusqu’à migration validée |
| SAS/groupe/billet | Produit opérations + tech | matrice FDR-0004/0005 et test concurrence | commande compensatrice documentée, jamais SQL manuel ad hoc |

## 8. Critères de clôture de phase 0

- [ ] project ref, environnement, owner et date d’audit consignés ;
- [ ] advisors Supabase exécutés et findings triés ;
- [ ] tables exposées, RLS/policies/grants/owners inventoriés ;
- [ ] fonctions et vues RPC inventoriées, ACL et sécurité contrôlées ;
- [ ] matrice anon/authenticated/admin/service exercée en intégration ;
- [ ] SEC-01, SEC-02 et SEC-03 fermés ou acceptés explicitement ;
- [ ] Q-08 et Q-09 tranchées au niveau requis pour le lot pilote ;
- [ ] backup et rollback de toute future migration validés ;
- [ ] le rapport live et les décisions associées sont revus par le responsable technique.

## 9. Décisions à ne pas prendre implicitement

- Ne pas accorder `authenticated` à une table/fonction seulement pour résoudre une erreur de permission.
- Ne pas ajouter `SECURITY DEFINER` pour contourner RLS.
- Ne pas publier une fonction dans `public` avec un grant `PUBLIC` non justifié.
- Ne pas stocker le payload HTTP complet comme substitut à un audit métier.
- Ne pas introduire un rôle opérateur/check-in avant Q-08.
- Ne pas appliquer la migration locale de changement de billet tant que les gates FDR-0008 et ce rapport ne sont pas satisfaits.
