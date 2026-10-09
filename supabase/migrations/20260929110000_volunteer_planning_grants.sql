-- Les tables créées par 20260929100000_volunteer_planning.sql n'ont pas reçu de privilèges pour le
-- rôle service_role (erreur 42501 « permission denied for table volunteer_assignments »).
-- Les routes /api/admin/volunteers/planning/* passent par le client service-role : on lui donne
-- l'accès, et uniquement à lui (RLS reste activée, aucune policy anon/authenticated).
--
-- Idempotent : GRANT peut être rejoué sans effet de bord.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_assignments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_zone_settings TO service_role;
