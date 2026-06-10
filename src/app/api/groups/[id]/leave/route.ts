import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params
    const admin = supabaseAdmin()

    const { data: group } = await admin
      .from('groups')
      .select('captain_id')
      .eq('id', id)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
    }

    if (group.captain_id === user.id) {
      // Check if there are other members
      const { count } = await admin
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', id)
        .neq('profile_id', user.id)

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: 'Déléguez d\'abord le rôle de capitaine avant de quitter le groupe' },
          { status: 400 }
        )
      }

      // Last member leaving — dissolve the group
      await admin.from('groups').delete().eq('id', id)
      return NextResponse.json({ ok: true, dissolved: true })
    }

    const { error } = await admin
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('profile_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Erreur lors du départ' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[groups/[id]/leave] error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
