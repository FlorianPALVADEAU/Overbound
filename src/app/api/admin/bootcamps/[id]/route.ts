import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'

const bootcampUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  location_name: z.string().min(1).optional(),
  location_address: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  starts_at: z.string().datetime({ offset: true }).optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServer>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role ?? '')) return null
  return user
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = bootcampUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('bootcamps')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { error } = await supabase.from('bootcamps').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
