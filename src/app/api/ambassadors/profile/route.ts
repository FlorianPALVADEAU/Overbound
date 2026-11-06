import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { isPubliclyListed, normalizeBio, PUBLIC_BIO_MAX } from '@/lib/ambassadors/publicProfile'
import { loadGroupsByProfile } from '@/lib/ambassadors/publicGroup'

export const runtime = 'nodejs'

const bodySchema = z
  .object({
    public_opt_in: z.boolean().optional(),
    public_bio: z.string().max(PUBLIC_BIO_MAX * 2).optional(),
    public_show_group: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: 'Aucun changement.' })

const SELECT = 'id, is_active, public_opt_in, public_blocked, public_bio, public_show_group'

type Row = {
  is_active: boolean
  public_opt_in: boolean
  public_blocked: boolean
  public_bio: string | null
  public_show_group: boolean
}

const toResponse = async (row: Row, profileId: string) => {
  const group = (await loadGroupsByProfile(supabaseAdmin(), [profileId])).get(profileId) ?? null
  return {
    public_opt_in: row.public_opt_in,
    public_blocked: row.public_blocked,
    is_listed: isPubliclyListed(row),
    public_bio: row.public_bio,
    public_show_group: row.public_show_group,
    group,
  }
}

/** Whether the signed-in ambassador appears on the public page. */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data, error } = await supabaseAdmin().from('ambassadors').select(SELECT).eq('profile_id', user.id).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Aucun compte ambassadeur.' }, { status: 404 })
    return NextResponse.json(await toResponse(data, user.id))
  } catch (error) {
    console.error('[ambassador profile] read error', error)
    return NextResponse.json({ error: 'Impossible de charger ta page publique.' }, { status: 500 })
  }
}

/** The ambassador agrees, or stops agreeing, to appear on the public page. */
const handlePatch = async (request: NextRequest) => {
  try {
    const user = await resolveRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Choix invalide.' }, { status: 400 })

    const { public_opt_in, public_bio, public_show_group } = parsed.data
    const bio = public_bio === undefined ? undefined : normalizeBio(public_bio)
    if (bio && bio.length > PUBLIC_BIO_MAX) return NextResponse.json({ error: `${PUBLIC_BIO_MAX} caractères maximum.` }, { status: 400 })

    const { data, error } = await supabaseAdmin()
      .from('ambassadors')
      .update({
        ...(public_opt_in !== undefined ? { public_opt_in } : {}),
        ...(bio !== undefined ? { public_bio: bio } : {}),
        ...(public_show_group !== undefined ? { public_show_group } : {}),
      })
      .eq('profile_id', user.id)
      .select(SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Aucun compte ambassadeur.' }, { status: 404 })
    // The public page is cached for an hour: refresh it so the change shows at once.
    revalidatePath('/ambassadors')
    return NextResponse.json(await toResponse(data, user.id))
  } catch (error) {
    console.error('[ambassador profile] update error', error)
    return NextResponse.json({ error: 'Impossible d’enregistrer ton choix.' }, { status: 500 })
  }
}

export const PATCH = withRequestLogging(handlePatch, { actionType: 'Page publique ambassadeur' })
