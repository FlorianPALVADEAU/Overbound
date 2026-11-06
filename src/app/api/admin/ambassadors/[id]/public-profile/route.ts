import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { resetAvatarToProvider } from '@/lib/account/avatarStorage'

export const runtime = 'nodejs'

const bodySchema = z
  .object({
    /** true hides the ambassador from the public page, false lets the opt-in apply again. */
    blocked: z.boolean().optional(),
    /** Deletes the uploaded photo (the account falls back to no photo here). */
    remove_photo: z.literal(true).optional(),
    /** Erases the written description. */
    clear_bio: z.literal(true).optional(),
    /** Stops showing the group (name and invite code) on the public page. */
    hide_group: z.literal(true).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: 'Aucune action demandée.' })

/** Moderation of the public ambassador page: hide someone, or remove their photo. */
async function handlePatch(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })

    const admin = supabaseAdmin()
    const { data: ambassador, error } = await admin.from('ambassadors').select('id, profile_id').eq('id', id).maybeSingle()
    if (error) throw error
    if (!ambassador) return NextResponse.json({ error: 'Ambassadeur introuvable.' }, { status: 404 })

    if (parsed.data.blocked !== undefined) {
      const { error: updateError } = await admin.from('ambassadors').update({ public_blocked: parsed.data.blocked }).eq('id', id)
      if (updateError) throw updateError
    }
    if (parsed.data.remove_photo) {
      await resetAvatarToProvider(admin, ambassador.profile_id, null)
    }
    const profileChanges = {
      ...(parsed.data.clear_bio ? { public_bio: null } : {}),
      ...(parsed.data.hide_group ? { public_show_group: false } : {}),
    }
    if (Object.keys(profileChanges).length > 0) {
      const { error: profileError } = await admin.from('ambassadors').update(profileChanges).eq('id', id)
      if (profileError) throw profileError
    }
    revalidatePath('/ambassadors')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin ambassadors public profile] error', error)
    return NextResponse.json({ error: 'Impossible de modifier la page publique.' }, { status: 500 })
  }
}

export const PATCH = withRequestLogging(handlePatch, { actionType: 'Page publique ambassadeur admin' })
