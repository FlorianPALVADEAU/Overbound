import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireAdmin, type AdminAuthResult } from '@/lib/auth/requireAdmin'

export type AdminOrganizationAuthResult =
  | { ok: true; user: Extract<AdminAuthResult, { ok: true }>['user']; organizationId: string; role: string }
  | { ok: false; response: NextResponse }

/**
 * Authenticates an admin and resolves one active organization membership.
 * A multi-organization admin must explicitly provide ?organization=<uuid>.
 */
export const requireAdminOrganization = async (
  request?: NextRequest | Request,
): Promise<AdminOrganizationAuthResult> => {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth

  const client = await createSupabaseServer()
  const { data: memberships, error } = await client
    .from('organization_memberships')
    .select('organization_id, role, status')
    .eq('profile_id', auth.user.id)
    .eq('status', 'active')

  if (error) {
    console.error('[auth] organization membership lookup failed', error)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Contexte organisation indisponible' }, { status: 503 }),
    }
  }

  const requestedOrganizationId = request
    ? new URL(request.url).searchParams.get('organization')
    : null
  const candidates = memberships ?? []
  const selected = requestedOrganizationId
    ? candidates.find((membership) => membership.organization_id === requestedOrganizationId)
    : candidates.length === 1
      ? candidates[0]
      : null

  if (!selected) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: requestedOrganizationId
            ? 'Accès refusé pour cette organisation'
            : 'Contexte organisation requis',
        },
        { status: requestedOrganizationId ? 403 : 409 },
      ),
    }
  }

  return {
    ok: true,
    user: auth.user,
    organizationId: selected.organization_id,
    role: selected.role,
  }
}
