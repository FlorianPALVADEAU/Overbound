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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()
    const { data: upsells, error: fetchError } = await admin
      .from('upsells')
      .select(
        `*,
        event:events(id, title, date),
        images:upsell_images(*)`
      )
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    return NextResponse.json({ upsells })
  } catch (error) {
    console.error('Erreur GET upsells:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const parsed = adminUpsellPayloadSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })

    const admin = supabaseAdmin()
    const insertPayload = toUpsellWritePayload(parsed.data)

    const { data: upsell, error: insertError } = await admin
      .from('upsells')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) throw insertError
    await replaceExternalUpsellImages(admin, upsell.id, parsed.data.images)

    const data = await fetchUpsell(upsell.id)
    return NextResponse.json({ upsell: data })
  } catch (error) {
    console.error('Erreur POST upsell:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création upsell admin',
})
