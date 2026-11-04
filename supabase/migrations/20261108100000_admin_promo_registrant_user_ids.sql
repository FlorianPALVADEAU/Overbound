-- admin_promo_registrant_user_ids : profils inscrits avec un code promo, en une seule requête.
--
-- Avant : promoGroupUtils lisait les inscriptions, puis scannait auth.admin.listUsers par pages de 1000
-- jusqu'à 5000 comptes pour retrouver l'id des inscriptions sans user_id. Un compte au-delà de 5000
-- n'était jamais trouvé, et chaque création de groupe payait tout le scan.
-- Après : jointure directe registrations -> auth.users sur l'email normalisé (minuscules, sans espaces).
--
-- Pas de changement de contrat TS requis hors promoGroupUtils. À appliquer avant le déploiement du code
-- qui appelle cette fonction (FDR-0009 : migrations appliquées avant le code).

create or replace function public.admin_promo_registrant_user_ids(p_promotional_code_id uuid)
returns table (user_id uuid)
language sql
security definer
stable
set search_path = public, auth
as $$
  select distinct coalesce(r.user_id, u.id) as user_id
  from public.registrations r
  left join auth.users u
    on r.user_id is null
   and lower(trim(u.email)) = lower(trim(r.email))
  where r.promotional_code_id = p_promotional_code_id
    and coalesce(r.user_id, u.id) is not null;
$$;

revoke all on function public.admin_promo_registrant_user_ids(uuid) from public, anon, authenticated;
grant execute on function public.admin_promo_registrant_user_ids(uuid) to service_role;
