-- Consentement marketing : opt-in par défaut, provenance obligatoire, preuves faibles rétrogradées.
-- FDR-0007, amendement 2026-11-08.
--
-- Avant : un compte était abonné aux annonces et aux alertes de prix dès sa création
-- (create_notification_preferences_for_new_user), sans case à cocher, et les lignes créées
-- par le trigger n'avaient aucune `source`. Le popup abonnait en plus l'adresse à toutes les listes.
--
-- Après :
--   * un nouveau compte n'est abonné à rien ;
--   * toute ligne list_subscriptions abonnée porte une source (`signup`, `preferences`, `popup-*`...) ;
--   * les lignes abonnées sans preuve sont marquées `legacy-unproven` et exclues des envois
--     par resolveAudience tant que la personne n'a pas confirmé (campagne de re-consentement) ;
--   * les abonnements « offres partenaires » et « recrutement bénévoles » issus du popup
--     (consentement générique « emails marketing ») sont aussi rétrogradés : finalité distincte.
--
-- À appliquer manuellement après relecture, APRÈS 20261114100000_profile_split_name.sql (nom éclaté). Le code échoue fermé : une source nulle ou
-- `legacy-unproven*` n'est jamais envoyée, donc l'ordre migration / déploiement est libre.
--
-- Retour arrière (données) :
--   update public.list_subscriptions
--      set source = nullif(regexp_replace(source, '^legacy-unproven:?', ''), '')
--    where source like 'legacy-unproven%';
-- Retour arrière (fonctions) : restaurer les trois définitions précédentes depuis pg_proc
-- de la sauvegarde ; les défauts d'avant étaient events_announcements = price_alerts = true.

-- 1. Nouveau compte : aucun abonnement par défaut.
create or replace function public.create_notification_preferences_for_new_user()
returns trigger
language plpgsql
as $$
begin
  insert into public.notification_preferences (
    user_id,
    events_announcements,
    price_alerts,
    news_blog,
    volunteers_opportunities,
    partner_offers,
    digest_frequency
  )
  values (new.id, false, false, false, false, false, 'immediate')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 2. Les préférences alimentent les listes en notant d'où vient le choix.
create or replace function public.sync_notification_prefs_to_lists()
returns trigger
language plpgsql
as $$
declare
  v_source text := case when tg_op = 'INSERT' then 'signup' else 'preferences' end;
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  v_map record;
  v_list_id uuid;
  v_value boolean;
begin
  for v_map in
    select * from (values
      ('events-announcements', 'events_announcements'),
      ('price-alerts', 'price_alerts'),
      ('news-blog', 'news_blog'),
      ('volunteers-recruitment', 'volunteers_opportunities'),
      ('partners-offers', 'partner_offers')
    ) as m(slug, key)
  loop
    if tg_op = 'INSERT' or (v_new -> v_map.key) is distinct from (v_old -> v_map.key) then
      v_value := coalesce((v_new ->> v_map.key)::boolean, false);

      select id into v_list_id from public.distribution_lists where slug = v_map.slug;
      if v_list_id is not null then
        -- Update first: an INSERT ... ON CONFLICT would go through the merge trigger, which ORs the
        -- subscribed flags and so could never unsubscribe an existing row.
        update public.list_subscriptions ls
        set
          subscribed = v_value,
          source = case
            when v_value
              and (not coalesce(ls.subscribed, false) or ls.source is null or ls.source like 'legacy-unproven%')
              then v_source
            else ls.source
          end,
          updated_at = now()
        where ls.user_id = new.user_id
          and ls.list_id = v_list_id;

        if not found then
          insert into public.list_subscriptions (user_id, list_id, subscribed, source, subscribed_at)
          values (new.user_id, v_list_id, v_value, v_source, case when v_value then now() end);
        end if;
      end if;
    end if;
  end loop;

  update public.profiles
  set marketing_opt_in = (
    new.events_announcements or
    new.price_alerts or
    new.news_blog or
    new.volunteers_opportunities or
    new.partner_offers
  )
  where id = new.user_id;

  return new;
end;
$$;

-- 3. Fusion d'une ligne anonyme (popup) dans la ligne du compte : la source de la preuve suit.
-- Reprise de la version de 20261114100000_profile_split_name.sql (prénom et nom séparés, security definer),
-- plus le report de la source anonyme. Cette migration DOIT passer après celle du nom éclaté, sinon
-- elle réécrirait la fonction avec des colonnes full_name qui n'existent plus.
create or replace function public.merge_list_subscriptions_before_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  normalized_email text;
  auth_email text;
  existing_user_sub_id uuid;
  anon_subscribed boolean;
  anon_subscribed_at timestamptz;
  anon_source text;
begin
  -- Always normalize incoming email when present.
  if new.email is not null then
    new.email := lower(trim(new.email));
  end if;

  -- Case 1: authenticated/user-based insert.
  if new.user_id is not null then
    select lower(trim(u.email))
    into auth_email
    from auth.users u
    where u.id = new.user_id;

    normalized_email := coalesce(new.email, auth_email);

    -- Read current user subscription for this list if it already exists.
    select ls.id
    into existing_user_sub_id
    from public.list_subscriptions ls
    where ls.list_id = new.list_id
      and ls.user_id = new.user_id
    limit 1
    for update;

    -- Aggregate anonymous subscription state for same list+email.
    if normalized_email is not null then
      select
        bool_or(coalesce(ls.subscribed, false)),
        min(ls.subscribed_at),
        (array_agg(ls.source order by ls.subscribed_at nulls last)
          filter (where coalesce(ls.subscribed, false) and ls.source is not null))[1]
      into
        anon_subscribed,
        anon_subscribed_at,
        anon_source
      from public.list_subscriptions ls
      where ls.list_id = new.list_id
        and ls.user_id is null
        and ls.email is not null
        and lower(trim(ls.email)) = normalized_email;
    else
      anon_subscribed := false;
      anon_subscribed_at := null;
      anon_source := null;
    end if;

    -- If user row already exists, merge and keep it.
    if existing_user_sub_id is not null then
      update public.list_subscriptions ls
      set
        subscribed = coalesce(ls.subscribed, false) or coalesce(new.subscribed, false) or coalesce(anon_subscribed, false),
        subscribed_at = coalesce(ls.subscribed_at, new.subscribed_at, anon_subscribed_at, now()),
        unsubscribed_at = case
          when (coalesce(ls.subscribed, false) or coalesce(new.subscribed, false) or coalesce(anon_subscribed, false)) then null
          else coalesce(ls.unsubscribed_at, new.unsubscribed_at, now())
        end,
        source = case
          when coalesce(ls.subscribed, false) then ls.source
          when coalesce(new.subscribed, false) then coalesce(new.source, ls.source)
          when coalesce(anon_subscribed, false) then coalesce(anon_source, ls.source)
          else ls.source
        end,
        updated_at = now()
      where ls.id = existing_user_sub_id;

      -- Delete temporary anonymous rows for same list+email.
      if normalized_email is not null then
        delete from public.list_subscriptions ls
        where ls.list_id = new.list_id
          and ls.user_id is null
          and ls.email is not null
          and lower(trim(ls.email)) = normalized_email;
      end if;

      return null;
    end if;

    -- No user row yet: remove temporary anonymous rows, then allow NEW insert.
    if normalized_email is not null then
      delete from public.list_subscriptions ls
      where ls.list_id = new.list_id
        and ls.user_id is null
        and ls.email is not null
        and lower(trim(ls.email)) = normalized_email;
    end if;

    -- The anonymous consent, not the account default, is what the person gave.
    if not coalesce(new.subscribed, false) and coalesce(anon_subscribed, false) then
      new.source := coalesce(anon_source, new.source);
    end if;

    -- For authenticated rows, keep identity via user_id only.
    new.email := null;
    new.first_name := null;
    new.last_name := null;
    new.subscribed := coalesce(new.subscribed, false) or coalesce(anon_subscribed, false);
    new.subscribed_at := coalesce(new.subscribed_at, anon_subscribed_at, now());
    if new.subscribed then
      new.unsubscribed_at := null;
    else
      new.unsubscribed_at := coalesce(new.unsubscribed_at, now());
    end if;

    return new;
  end if;

  -- Case 2: anonymous/email-based insert. Deduplicate by (list_id, normalized email).
  if new.email is not null then
    if exists (
      select 1
      from public.list_subscriptions ls
      where ls.list_id = new.list_id
        and ls.user_id is null
        and ls.email is not null
        and lower(trim(ls.email)) = new.email
      for update
    ) then
      update public.list_subscriptions ls
      set
        first_name = coalesce(ls.first_name, new.first_name),
        last_name = coalesce(ls.last_name, new.last_name),
        subscribed = coalesce(ls.subscribed, false) or coalesce(new.subscribed, false),
        subscribed_at = coalesce(ls.subscribed_at, new.subscribed_at, now()),
        unsubscribed_at = case
          when (coalesce(ls.subscribed, false) or coalesce(new.subscribed, false)) then null
          else coalesce(ls.unsubscribed_at, new.unsubscribed_at, now())
        end,
        updated_at = now()
      where ls.list_id = new.list_id
        and ls.user_id is null
        and ls.email is not null
        and lower(trim(ls.email)) = new.email;

      return null;
    end if;
  end if;

  return new;
end;
$function$;

-- 4. Rétrogradation des abonnements dont la preuve manque.
update public.list_subscriptions
set source = 'legacy-unproven'
where coalesce(subscribed, false)
  and source is null;

update public.list_subscriptions ls
set source = 'legacy-unproven:' || ls.source
from public.distribution_lists dl
where dl.id = ls.list_id
  and dl.slug in ('partners-offers', 'volunteers-recruitment')
  and coalesce(ls.subscribed, false)
  and ls.source like 'popup-%';
