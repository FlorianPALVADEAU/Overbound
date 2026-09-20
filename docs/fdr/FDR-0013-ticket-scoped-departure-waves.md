# FDR-0013 — SAS de départ propres à chaque billet

**Statut** : Implémenté, migration à appliquer
**Date** : 20 septembre 2026

## Problème

Les lignes `event_waves` étaient uniques par `(event_id, wave_index)`. Deux billets d'un même événement partageaient donc implicitement leurs horaires, capacités, fermetures et compteurs. Cette modélisation rendait impossible la configuration indépendante de deux formats utilisant tous les deux des départs par SAS.

Le comportement historique contenait aussi des déductions à partir des mots `OPEN` et `RANKED` présents dans les noms. Un renommage pouvait ainsi modifier le comportement métier.

## Décision

Un SAS appartient à un billet. L'identité fonctionnelle d'un SAS devient `(ticket_id, wave_index)`.

- `tickets.operations_config.departure_mode = "wave"` active la capacité SAS du billet.
- Le nom du billet et le nom de la course ne participent à aucune décision opérationnelle.
- Les horaires, capacités, fermetures et compteurs sont indépendants entre billets.
- La gestion principale des SAS est exposée depuis la ligne du billet dans l'admin.
- La page événement ne porte plus un tableau de SAS supposé global.
- Un changement de billet conserve le prix historiquement payé et ne crée aucun mouvement financier automatique.
- La politique `departure_change_policy` du billet cible décide si le départ est conservé, supprimé ou réattribué.
- Un départ fixe réattribué utilise `operations_config.fixed_start_time`; aucun horaire métier n'est codé en dur.

## Migration des données

La migration `20260920172444_ticket_scoped_event_waves.sql` suit une stratégie expand/migrate :

1. ajout nullable de `event_waves.ticket_id` avec clé étrangère vers `tickets`;
2. suppression de l'ancienne unicité événement/vague;
3. rattachement des lignes existantes au billet SAS ayant le plus d'inscriptions;
4. clonage du planning historique pour chaque autre billet explicitement configuré avec `departure_mode = "wave"`;
5. recalcul des compteurs depuis les inscriptions de chaque billet;
6. création de l'unicité `(ticket_id, wave_index)` et de l'index de lecture événement/billet;
7. remplacement des RPC critiques par des versions basées sur `operations_config` et `ticket_id`.

Les lignes sans `ticket_id` ne sont conservées que pour les événements ne possédant encore aucun billet explicitement configuré. Les API nouvelles ne les exposent pas. Une phase de contraction pourra les supprimer après audit de production.

## Contrats API

`GET`, `POST` et `PATCH /api/admin/events/:eventId/waves` exigent le paramètre `ticket_id`. Le serveur vérifie que :

- le billet appartient à l'événement demandé;
- le billet appartient à l'organisation administrée;
- sa configuration autorise les départs par SAS.

Les sélections publiques de SAS reçoivent également le billet afin de ne jamais présenter le planning d'un autre format.

## Invariants

- Un compteur de SAS ne compte que les inscriptions ayant le même `ticket_id` et le même `wave_index`.
- Une inscription ne peut être déplacée que vers un SAS de son billet courant.
- Une réattribution après changement de billet ne peut utiliser qu'un SAS du billet cible.
- Une configuration absente ou invalide bloque l'opération; aucun fallback par nom n'est autorisé.
- Toutes les écritures critiques restent atomiques dans PostgreSQL.

## Exploitation et vérification

Après application de la migration, vérifier :

```sql
select event_id, ticket_id, wave_index, count(*)
from public.event_waves
where ticket_id is not null
group by event_id, ticket_id, wave_index
having count(*) > 1;
```

Le résultat doit être vide. Vérifier ensuite les compteurs :

```sql
select ew.ticket_id, ew.wave_index, ew.assigned_count,
       count(r.id)::int as actual_count
from public.event_waves ew
left join public.registrations r
  on r.ticket_id = ew.ticket_id
 and r.wave_index = ew.wave_index
where ew.ticket_id is not null
group by ew.id
having ew.assigned_count <> count(r.id)::int;
```

Le résultat doit également être vide.

## Rollback

Le retour à un planning global est potentiellement destructif dès que deux billets ont des configurations différentes. Un rollback ne doit donc pas fusionner automatiquement les données. Il faut d'abord choisir explicitement le billet dont le planning devient la référence, réaffecter ou supprimer les autres plannings, puis seulement restaurer l'unicité `(event_id, wave_index)`.

## Suite

- Auditer les éventuelles lignes historiques `ticket_id is null`, puis rendre la colonne obligatoire.
- Faire évoluer la notion d'ancre de groupe si le produit exige qu'un groupe multi-billets parte à une heure strictement identique plutôt qu'au même index de SAS propre à chaque billet.
- Ajouter un test d'intégration PostgreSQL de concurrence sur la dernière place disponible d'un SAS.
