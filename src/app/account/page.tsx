import { createSupabaseServer } from '@/lib/supabase/server'

export default async function AccountPage() {
  const supabase = createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>Connecte‑toi pour voir tes inscriptions.</div>

  const { data: regs } = await supabase
    .from('registrations')
    .select('id, checked_in, qr_code_token, tickets(name, events(title, date, location))')
    .eq('user_id', user.id)

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Mes inscriptions</h1>
      <ul className="space-y-2">
        {regs?.map((r) => (
          <li key={r.id} className="border rounded p-4">
            {r.tickets?.map((ticket, i) => (
              <div key={i}>
                <div className="font-medium">
                  {ticket.name}
                  {ticket.events?.map((event, j) => (
                    <span key={j}> — {event.title}</span>
                  ))}
                </div>
                <div className="text-sm opacity-70">
                  {ticket.events?.map((event, j) => (
                    <span key={j}>
                      {new Date(event.date).toLocaleString()} — {event.location}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <a className="underline" href={`/account/ticket/${r.id}`}>Voir le billet</a>
          </li>
        ))}
      </ul>
    </main>
  )
}