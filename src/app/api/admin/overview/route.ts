import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { data: stats, error: statsError } = await supabase.rpc('admin_overview')

    if (statsError || !stats) {
      console.warn('[admin-overview] RPC admin_overview indisponible, fallback counts used:', statsError?.message)

      // Fallback minimal stats to avoid breaking the dashboard
      const [{ count: totalRegistrations }, { count: checkedInCount }] = await Promise.all([
        supabase.from('registrations').select('id', { count: 'exact', head: true }),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('checked_in', true),
      ])

      const { data: paidOrders } = await supabase
        .from('orders')
        .select('amount_total, status')
        .eq('status', 'paid')
        .eq('provider', 'stripe')

      const totalRevenueCents =
        paidOrders?.reduce((sum, order) => sum + (order.amount_total ?? 0), 0) ?? 0

      const { count: totalEvents } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })

      const nowIso = new Date().toISOString()
      const { count: upcomingEvents, data: nextEventRow } = await supabase
        .from('events')
        .select('id, title, date, location, capacity, registrations:registrations(count)')
        .gt('date', nowIso)
        .order('date', { ascending: true })
        .limit(1)

      const nextEvent =
        nextEventRow && nextEventRow.length > 0
          ? {
              ...nextEventRow[0],
              registrations_count: Array.isArray((nextEventRow as any)[0].registrations)
                ? (nextEventRow as any)[0].registrations[0]?.count ?? 0
                : 0,
            }
          : null

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
        },
        profile,
        stats: {
          total_revenue_cents: totalRevenueCents,
          total_registrations: totalRegistrations ?? 0,
          checked_in_count: checkedInCount ?? 0,
          total_events: totalEvents ?? 0,
          upcoming_events: upcomingEvents ?? 0,
          registrations_by_month: [],
          ticket_distribution: [],
          events_by_status: {},
          next_event: nextEvent,
          _fallback: true,
        },
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
      profile,
      stats: stats ?? null,
    })
  } catch (error) {
    console.error('[admin-overview] fetch error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
