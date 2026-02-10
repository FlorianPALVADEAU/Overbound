import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const notifySchema = z.object({
  email: z.string().email('Email invalide').optional(),
  full_name: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const parsed = notifySchema.parse(body)

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const email = (parsed.email ?? user?.email ?? '').toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const { data: event, error: eventError } = await admin
      .from('events')
      .select('id, status, sales_start')
      .eq(isUUID ? 'id' : 'slug', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    }

    const now = new Date()
    const salesStart = event.sales_start ? new Date(event.sales_start) : null
    const isOpeningInFuture = salesStart ? salesStart > now : false

    if (event.status !== 'announced' && !isOpeningInFuture) {
      return NextResponse.json({ error: 'Inscriptions déjà ouvertes' }, { status: 400 })
    }

    const fullName =
      parsed.full_name?.trim() ||
      (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
      null

    const { error: insertError } = await admin
      .from('event_opening_notifications')
      .upsert(
        {
          event_id: event.id,
          user_id: user?.id ?? null,
          email,
          full_name: fullName,
          source: 'event-page',
        },
        {
          onConflict: 'event_id,email',
          ignoreDuplicates: true,
        },
      )

    if (insertError) {
      console.error('[event notify] insert error', insertError)
      return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    console.error('[event notify] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
