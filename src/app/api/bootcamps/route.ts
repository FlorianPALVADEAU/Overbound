import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServer()
  const admin = supabaseAdmin()

  const { data: { user } } = await supabase.auth.getUser()

  // Utilise le client admin pour lire les counts sans être bloqué par la RLS
  const { data: bootcamps, error } = await admin
    .from('bootcamps')
    .select(`
      *,
      bootcamp_registrations(count)
    `)
    .order('starts_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let registeredIds = new Set<string>()

  if (user) {
    const { data: myRegs } = await supabase
      .from('bootcamp_registrations')
      .select('bootcamp_id')
      .eq('user_id', user.id)

    registeredIds = new Set((myRegs ?? []).map((r) => r.bootcamp_id))
  }

  const result = (bootcamps ?? []).map((b) => ({
    ...b,
    registration_count: Number((b.bootcamp_registrations as Array<{ count: number | string }>)[0]?.count ?? 0),
    is_registered: registeredIds.has(b.id),
    bootcamp_registrations: undefined,
  }))

  return NextResponse.json(result)
}
