import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Resend } from 'resend'
import TicketEmail from '@/emails/TicketEmail'

export async function GET() {
  const admin = supabaseAdmin()
  const now = new Date()
  const days = [1, 7]
  for (const d of days) {
    const target = new Date(now)
    target.setDate(target.getDate() + d)
    // Récup inscriptions pour events à target (arrondi jour)
    const start = new Date(target); start.setHours(0,0,0,0)
    const end = new Date(target); end.setHours(23,59,59,999)

    const { data: regs } = await admin.rpc('get_registrations_between', { start, end })
    // Crée une RPC côté DB ou jointures directes ici
    // Boucle d’envoi (attention au rate limiting)
  }
  return NextResponse.json({ ok: true })
}