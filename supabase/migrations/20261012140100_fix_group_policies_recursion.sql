-- groups_member_read and group_members_member_read both look the caller up in group_members, a table whose
-- own policy does the same lookup: PostgreSQL stops with 42P17 "infinite recursion detected in policy for
-- relation group_members", so any read of groups / group_members with a visitor's session fails (HTTP 500).
-- Confirmed on production on 2026-10-12.
--
-- Fix: the membership lookup moves into a SECURITY DEFINER function, which reads group_members without
-- re-entering its policy. Same rule as before: a signed-in user sees the groups they belong to, and the
-- members of those groups.
--
-- Rollback: drop the two policies and the function, then recreate the previous policies
-- (USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = <group id> AND gm.profile_id = auth.uid()))).

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.profile_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS group_members_member_read ON public.group_members;
CREATE POLICY group_members_member_read ON public.group_members
  FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS groups_member_read ON public.groups;
CREATE POLICY groups_member_read ON public.groups
  FOR SELECT TO authenticated
  USING (public.is_group_member(id));
