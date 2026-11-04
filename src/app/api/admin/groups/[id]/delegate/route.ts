import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { groupDelegateSchema } from '@/lib/admin/groupInput'
import { captainChangeErrorResponse } from '@/lib/admin/groupCaptain'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const parsed = groupDelegateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }

    const { error } = await supabaseAdmin().rpc('admin_set_group_captain', {
      p_group_id: id,
      p_captain_id: parsed.data.new_captain_id,
      p_organization_id: auth.organizationId,
    })
    if (error) {
      return captainChangeErrorResponse(error, 'admin groups delegate')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin groups delegate] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
