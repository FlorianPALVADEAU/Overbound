-- admin_list_users : le code ambassadeur affiché suit la jonction ambassador_promotional_codes.
--
-- Avant : seul l'ancien lien ambassadors.promotional_code_id était lu. Un ambassadeur à plusieurs codes
-- (ses codes supplémentaires n'existent que dans la jonction) apparaissait sans code dans la liste.
-- Après : on prend le code courant (is_current), puis le plus récent de la jonction, puis l'ancien lien.
--
-- Signature et colonnes retournées inchangées : create or replace suffit. Les droits sont reposés
-- à l'identique (service_role seul).
--
-- À appliquer avant le déploiement du code qui lit cette fonction (aucun changement de contrat TS requis).

create or replace function public.admin_list_users(
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
  full_name text,
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
  if p_sort not in ('created_at', 'last_sign_in_at', 'full_name', 'email', 'role') then
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
      p.full_name,
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
        or strpos(lower(coalesce(a.full_name, '')), v_query) > 0
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
        when 'full_name' then lower(coalesce(f.full_name, ''))
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
    k.full_name,
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
