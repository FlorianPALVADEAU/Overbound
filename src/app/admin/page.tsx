import { createSupabaseServer } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') return <div>Accès refusé</div>

  const { data: stats } = await supabase.rpc('admin_overview') // optionnel si tu crées une RPC
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <pre className="mt-4 bg-neutral-100 p-4 rounded">{JSON.stringify(stats, null, 2)}</pre>
    </main>
  )
}