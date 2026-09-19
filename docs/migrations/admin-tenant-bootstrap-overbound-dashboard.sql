-- Overbound — bootstrap initial de l'organisation (SQL Editor Supabase)
--
-- À exécuter uniquement après vérification des compteurs de la documentation.
-- Ce script crée l'organisation Overbound et rattache les données historiques
-- actuellement présentes. Il ne modifie aucun montant, statut de paiement ou
-- contenu métier.
--
-- Administrateur initial validé :
--   profile_id = 7646452e-e3bc-44e3-8861-c81d39ac2011
--
-- Le script est transactionnel et s'arrête avant toute écriture si une commande
-- est liée à plusieurs événements. Les commandes sans inscription restent
-- volontairement non rattachées et sont signalées par la vérification finale.

begin;

do $$
declare
  v_multi_event_orders bigint;
begin
  select count(*) into v_multi_event_orders
  from (
    select o.id
    from public.orders o
    join public.registrations r on r.order_id = o.id
    group by o.id
    having count(distinct r.event_id) > 1
  ) ambiguous_orders;

  if v_multi_event_orders > 0 then
    raise exception
      'Bootstrap arrêté : % commande(s) liée(s) à plusieurs événements.',
      v_multi_event_orders;
  end if;
end $$;

insert into public.organizations (name, slug, status, timezone)
values ('Overbound', 'overbound', 'active', 'Europe/Paris')
on conflict (slug) do nothing;

insert into public.organization_memberships (
  organization_id,
  profile_id,
  role,
  status
)
select
  o.id,
  '7646452e-e3bc-44e3-8861-c81d39ac2011'::uuid,
  'owner',
  'active'
from public.organizations o
where o.slug = 'overbound'
on conflict (organization_id, profile_id) do update
set role = excluded.role,
    status = excluded.status,
    updated_at = now();

-- Parent event.
update public.events e
set organization_id = o.id,
    updated_at = now()
from public.organizations o
where o.slug = 'overbound'
  and e.organization_id is null;

-- Event-scoped children.
update public.registrations r
set organization_id = e.organization_id
from public.events e
where r.event_id = e.id
  and r.organization_id is null;

update public.tickets t
set organization_id = e.organization_id
from public.events e
where t.event_id = e.id
  and t.organization_id is null;

update public.event_waves w
set organization_id = e.organization_id
from public.events e
where w.event_id = e.id
  and w.organization_id is null;

-- Groups are event-scoped when their anchor event is known.
update public.groups g
set organization_id = e.organization_id,
    updated_at = now()
from public.events e
where g.anchor_event_id = e.id
  and g.organization_id is null;

update public.group_members gm
set organization_id = g.organization_id
from public.groups g
where gm.group_id = g.id
  and gm.organization_id is null
  and g.organization_id is not null;

-- Orders inherit the sole organization represented by their registrations.
update public.orders o
set organization_id = derived.organization_id
from (
  -- PostgreSQL ne fournit pas min(uuid). Les commandes multi-événements ont
  -- déjà été bloquées plus haut, donc une valeur texte suffit ici pour
  -- récupérer l'unique organisation représentée par la commande.
  select r.order_id, min(r.organization_id::text)::uuid as organization_id
  from public.registrations r
  where r.order_id is not null
    and r.organization_id is not null
  group by r.order_id
) derived
where o.id = derived.order_id
  and o.organization_id is null;

commit;

-- Verification: every non-empty result deserves review before the next phase.
select 'organizations' as source,
       case when exists (
         select 1 from public.organizations where slug = 'overbound'
       ) then 0 else 1 end as rows_without_organization
union all
select 'events', count(*) from public.events where organization_id is null
union all
select 'registrations', count(*) from public.registrations where organization_id is null
union all
select 'tickets', count(*) from public.tickets where organization_id is null
union all
select 'event_waves', count(*) from public.event_waves where organization_id is null
union all
select 'groups', count(*) from public.groups where organization_id is null
union all
select 'group_members', count(*) from public.group_members where organization_id is null
union all
select 'orders_without_registration', count(*)
from public.orders o
where o.organization_id is null;

select o.name, o.slug, m.profile_id, m.role, m.status
from public.organizations o
join public.organization_memberships m on m.organization_id = o.id
where o.slug = 'overbound';
