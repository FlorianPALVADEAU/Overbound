import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { validateAvatarUpload } from '@/lib/account/avatar'
import { resetAvatarToProvider, saveUploadedAvatar } from '@/lib/account/avatarStorage'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

export const runtime = 'nodejs'

const handlePost = async (request: NextRequest) => {
  try {
    const user = await resolveRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Aucune photo reçue.' }, { status: 400 })

    const bytes = new Uint8Array(await file.arrayBuffer())
    const validation = validateAvatarUpload(bytes)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    const avatarUrl = await saveUploadedAvatar(supabaseAdmin(), user.id, bytes, validation.type)
    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (error) {
    console.error('[account avatar] upload error', error)
    return NextResponse.json({ error: 'Impossible d’enregistrer la photo.' }, { status: 500 })
  }
}

/** Removes the uploaded photo; the account falls back to its Google photo when it has one. */
const handleDelete = async (request: NextRequest) => {
  try {
    const user = await resolveRequestUser(request)
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const avatarUrl = await resetAvatarToProvider(supabaseAdmin(), user.id, user.user_metadata)
    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (error) {
    console.error('[account avatar] reset error', error)
    return NextResponse.json({ error: 'Impossible de retirer la photo.' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, { actionType: 'Photo de profil' })
export const DELETE = withRequestLogging(handleDelete, { actionType: 'Photo de profil' })
