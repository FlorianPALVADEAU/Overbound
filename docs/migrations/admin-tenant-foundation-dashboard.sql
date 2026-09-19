-- Overbound — tenant foundation (SQL Editor Supabase)
--
-- Usage:
--   1. Open Supabase Dashboard > SQL Editor for the intended project.
--   2. Run this entire script once.
--   3. Run the verification queries at the end and save the result.
--
-- This is the dashboard/manual equivalent of
-- supabase/migrations/20260918155059_admin_tenant_foundation.sql.
-- It is intentionally limited to the expand phase:
--   - no historical backfill;
--   - no owner bootstrap;
--   - no NOT NULL/default on business columns;
--   - no business-table tenant policies;
--   - no RPC, trigger, price, registration or financial mutation.
--
-- Do not run supabase db push after applying this file until the remote
-- migration history has been reconciled. Record the execution timestamp and
-- the verification output in the deployment log.

begin;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_key unique (slug),
  constraint organizations_status_check check (status in ('active', 'suspended', 'archived'))
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_organization_profile_key
    unique (organization_id, profile_id),
  constraint organization_memberships_role_check
    check (role in ('owner', 'admin', 'finance')),
  constraint organization_memberships_status_check
    check (status in ('active', 'suspended', 'revoked'))
);

create index if not exists organizations_status_idx
  on public.organizations(status);
create index if not exists organization_memberships_profile_idx
  on public.organization_memberships(profile_id);
create index if not exists organization_memberships_organization_status_idx
  on public.organization_memberships(organization_id, status);

alter table public.events add column if not exists organization_id uuid;
alter table public.registrations add column if not exists organization_id uuid;
alter table public.orders add column if not exists organization_id uuid;
alter table public.tickets add column if not exists organization_id uuid;
alter table public.event_waves add column if not exists organization_id uuid;
alter table public.groups add column if not exists organization_id uuid;
alter table public.group_members add column if not exists organization_id uuid;

create index if not exists events_organization_id_idx
  on public.events(organization_id);
create index if not exists registrations_organization_id_idx
  on public.registrations(organization_id);
create index if not exists orders_organization_id_idx
  on public.orders(organization_id);
create index if not exists tickets_organization_id_idx
  on public.tickets(organization_id);
create index if not exists event_waves_organization_id_idx
  on public.event_waves(organization_id);
create index if not exists groups_organization_id_idx
  on public.groups(organization_id);
create index if not exists group_members_organization_id_idx
  on public.group_members(organization_id);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

revoke all on table public.organizations from public, anon, authenticated;
revoke all on table public.organization_memberships from public, anon, authenticated;
grant select on table public.organizations to authenticated;
grant select on table public.organization_memberships to authenticated;

drop policy if exists organizations_member_read on public.organizations;
create policy organizations_member_read
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships membership
      where membership.organization_id = organizations.id
        and membership.profile_id = (select auth.uid())
        and membership.status = 'active'
    )
  );

drop policy if exists organization_memberships_self_read
  on public.organization_memberships;
create policy organization_memberships_self_read
  on public.organization_memberships
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    and status = 'active'
  );

commit;

-- Verification (run after the transaction; these are read-only queries).
-- Expected: one row per object/column, zero rows for missing entries.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('organizations', 'organization_memberships')
order by table_name;

select table_name, column_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and column_name = 'organization_id'
  and table_name in (
    'events', 'registrations', 'orders', 'tickets',
    'event_waves', 'groups', 'group_members'
  )
order by table_name;

select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('organizations', 'organization_memberships')
order by tablename, policyname;

select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('organizations', 'organization_memberships')
order by table_name, grantee, privilege_type;

