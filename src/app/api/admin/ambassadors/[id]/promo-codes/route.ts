import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export const runtime = 'nodejs'

async function ensureAdmin(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { user }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await ensureAdmin(request)
    if (error) return error

    const { id: ambassadorId } = await params
    const admin = supabaseAdmin()

    const { data: codesRows, error: codesError } = await admin
      .from('ambassador_promotional_codes')
      .select('id, promotional_code_id, is_current, assigned_at')
      .eq('ambassador_id', ambassadorId)
      .order('assigned_at', { ascending: false })

    if (codesError) {
      console.error('[admin ambassador promo-codes] fetch error', codesError)
      return NextResponse.json({ error: 'Erreur lors du chargement des codes.' }, { status: 500 })
    }

    const codeIds = (codesRows || []).map((r: any) => r.promotional_code_id as string)

    const { data: promoRows, error: promoError } = codeIds.length > 0
      ? await admin
          .from('promotional_codes')
          .select('id, code, name, is_active')
          .in('id', codeIds)
      : { data: [], error: null }

    if (promoError) {
      console.error('[admin ambassador promo-codes] promo fetch error', promoError)
      return NextResponse.json({ error: 'Erreur lors du chargement des codes promo.' }, { status: 500 })
    }

    const promoMap = new Map((promoRows || []).map((r: any) => [r.id, r]))

    const codes = (codesRows || []).map((r: any) => {
      const promo = promoMap.get(r.promotional_code_id)
      return {
        id: r.id,
        promotional_code_id: r.promotional_code_id,
        code: promo?.code ?? null,
        name: promo?.name ?? null,
        is_active: promo?.is_active ?? false,
        is_current: r.is_current,
        assigned_at: r.assigned_at,
      }
    })

    return NextResponse.json({ codes })
  } catch (error) {
    console.error('[admin ambassador promo-codes] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const assignSchema = z.object({
  promotional_code_id: z.string().uuid(),
  set_as_current: z.boolean().default(false),
})

async function handlePost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error: authError } = await ensureAdmin(request)
    if (authError) return authError

    const { id: ambassadorId } = await params
    const payload = assignSchema.parse(await request.json())
    const admin = supabaseAdmin()

    if (payload.set_as_current) {
      // Un-set all current codes for this ambassador
      await admin
        .from('ambassador_promotional_codes')
        .update({ is_current: false })
        .eq('ambassador_id', ambassadorId)
    }

    const { data: inserted, error: insertError } = await admin
      .from('ambassador_promotional_codes')
      .upsert(
        {
          ambassador_id: ambassadorId,
          promotional_code_id: payload.promotional_code_id,
          is_current: payload.set_as_current,
          assigned_at: new Date().toISOString(),
        },
        { onConflict: 'ambassador_id,promotional_code_id' },
      )
      .select('id, promotional_code_id, is_current, assigned_at')
      .single()

    if (insertError || !inserted) {
      console.error('[admin ambassador promo-codes] insert error', insertError)
      return NextResponse.json({ error: 'Impossible d\'assigner le code.' }, { status: 500 })
    }

    if (payload.set_as_current) {
      // Keep ambassadors.promotional_code_id in sync for backward compatibility
      await admin
        .from('ambassadors')
        .update({ promotional_code_id: payload.promotional_code_id })
        .eq('id', ambassadorId)
    }

    return NextResponse.json({ code: inserted })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('[admin ambassador promo-codes] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Assignation code promo ambassadeur',
})
