import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

const bootcampSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  location_name: z.string().min(1),
  location_address: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  starts_at: z.string().datetime({ offset: true }),
})

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

export async function GET() {
  const supabase = await createSupabaseServer()

  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('bootcamps')
    .select(`
      *,
      bootcamp_registrations(
        id,
        user_id,
        registered_at
      )
    `)
    .order('starts_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const allUserIds = (data ?? []).flatMap((b) =>
    (b.bootcamp_registrations as { user_id: string }[]).map((r) => r.user_id)
  )
  const uniqueUserIds = [...new Set(allUserIds)]

  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}

  if (uniqueUserIds.length > 0) {
    const [{ data: profiles }, { data: authUsers }] = await Promise.all([
      admin.from('profiles').select('id, full_name').in('id', uniqueUserIds),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ])

    const emailMap: Record<string, string> = {}
    for (const u of authUsers?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email
    }

    for (const p of profiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name, email: emailMap[p.id] ?? null }
    }
  }

  const result = (data ?? []).map((b) => {
    const registrants = (b.bootcamp_registrations as { id: string; user_id: string; registered_at: string }[]).map((r) => ({
      ...r,
      profile: profileMap[r.user_id] ?? null,
    }))
    return {
      ...b,
      registration_count: registrants.length,
      registrants,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()

  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = bootcampSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('bootcamps')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
