import { NextRequest, NextResponse } from 'next/server'
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

async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> },
) {
  try {
    const { error: authError } = await ensureAdmin(request)
    if (authError) return authError

    const { id: ambassadorId, codeId } = await params
    const admin = supabaseAdmin()

    // Check if the code being removed is the current one
    const { data: existing } = await admin
      .from('ambassador_promotional_codes')
      .select('is_current, promotional_code_id')
      .eq('ambassador_id', ambassadorId)
      .eq('id', codeId)
      .maybeSingle()

    const { error: deleteError } = await admin
      .from('ambassador_promotional_codes')
      .delete()
      .eq('ambassador_id', ambassadorId)
      .eq('id', codeId)

    if (deleteError) {
      console.error('[admin ambassador promo-codes] delete error', deleteError)
      return NextResponse.json({ error: 'Impossible de supprimer le code.' }, { status: 500 })
    }

    // If the deleted code was current, clear ambassadors.promotional_code_id
    if (existing?.is_current) {
      await admin
        .from('ambassadors')
        .update({ promotional_code_id: null })
        .eq('id', ambassadorId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin ambassador promo-codes] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> },
) {
  try {
    const { error: authError } = await ensureAdmin(request)
    if (authError) return authError

    const { id: ambassadorId, codeId } = await params
    const admin = supabaseAdmin()

    // Get the promotional_code_id for this junction row
    const { data: targetRow } = await admin
      .from('ambassador_promotional_codes')
      .select('promotional_code_id')
      .eq('ambassador_id', ambassadorId)
      .eq('id', codeId)
      .maybeSingle()

    if (!targetRow) {
      return NextResponse.json({ error: 'Code non trouvé.' }, { status: 404 })
    }

    // Un-set all current codes for this ambassador
    await admin
      .from('ambassador_promotional_codes')
      .update({ is_current: false })
      .eq('ambassador_id', ambassadorId)

    // Set this code as current
    const { data: updated, error: updateError } = await admin
      .from('ambassador_promotional_codes')
      .update({ is_current: true })
      .eq('ambassador_id', ambassadorId)
      .eq('id', codeId)
      .select('id, promotional_code_id, is_current, assigned_at')
      .single()

    if (updateError || !updated) {
      console.error('[admin ambassador promo-codes] set-current error', updateError)
      return NextResponse.json({ error: 'Impossible de définir le code courant.' }, { status: 500 })
    }

    // Keep ambassadors.promotional_code_id in sync
    await admin
      .from('ambassadors')
      .update({ promotional_code_id: targetRow.promotional_code_id })
      .eq('id', ambassadorId)

    return NextResponse.json({ code: updated })
  } catch (error) {
    console.error('[admin ambassador promo-codes] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression code promo ambassadeur',
})

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Définir code courant ambassadeur',
})
