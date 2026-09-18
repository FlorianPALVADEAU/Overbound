-- Admin tenant foundation — expand phase only.
--
-- This migration deliberately does not backfill existing rows, add defaults to
-- business tables, make organization_id NOT NULL, alter RPCs, or change the
-- 20260915 admin ticket migration. The follow-up backfill/contract migrations
-- require an explicitly approved owner and a live-schema verification report.

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_key UNIQUE (slug),
  CONSTRAINT organizations_status_check CHECK (status IN ('active', 'suspended', 'archived'))
);

CREATE TABLE public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_memberships_organization_profile_key
    UNIQUE (organization_id, profile_id),
  CONSTRAINT organization_memberships_role_check
    CHECK (role IN ('owner', 'admin', 'finance')),
  CONSTRAINT organization_memberships_status_check
    CHECK (status IN ('active', 'suspended', 'revoked'))
);

CREATE INDEX organizations_status_idx ON public.organizations(status);
CREATE INDEX organization_memberships_profile_idx
  ON public.organization_memberships(profile_id);
CREATE INDEX organization_memberships_organization_status_idx
  ON public.organization_memberships(organization_id, status);

-- Expand the tenant boundary without assigning existing data to an arbitrary
-- organization. These columns remain nullable until the approved backfill and
-- verification gates in ADR-0002 have passed.
ALTER TABLE public.events ADD COLUMN organization_id uuid;
ALTER TABLE public.registrations ADD COLUMN organization_id uuid;
ALTER TABLE public.orders ADD COLUMN organization_id uuid;
ALTER TABLE public.tickets ADD COLUMN organization_id uuid;
ALTER TABLE public.event_waves ADD COLUMN organization_id uuid;
ALTER TABLE public.groups ADD COLUMN organization_id uuid;
ALTER TABLE public.group_members ADD COLUMN organization_id uuid;

CREATE INDEX events_organization_id_idx ON public.events(organization_id);
CREATE INDEX registrations_organization_id_idx ON public.registrations(organization_id);
CREATE INDEX orders_organization_id_idx ON public.orders(organization_id);
CREATE INDEX tickets_organization_id_idx ON public.tickets(organization_id);
CREATE INDEX event_waves_organization_id_idx ON public.event_waves(organization_id);
CREATE INDEX groups_organization_id_idx ON public.groups(organization_id);
CREATE INDEX group_members_organization_id_idx ON public.group_members(organization_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Be explicit about the absence of anonymous access. No write policy is
-- created yet: membership provisioning belongs to the owner/bootstrap phase.
REVOKE ALL ON TABLE public.organizations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.organization_memberships FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.organizations TO authenticated;
GRANT SELECT ON TABLE public.organization_memberships TO authenticated;

CREATE POLICY organizations_member_read
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships membership
      WHERE membership.organization_id = organizations.id
        AND membership.profile_id = (SELECT auth.uid())
        AND membership.status = 'active'
    )
  );

CREATE POLICY organization_memberships_self_read
  ON public.organization_memberships
  FOR SELECT
  TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    AND status = 'active'
  );

-- Rollback (manual, only after checking dependants):
-- DROP INDEX IF EXISTS public.group_members_organization_id_idx;
-- DROP INDEX IF EXISTS public.groups_organization_id_idx;
-- DROP INDEX IF EXISTS public.event_waves_organization_id_idx;
-- DROP INDEX IF EXISTS public.tickets_organization_id_idx;
-- DROP INDEX IF EXISTS public.orders_organization_id_idx;
-- DROP INDEX IF EXISTS public.registrations_organization_id_idx;
-- DROP INDEX IF EXISTS public.events_organization_id_idx;
-- ALTER TABLE public.group_members DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE public.groups DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE public.event_waves DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE public.registrations DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS organization_id;
-- DROP TABLE IF EXISTS public.organization_memberships;
-- DROP TABLE IF EXISTS public.organizations;
