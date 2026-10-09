import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { resetMaintenanceCache } from '@/lib/maintenance/settings'

const updateSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(500).nullable().optional(),
  estimated_end: z.string().datetime({ offset: true }).nullable().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { data, error } = await supabaseAdmin()
    .from('site_maintenance')
    .select('enabled, message, estimated_end, updated_at')
    .eq('id', true)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Erreur chargement maintenance' }, { status: 500 })
  return NextResponse.json({ maintenance: data ?? { enabled: false, message: null, estimated_end: null, updated_at: null } })
}

async function handlePut(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = updateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { enabled, message, estimated_end } = parsed.data
  const { data, error } = await supabaseAdmin()
    .from('site_maintenance')
    .upsert(
      {
        id: true,
        enabled,
        message: message?.length ? message : null,
        estimated_end: estimated_end ?? null,
        updated_at: new Date().toISOString(),
        updated_by: auth.user.id,
      },
      { onConflict: 'id' },
    )
    .select('enabled, message, estimated_end, updated_at')
    .single()

  if (error) return NextResponse.json({ error: 'Erreur mise à jour maintenance' }, { status: 500 })
  resetMaintenanceCache()
  return NextResponse.json({ maintenance: data })
}

export const PUT = withRequestLogging(handlePut, { actionType: 'Mode maintenance' })
