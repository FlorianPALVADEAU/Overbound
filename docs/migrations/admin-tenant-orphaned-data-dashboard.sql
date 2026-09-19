-- Overbound — rattachement organisationnel des données historiques orphelines
--
-- À exécuter dans Supabase Dashboard > SQL Editor, après le bootstrap initial.
-- Ce script ne modifie que organization_id. Il ne modifie jamais :
--   - le statut ou le montant d'une commande ;
--   - les paiements Stripe ;
--   - les inscriptions, leurs vagues ou leurs tickets ;
--   - anchor_event_id, event_id ou toute autre relation métier.
--
-- Les commandes restantes n'ont aucune inscription liée. Elles sont donc
-- rattachées au tenant Overbound uniquement, et restent explicitement
-- orphelines au niveau événementiel pour une future réconciliation financière.

begin;

do $$
begin
  if not exists (
    select 1 from public.organizations where slug = 'overbound'
  ) then
    raise exception 'Organisation overbound absente : exécuter le bootstrap initial.';
  end if;
end $$;

-- Groupes historiques sans anchor_event_id.
update public.groups g
set organization_id = o.id,
    updated_at = now()
from public.organizations o
where o.slug = 'overbound'
  and g.organization_id is null;

-- Membres des groupes désormais rattachés.
update public.group_members gm
set organization_id = g.organization_id
from public.groups g
where gm.group_id = g.id
  and gm.organization_id is null
  and g.organization_id is not null;

-- Commandes sans inscription liée : rattachement tenant uniquement.
update public.orders o
set organization_id = org.id
from public.organizations org
where org.slug = 'overbound'
  and o.organization_id is null;

commit;

-- Vérification finale : les valeurs attendues sont zéro.
select 'groups_without_organization' as check_name, count(*) as remaining
from public.groups
where organization_id is null
union all
select 'group_members_without_organization', count(*)
from public.group_members
where organization_id is null
union all
select 'orders_without_organization', count(*)
from public.orders
where organization_id is null;

-- Contrôle d'intégrité : les commandes rattachées restent inchangées côté
-- statut et fournisseur, et les membres suivent bien leur groupe.
select o.status, o.provider, count(*) as order_count
from public.orders o
join public.organizations org on org.id = o.organization_id
where org.slug = 'overbound'
group by o.status, o.provider
order by o.status, o.provider;
