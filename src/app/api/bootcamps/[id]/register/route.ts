import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendBootcampRegistrationEmail } from '@/lib/email/bootcamps'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, { params }: RouteContext) {
  const { id: bootcampId } = await params
  const supabase = await createSupabaseServer()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: bootcamp, error: bootcampError } = await supabase
    .from('bootcamps')
    .select('id, title, starts_at, location_name, location_address')
    .eq('id', bootcampId)
    .single()

  if (bootcampError || !bootcamp) {
    return NextResponse.json({ error: 'Bootcamp introuvable' }, { status: 404 })
  }

  const { error: insertError } = await supabase
    .from('bootcamp_registrations')
    .insert({ bootcamp_id: bootcampId, user_id: user.id })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Déjà inscrit à ce bootcamp' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (user.email) {
    await sendBootcampRegistrationEmail({
      to: user.email,
      fullName: profile?.full_name ?? null,
      bootcampTitle: bootcamp.title,
      startsAt: bootcamp.starts_at,
      locationName: bootcamp.location_name,
      locationAddress: bootcamp.location_address ?? null,
    }).catch((err) => {
      console.error('[bootcamp] email send failed', err)
    })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id: bootcampId } = await params
  const supabase = await createSupabaseServer()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { error } = await supabase
    .from('bootcamp_registrations')
    .delete()
    .eq('bootcamp_id', bootcampId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
