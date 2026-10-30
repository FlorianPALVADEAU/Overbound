import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { QUOTE_STATUSES } from '@/lib/b2b/quoteRequest'
import { supabaseAdmin } from '@/lib/supabase/server'

const patchSchema = z.object({
  status: z.enum(QUOTE_STATUSES.map((status) => status.value) as [string, ...string[]]),
})

const handlePatch = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
    }
    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })

    const { data, error } = await supabaseAdmin()
      .from('b2b_quote_requests')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error('Erreur PATCH b2b-quotes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PATCH = withRequestLogging(handlePatch, { actionType: 'Mise à jour statut demande de devis' })
