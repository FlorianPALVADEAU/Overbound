# Confirmation `NO_MOVEMENT` — gap de contrat

## État

La route `POST /api/admin/events/:eventId/participants/:registrationId/change-ticket/confirm` est volontairement bloquée en `501 Not Implemented`.

Cette réponse est une protection : l’activation d’une correction sans mouvement financier nécessite une garantie d’idempotence et une trace d’audit atomique. Le dépôt actuel ne fournit pas encore ce contrat.

## Constats vérifiés

- `admin_request_logs` est un journal de requêtes générique qui peut conserver corps, query string, email et IP. Il ne constitue pas un audit métier minimisé.
- Aucun stockage versionné de commande ne garantit l’unicité de `(organization_id, command_id)` ou le rejet d’un même `command_id` réutilisé avec un payload différent.
- La migration `20260915_admin_change_registration_ticket.sql` expose les RPC de mutation uniquement à `service_role` et ne prend ni `command_id`, ni motif, ni snapshot d’audit.
- Une confirmation directe par `PATCH`, RPC existant ou simple insertion dans `admin_request_logs` ne respecterait donc pas FDR-0010.

## Contrat à déployer avant activation

Le prochain lot doit fournir, après vérification Supabase cible :

1. un registre append-only de commandes avec `organization_id`, `event_id`, `registration_id`, `command_id`, variante, motif, approbateur, payload canonique haché, état et timestamps ;
2. une contrainte unique sur l’organisation et `command_id` ;
3. une transaction atomique mutation métier + audit, avec rejeu idempotent et conflit explicite si le payload diffère ;
4. des policies RLS et grants minimaux vérifiés dans l’environnement cible ;
5. un snapshot minimal avant/après permettant une restauration opératoire ;
6. une revalidation serveur du preview, du prix historique, du format/groupe/SAS et du cutoff J-1 avant écriture.

Le module `src/lib/admin/noMovementConfirmation.ts` contient uniquement le garde-fou pur (motif, expiration, version et cutoff). Il ne persiste rien et ne doit pas être interprété comme une autorisation de mutation.
