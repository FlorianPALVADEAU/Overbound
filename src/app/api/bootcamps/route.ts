import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { loadPublicBootcamps } from '@/lib/bootcamps/loadPublicBootcamps'

export async function GET() {
  let bootcamps
  try {
    bootcamps = await loadPublicBootcamps()
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 })
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(bootcamps)

  const { data: myRegs } = await supabase
    .from('bootcamp_registrations')
    .select('bootcamp_id')
    .eq('user_id', user.id)

  const registeredIds = new Set((myRegs ?? []).map((r) => r.bootcamp_id))
  return NextResponse.json(bootcamps.map((b) => ({ ...b, is_registered: registeredIds.has(b.id) })))
}
