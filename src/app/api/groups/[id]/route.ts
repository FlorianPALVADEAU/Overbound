import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params
    const { name } = await request.json() as { name?: string }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: group } = await admin
      .from('groups')
      .select('captain_id')
      .eq('id', id)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
    }

    if (group.captain_id !== user.id) {
      return NextResponse.json({ error: 'Seul le capitaine peut renommer le groupe' }, { status: 403 })
    }

    const { error } = await admin
      .from('groups')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[groups/[id]] patch error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (group.captain_id !== user.id) {
      return NextResponse.json({ error: 'Seul le capitaine peut dissoudre le groupe' }, { status: 403 })
    }

    // CASCADE deletes group_members
    const { error } = await admin.from('groups').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[groups/[id]] delete error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
