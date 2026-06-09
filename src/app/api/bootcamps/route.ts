import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: bootcamps, error } = await supabase
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
    registration_count: (b.bootcamp_registrations as Array<{ count: number }>)[0]?.count ?? 0,
    is_registered: registeredIds.has(b.id),
    bootcamp_registrations: undefined,
  }))

  return NextResponse.json(result)
}
