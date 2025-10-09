import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServer()
    const { id } = await params
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('id, qr_code_token, tickets(name, events(title, date, location))')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !registration) {
      return NextResponse.json({ error: 'Billet introuvable' }, { status: 404 })
    }

    const dataUrl = registration.qr_code_token
      ? await QRCode.toDataURL(registration.qr_code_token)
      : null

    return NextResponse.json({
      registration,
      qr_code_data_url: dataUrl,
    })
  } catch (err) {
    console.error('[ticket detail] unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
