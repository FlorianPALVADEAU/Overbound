-- Nom complet éclaté en nom de famille et prénom.
--
-- profiles.full_name, list_subscriptions.full_name et event_opening_notifications.full_name disparaissent. Deux colonnes les remplacent :
-- first_name (prénom) et last_name (nom de famille). Reprise des données : premier mot = prénom,
-- le reste = nom (même règle que splitFullName et PersonName.split dans le code). Un nom sans espace
-- donne un prénom seul ; un nom qui contient « @ » (repli sur l'email à l'inscription) n'est pas repris,
-- pour que la personne complète son profil.
--
-- Reconstruction d'un nom complet si besoin : first_name || ' ' || last_name.
--
-- Contenu touché :
--   - colonnes et reprise des données (profiles, list_subscriptions) ;
--   - déclencheurs et fonctions qui écrivaient full_name (handle_new_user, merge_email_subscriptions_to_user,
--     merge_list_subscriptions_before_insert) : elles lisent maintenant le prénom et le nom ;
--   - vues v_all_subscribers et user_notification_preferences : recréées avec first_name / last_name
--     (une vue bloque la suppression de sa colonne source) ;
--   - admin_list_users : change le type de retour (full_name -> first_name, last_name), donc drop + create.
--
-- À appliquer AVANT de déployer le code qui lit ces colonnes (il ne lit plus full_name).
-- Une fois appliquée, la migration est irréversible sans sauvegarde : les colonnes full_name sont supprimées.
-- Sauvegarder la base avant d'appliquer.

-- 1. Nouvelles colonnes -------------------------------------------------------------------------------

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

alter table public.list_subscriptions
  add column if not exists first_name text,
  add column if not exists last_name text;

alter table public.event_opening_notifications
  add column if not exists first_name text,
  add column if not exists last_name text;

-- 2. Reprise des données ------------------------------------------------------------------------------

update public.profiles
set
  first_name = nullif(substring(btrim(full_name) from '^\S+'), ''),
  last_name = nullif(btrim(substring(btrim(full_name) from '^\S+\s+(.*)$')), '')
where full_name is not null
  and btrim(full_name) <> ''
  and full_name not like '%@%'
  and first_name is null
  and last_name is null;

update public.list_subscriptions
set
  first_name = nullif(substring(btrim(full_name) from '^\S+'), ''),
  last_name = nullif(btrim(substring(btrim(full_name) from '^\S+\s+(.*)$')), '')
where full_name is not null
  and btrim(full_name) <> ''
  and full_name not like '%@%'
  and first_name is null
  and last_name is null;

update public.event_opening_notifications
set
  first_name = nullif(substring(btrim(full_name) from '^\S+'), ''),
  last_name = nullif(btrim(substring(btrim(full_name) from '^\S+\s+(.*)$')), '')
where full_name is not null
  and btrim(full_name) <> ''
  and full_name not like '%@%'
  and first_name is null
  and last_name is null;

-- 3. Fonctions qui lisaient full_name -----------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_full text := btrim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  v_first text := nullif(btrim(new.raw_user_meta_data->>'first_name'), '');
  v_last text := nullif(btrim(new.raw_user_meta_data->>'last_name'), '');
begin
  -- Inscription sans prénom/nom explicite (connexion Google, anciens formulaires) : on découpe le nom complet.
  if v_first is null and v_full <> '' and v_full not like '%@%' then
    v_first := nullif(substring(v_full from '^\S+'), '');
    v_last := nullif(btrim(substring(v_full from '^\S+\s+(.*)$')), '');
  end if;

  insert into public.profiles (id, first_name, last_name, role)
  values (new.id, v_first, v_last, 'user')
  on conflict (id) do nothing; -- évite l'erreur si ré-exécuté
  return new;
end;
$function$;

create or replace function public.merge_email_subscriptions_to_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  user_email TEXT;
BEGIN
  -- Récupérer l'email depuis auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  IF user_email IS NOT NULL THEN
    -- Mettre à jour les subscriptions existantes avec cet email
    UPDATE list_subscriptions
    SET
      user_id = NEW.id,
      first_name = COALESCE(NEW.first_name, first_name),
      last_name = COALESCE(NEW.last_name, last_name),
      email = NULL  -- On efface l'email car on a maintenant le user_id
    WHERE
      lower(email) = lower(user_email)
      AND user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$function$;

create or replace function public.merge_list_subscriptions_before_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
DECLARE
  normalized_email text;
  auth_email text;
  existing_user_sub_id uuid;
  anon_subscribed boolean;
  anon_subscribed_at timestamptz;
BEGIN
  -- Always normalize incoming email when present.
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;

  -- Case 1: authenticated/user-based insert.
  IF NEW.user_id IS NOT NULL THEN
    SELECT lower(trim(u.email))
    INTO auth_email
    FROM auth.users u
    WHERE u.id = NEW.user_id;

    normalized_email := COALESCE(NEW.email, auth_email);

    -- Read current user subscription for this list if it already exists.
    SELECT ls.id
    INTO existing_user_sub_id
    FROM public.list_subscriptions ls
    WHERE ls.list_id = NEW.list_id
      AND ls.user_id = NEW.user_id
    LIMIT 1
    FOR UPDATE;

    -- Aggregate anonymous subscription state for same list+email.
    IF normalized_email IS NOT NULL THEN
      SELECT
        bool_or(COALESCE(ls.subscribed, false)),
        min(ls.subscribed_at)
      INTO
        anon_subscribed,
        anon_subscribed_at
      FROM public.list_subscriptions ls
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = normalized_email;
    ELSE
      anon_subscribed := false;
      anon_subscribed_at := NULL;
    END IF;

    -- If user row already exists, merge and keep it.
    IF existing_user_sub_id IS NOT NULL THEN
      UPDATE public.list_subscriptions ls
      SET
        subscribed = COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false) OR COALESCE(anon_subscribed, false),
        subscribed_at = COALESCE(ls.subscribed_at, NEW.subscribed_at, anon_subscribed_at, now()),
        unsubscribed_at = CASE
          WHEN (COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false) OR COALESCE(anon_subscribed, false)) THEN NULL
          ELSE COALESCE(ls.unsubscribed_at, NEW.unsubscribed_at, now())
        END,
        updated_at = now()
      WHERE ls.id = existing_user_sub_id;

      -- Delete temporary anonymous rows for same list+email.
      IF normalized_email IS NOT NULL THEN
        DELETE FROM public.list_subscriptions ls
        WHERE ls.list_id = NEW.list_id
          AND ls.user_id IS NULL
          AND ls.email IS NOT NULL
          AND lower(trim(ls.email)) = normalized_email;
      END IF;

      RETURN NULL;
    END IF;

    -- No user row yet: remove temporary anonymous rows, then allow NEW insert.
    IF normalized_email IS NOT NULL THEN
      DELETE FROM public.list_subscriptions ls
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = normalized_email;
    END IF;

    -- For authenticated rows, keep identity via user_id only.
    NEW.email := NULL;
    NEW.first_name := NULL;
    NEW.last_name := NULL;
    NEW.subscribed := COALESCE(NEW.subscribed, false) OR COALESCE(anon_subscribed, false);
    NEW.subscribed_at := COALESCE(NEW.subscribed_at, anon_subscribed_at, now());
    IF NEW.subscribed THEN
      NEW.unsubscribed_at := NULL;
    ELSE
      NEW.unsubscribed_at := COALESCE(NEW.unsubscribed_at, now());
    END IF;

    RETURN NEW;
  END IF;

  -- Case 2: anonymous/email-based insert. Deduplicate by (list_id, normalized email).
  IF NEW.email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.list_subscriptions ls
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = NEW.email
      FOR UPDATE
    ) THEN
      UPDATE public.list_subscriptions ls
      SET
        first_name = COALESCE(ls.first_name, NEW.first_name),
        last_name = COALESCE(ls.last_name, NEW.last_name),
        subscribed = COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false),
        subscribed_at = COALESCE(ls.subscribed_at, NEW.subscribed_at, now()),
        unsubscribed_at = CASE
          WHEN (COALESCE(ls.subscribed, false) OR COALESCE(NEW.subscribed, false)) THEN NULL
          ELSE COALESCE(ls.unsubscribed_at, NEW.unsubscribed_at, now())
        END,
        updated_at = now()
      WHERE ls.list_id = NEW.list_id
        AND ls.user_id IS NULL
        AND ls.email IS NOT NULL
        AND lower(trim(ls.email)) = NEW.email;

      RETURN NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Vues ---------------------------------------------------------------------------------------------

drop view if exists public.v_all_subscribers;
drop view if exists public.user_notification_preferences;

create view public.v_all_subscribers as
 SELECT ls.id,
    ls.list_id,
    ls.user_id,
    COALESCE((ls.email)::character varying, ((p.id)::text)::character varying) AS email,
    COALESCE(p.first_name, ls.first_name) AS first_name,
    COALESCE(p.last_name, ls.last_name) AS last_name,
    ls.subscribed,
    ls.subscribed_at,
    ls.unsubscribed_at,
    ls.source,
    ls.created_at,
        CASE
            WHEN (ls.user_id IS NOT NULL) THEN 'authenticated'::text
            ELSE 'email_only'::text
        END AS subscriber_type
   FROM (list_subscriptions ls
     LEFT JOIN profiles p ON ((p.id = ls.user_id)));

grant all on public.v_all_subscribers to service_role;

create view public.user_notification_preferences as
 SELECT np.id,
    np.user_id,
    np.events_announcements,
    np.price_alerts,
    np.news_blog,
    np.volunteers_opportunities,
    np.partner_offers,
    np.digest_frequency,
    np.registration_confirmations,
    np.ticket_updates,
    np.account_security,
    np.created_at,
    np.updated_at,
    p.first_name,
    p.last_name
   FROM (notification_preferences np
     LEFT JOIN profiles p ON ((p.id = np.user_id)));

grant all on public.user_notification_preferences to service_role;

-- 5. admin_list_users : nom trié par nom de famille puis prénom -----------------------------------------
-- Clé de tri 'name' remplace 'full_name'. Le type de retour change : drop puis create.

drop function if exists public.admin_list_users(text, text, text, text, integer, integer);

create function public.admin_list_users(
  p_query text,
  p_role text,
  p_sort text,
  p_direction text,
  p_offset integer,
  p_limit integer
)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  first_name text,
  last_name text,
  role text,
  phone text,
  profile_created_at timestamptz,
  date_of_birth date,
  marketing_opt_in boolean,
  ambassador_promotional_code_id uuid,
  ambassador_code text,
  ambassador_code_is_active boolean,
  group_id uuid,
  group_name text,
  group_invite_code text,
  filtered_count bigint
)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
#variable_conflict use_column
declare
  v_query text := lower(coalesce(p_query, ''));
begin
  if p_sort not in ('created_at', 'last_sign_in_at', 'name', 'email', 'role') then
    raise exception 'INVALID_SORT' using errcode = 'invalid_parameter_value';
  end if;
  if p_direction not in ('asc', 'desc') then
    raise exception 'INVALID_DIRECTION' using errcode = 'invalid_parameter_value';
  end if;
  if p_role not in ('all', 'user', 'volunteer', 'admin', 'ambassador') then
    raise exception 'INVALID_ROLE' using errcode = 'invalid_parameter_value';
  end if;

  return query
  with accounts as (
    select
      u.id,
      u.email::text as email,
      u.created_at,
      u.last_sign_in_at,
      p.first_name,
      p.last_name,
      coalesce(p.role, 'user') as role,
      p.phone,
      p.created_at as profile_created_at,
      p.date_of_birth,
      p.marketing_opt_in,
      coalesce(cur.promotional_code_id, a.promotional_code_id) as ambassador_promotional_code_id,
      pc.code::text as ambassador_code,
      pc.is_active as ambassador_code_is_active,
      g.group_id,
      g.group_name,
      g.group_invite_code
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.ambassadors a on a.profile_id = u.id
    -- Code courant de la jonction, sinon le plus récent, sinon l'ancien lien (ambassadors.promotional_code_id).
    left join lateral (
      select apc.promotional_code_id
      from public.ambassador_promotional_codes apc
      where apc.ambassador_id = a.id
      order by apc.is_current desc, apc.assigned_at desc, apc.promotional_code_id asc
      limit 1
    ) cur on true
    left join public.promotional_codes pc on pc.id = coalesce(cur.promotional_code_id, a.promotional_code_id)
    left join lateral (
      select gr.id as group_id, gr.name as group_name, gr.invite_code as group_invite_code
      from public.group_members gm
      join public.groups gr on gr.id = gm.group_id
      where gm.profile_id = u.id
      order by gm.joined_at asc, gr.id asc
      limit 1
    ) g on true
  ),
  filtered as (
    select a.*
    from accounts a
    where (p_role = 'all' or a.role = p_role)
      and (
        v_query = ''
        or strpos(lower(concat_ws(' ', a.first_name, a.last_name)), v_query) > 0
        or strpos(lower(coalesce(a.email, '')), v_query) > 0
        or strpos(lower(case a.role
             when 'user' then 'Utilisateur'
             when 'volunteer' then 'Bénévole'
             when 'admin' then 'Administrateur'
             when 'ambassador' then 'Ambassadeur'
             else '' end), v_query) > 0
        or strpos(lower(coalesce(a.phone, '')), v_query) > 0
        or strpos(lower(coalesce(a.group_name, '')), v_query) > 0
        or strpos(lower(coalesce(a.group_invite_code, '')), v_query) > 0
      )
  ),
  keyed as (
    select
      f.*,
      case p_sort
        when 'created_at' then coalesce(to_char(f.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), '')
        when 'last_sign_in_at' then coalesce(to_char(f.last_sign_in_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), '')
        when 'name' then lower(concat_ws(' ', f.last_name, f.first_name))
        when 'email' then lower(coalesce(f.email, ''))
        else lower(f.role)
      end as sort_key,
      count(*) over () as filtered_count
    from filtered f
  )
  select
    k.id,
    k.email,
    k.created_at,
    k.last_sign_in_at,
    k.first_name,
    k.last_name,
    k.role,
    k.phone,
    k.profile_created_at,
    k.date_of_birth,
    k.marketing_opt_in,
    k.ambassador_promotional_code_id,
    k.ambassador_code,
    k.ambassador_code_is_active,
    k.group_id,
    k.group_name,
    k.group_invite_code,
    k.filtered_count
  from keyed k
  order by
    case when p_direction = 'asc' then k.sort_key end asc,
    case when p_direction = 'desc' then k.sort_key end desc,
    case when p_direction = 'asc' then k.id::text end asc,
    case when p_direction = 'desc' then k.id::text end desc
  offset greatest(coalesce(p_offset, 0), 0)
  limit p_limit;
end;
$$;

revoke all on function public.admin_list_users(text, text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_list_users(text, text, text, text, integer, integer) to service_role;

-- 6. Suppression des colonnes sources -----------------------------------------------------------------

alter table public.profiles drop column full_name;
alter table public.list_subscriptions drop column full_name;
alter table public.event_opening_notifications drop column full_name;
