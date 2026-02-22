import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

const MAX_USERS = 5000
const PAGE_SIZE = 1000

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const admin = supabaseAdmin()
    const allUsers: Array<{
      id: string
      email: string | null
      created_at: string
      last_sign_in_at: string | null
    }> = []

    for (let page = 1; ; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
      if (error) {
        throw error
      }

      const users = data.users || []
      for (const authUser of users) {
        allUsers.push({
          id: authUser.id,
          email: authUser.email ?? null,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at ?? null,
        })
      }

      if (users.length < PAGE_SIZE || allUsers.length >= MAX_USERS) {
        break
      }
    }

    const userIds = allUsers.map((u) => u.id)
    const profilesMap = new Map<
      string,
      {
        full_name: string | null
        role: string | null
        phone: string | null
        created_at: string
        date_of_birth: string | null
        marketing_opt_in: boolean | null
      }
    >()
    const ambassadorsMap = new Map<
      string,
      {
        promotional_code_id: string | null
        code: string | null
        code_is_active: boolean | null
      }
    >()

    if (userIds.length > 0) {
      const chunks = chunkArray(userIds, 1000)
      for (const chunk of chunks) {
        const { data: profiles } = await admin
          .from('profiles')
          .select('id, full_name, role, phone, created_at, date_of_birth, marketing_opt_in')
          .in('id', chunk)
        profiles?.forEach((row) => {
          profilesMap.set(row.id, {
            full_name: row.full_name ?? null,
            role: row.role ?? null,
            phone: row.phone ?? null,
            created_at: row.created_at,
            date_of_birth: row.date_of_birth ?? null,
            marketing_opt_in: row.marketing_opt_in ?? null,
          })
        })
      }

      const { data: ambassadors } = await admin
        .from('ambassadors')
        .select('profile_id, promotional_code_id, promo:promotional_codes(code, is_active)')
        .in('profile_id', userIds)

      ambassadors?.forEach((row: any) => {
        const promo = Array.isArray(row.promo) ? row.promo?.[0] : row.promo
        ambassadorsMap.set(row.profile_id, {
          promotional_code_id: row.promotional_code_id ?? null,
          code: promo?.code ?? null,
          code_is_active: promo?.is_active ?? null,
        })
      })
    }

    const usersWithProfiles = allUsers.map((authUser) => {
      const profileData = profilesMap.get(authUser.id)
      const ambassadorData = ambassadorsMap.get(authUser.id)
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        full_name: profileData?.full_name ?? null,
        role: profileData?.role ?? 'user',
        phone: profileData?.phone ?? null,
        profile_created_at: profileData?.created_at ?? null,
        date_of_birth: profileData?.date_of_birth ?? null,
        marketing_opt_in: profileData?.marketing_opt_in ?? null,
        ambassador_promotional_code_id: ambassadorData?.promotional_code_id ?? null,
        ambassador_code: ambassadorData?.code ?? null,
        ambassador_code_is_active: ambassadorData?.code_is_active ?? null,
      }
    })

    return NextResponse.json({
      users: usersWithProfiles,
      total: usersWithProfiles.length,
    })
  } catch (error) {
    console.error('[admin users] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
