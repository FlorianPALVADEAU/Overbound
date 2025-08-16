import { createSupabaseServer } from '@/lib/supabase/server'
import QRCode from 'qrcode'

export default async function TicketPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: reg } = await supabase
    .from('registrations')
    .select('id, qr_code_token, tickets(name, events(title, date, location))')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!reg) return <div>Billet introuvable.</div>
  const dataUrl = await QRCode.toDataURL(reg.qr_code_token)

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">
        {reg.tickets?.[0]?.events?.[0]?.title} — {reg.tickets?.[0]?.name}
      </h1>
      <img src={dataUrl} alt="QR Code" className="w-48 h-48" />
      <p className="text-sm opacity-70">Présente ce QR au check‑in.</p>
    </main>
  )
}