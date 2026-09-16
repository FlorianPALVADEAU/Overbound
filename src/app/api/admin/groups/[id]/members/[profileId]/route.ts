import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; profileId: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id, profileId } = await params
    const admin = supabaseAdmin()

    const { data: group } = await admin
      .from('groups')
      .select('captain_id')
      .eq('id', id)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
    }

    if (group.captain_id === profileId) {
      return NextResponse.json({ error: 'Impossible d\'exclure le capitaine. Déléguez d\'abord.' }, { status: 400 })
    }

    const { error } = await admin
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('profile_id', profileId)

    if (error) {
      console.error('[admin groups members] remove error', error)
      return NextResponse.json({ error: 'Erreur exclusion membre' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin groups members] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
