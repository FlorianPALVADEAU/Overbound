import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { adminUpsellPayloadSchema, replaceExternalUpsellImages, toUpsellWritePayload } from '@/lib/upsells/adminPayload'

async function fetchUpsell(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('upsells')
    .select(
      `*,
      event:events(id, title, date),
      images:upsell_images(*)`
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

const handlePut = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const parsed = adminUpsellPayloadSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })

    const admin = supabaseAdmin()
    const updatePayload = { ...toUpsellWritePayload(parsed.data), updated_at: new Date().toISOString() }

    const { data: upsell, error: updateError } = await admin
      .from('upsells')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError
    await replaceExternalUpsellImages(admin, upsell.id, parsed.data.images)

    const data = await fetchUpsell(upsell.id)
    return NextResponse.json({ upsell: data })
  } catch (error) {
    console.error('Erreur PUT upsell:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handleDelete = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const { id } = await params
    const admin = supabaseAdmin()

    const { error: deleteError } = await admin
      .from('upsells')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE upsell:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour upsell admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression upsell admin',
})
