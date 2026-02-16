import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const updateUserSchema = z
  .object({
    role: z.enum(['user', 'volunteer', 'admin']).optional(),
    full_name: z.string().trim().min(2).max(120).nullable().optional(),
    phone: z.string().trim().min(6).max(32).nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    marketing_opt_in: z.boolean().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Aucune donnée à mettre à jour.',
  })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const payload = await request.json()
    const validated = updateUserSchema.parse(payload)

    const admin = supabaseAdmin()
    const { data: updatedProfile, error } = await admin
      .from('profiles')
      .update({
        ...(validated.role !== undefined ? { role: validated.role } : {}),
        ...(validated.full_name !== undefined ? { full_name: validated.full_name } : {}),
        ...(validated.phone !== undefined ? { phone: validated.phone } : {}),
        ...(validated.date_of_birth !== undefined ? { date_of_birth: validated.date_of_birth } : {}),
        ...(validated.marketing_opt_in !== undefined ? { marketing_opt_in: validated.marketing_opt_in } : {}),
      })
      .eq('id', id)
      .select('id, full_name, role, phone, created_at, date_of_birth, marketing_opt_in')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    console.error('[admin users] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.id === id) {
      return NextResponse.json({ error: 'Impossible de supprimer votre propre compte.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()
    const { error: authError } = await admin.auth.admin.deleteUser(id)
    if (authError) {
      throw authError
    }

    const { error: profileError } = await admin.from('profiles').delete().eq('id', id)
    if (profileError) {
      console.error('[admin users] profile cleanup error', profileError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin users] delete error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
