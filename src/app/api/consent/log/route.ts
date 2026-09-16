import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

const consentLogBodySchema = z.object({
  analyticsAccepted: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = consentLogBodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = supabaseAdmin()
    const { error } = await admin.from('cookie_consent_logs').insert({
      analytics_accepted: parsed.data.analyticsAccepted,
      ip_address:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        null,
      user_agent: request.headers.get('user-agent'),
      user_id: user?.id ?? null,
    })

    if (error) {
      console.error('[consent log] insert error', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[consent log] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
