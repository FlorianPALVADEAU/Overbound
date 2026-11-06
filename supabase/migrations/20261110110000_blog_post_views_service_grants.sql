-- Corrige 20261110100000_blog_post_views : le service role n'avait aucun privilège de table.
-- Symptôme : "permission denied for table blog_post_views" (42501) au chargement du feed.
-- Insertion (upsert) : INSERT et USAGE sur la séquence d'identité.
-- Lecture (blog_post_view_counts est security invoker) : SELECT.
-- Pas de DELETE ici : la purge de rétention, quand elle existera, aura sa propre migration.
-- À relire puis appliquer manuellement, comme la migration qu'elle complète.

grant select, insert on table public.blog_post_views to service_role;
grant usage on sequence public.blog_post_views_id_seq to service_role;
