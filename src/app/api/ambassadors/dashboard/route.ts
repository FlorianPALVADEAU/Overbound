import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'
import {
  getNextReward,
  resolvePaymentStatus,
  resolveRaceFormat,
} from '@/lib/ambassadors/program'
import type {
  AmbassadorDashboardData,
  AmbassadorPaymentStatus,
  AmbassadorRaceFormat,
  AmbassadorRecruitRow,
  AmbassadorReward,
  AmbassadorRewardStatus,
} from '@/types/Ambassador'

export const runtime = 'nodejs'

const resolveRewardStatus = (value: string | null | undefined): AmbassadorRewardStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'claimed') return 'claimed'
  if (normalized === 'fulfilled') return 'fulfilled'
  return 'earned'
}

const inferFormatFromLabels = (ticketName: string | null | undefined, raceName: string | null | undefined) => {
  const haystack = `${ticketName || ''} ${raceName || ''}`.toLowerCase()
  if (haystack.includes('ranked')) {
    return 'ranked' as const
  }
  return 'open' as const
}

const pointsForFormat = (format: AmbassadorRaceFormat) => (format === 'ranked' ? 2 : 1)

const formatRecruitName = (fullName: string | null | undefined, email: string | null | undefined) => {
  const rawName = (fullName || '').trim()
  if (rawName) {
    const parts = rawName.split(/\s+/).filter(Boolean)
    const first = parts[0] ?? ''
    const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]?.toUpperCase() ?? ''}.` : ''
    return [first, lastInitial].filter(Boolean).join(' ').trim()
  }
  if (email) {
    const base = email.split('@')[0] || email
    return base
  }
  return 'Utilisateur'
}

const formatLeaderboardName = (fullName: string | null | undefined, profileId: string) => {
  const rawName = (fullName || '').trim()
  if (!rawName) {
    return `Ambassadeur ${profileId.slice(0, 4).toUpperCase()}`
  }
  const parts = rawName.split(/\s+/).filter(Boolean)
  const first = parts[0] ?? 'Ambassadeur'
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]?.toUpperCase() ?? ''}.` : ''
  return [first, lastInitial].filter(Boolean).join(' ').trim()
}

const getTicketDetails = (value: unknown) => {
  const rawTicket = Array.isArray(value) ? value[0] : value
  if (!rawTicket || typeof rawTicket !== 'object') {
    return { name: null, race_format: null, race_name: null }
  }

  const ticket = rawTicket as {
    name?: string | null
    race_format?: string | null
    race?: unknown
  }

  const rawRace = Array.isArray(ticket.race) ? ticket.race[0] : ticket.race
  const raceName =
    rawRace && typeof rawRace === 'object' ? ((rawRace as { name?: string | null }).name ?? null) : null

  return {
    name: ticket.name ?? null,
    race_format: ticket.race_format ?? null,
    race_name: raceName,
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[ambassador dashboard] profile error', profileError)
      return NextResponse.json({ error: 'Erreur profil' }, { status: 500 })
    }

    const role = profileData?.role ?? null
    if (!hasAmbassadorAccess({ role, email: user.email ?? null })) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()

    const { data: ambassadorData, error: ambassadorError } = await admin
      .from('ambassadors')
      .select('id, profile_id, promotional_code_id')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (ambassadorError) {
      console.error('[ambassador dashboard] ambassador error', ambassadorError)
      return NextResponse.json({ error: 'Erreur ambassadeur' }, { status: 500 })
    }

    const emptyResponse: AmbassadorDashboardData = {
      code: null,
      total_points: 0,
      points_breakdown: {
        open_count: 0,
        ranked_count: 0,
      },
      rewards: [],
      next_reward: getNextReward(0),
      leaderboard: {
        current_user_rank: null,
        total_ambassadors: 0,
        top: [],
      },
      recruits_table: [],
    }

    if (!ambassadorData) {
      return NextResponse.json(emptyResponse)
    }

    const ambassadorId = ambassadorData.id as string
    const promotionalCodeId = ambassadorData.promotional_code_id as string

    const { data: promoData, error: promoError } = await admin
      .from('promotional_codes')
      .select('code')
      .eq('id', promotionalCodeId)
      .maybeSingle()

    if (promoError) {
      console.error('[ambassador dashboard] promo error', promoError)
      return NextResponse.json({ error: 'Erreur code ambassadeur' }, { status: 500 })
    }

    const ambassadorCode = promoData?.code ?? null

    const { data: pointsData, error: pointsError } = await admin
      .from('ambassador_points')
      .select('total_points, recruits_open, recruits_ranked')
      .eq('ambassador_id', ambassadorId)
      .maybeSingle()

    if (pointsError) {
      console.error('[ambassador dashboard] points error', pointsError)
    }

    const { data: rewardsData, error: rewardsError } = await admin
      .from('ambassador_rewards')
      .select('id, reward_level, reward_name, status, earned_at, claimed_at, fulfilled_at')
      .eq('ambassador_id', ambassadorId)
      .order('reward_level', { ascending: true })

    if (rewardsError) {
      console.error('[ambassador dashboard] rewards error', rewardsError)
      return NextResponse.json({ error: 'Erreur récompenses' }, { status: 500 })
    }

    const rewards: AmbassadorReward[] = (rewardsData || []).map((row: any) => ({
      id: row.id,
      reward_level: row.reward_level,
      reward_name: row.reward_name,
      status: resolveRewardStatus(row.status),
      earned_at: row.earned_at,
      claimed_at: row.claimed_at,
      fulfilled_at: row.fulfilled_at,
    }))

    const { data: registrationsData, error: registrationsError } = await admin
      .from('registrations')
      .select(
        `
        id,
        user_id,
        email,
        created_at,
        order_id,
        ticket:tickets(
          name,
          race_format,
          race:races(name)
        )
      `,
      )
      .eq('promotional_code_id', promotionalCodeId)

    if (registrationsError) {
      console.error('[ambassador dashboard] registrations error', registrationsError)
      return NextResponse.json({ error: 'Erreur inscriptions' }, { status: 500 })
    }

    const registrationRows = (registrationsData || []) as unknown as Array<{
      id: string
      user_id: string | null
      email: string | null
      created_at: string | null
      order_id: string | null
      ticket: unknown
    }>

    const orderIds = Array.from(new Set(registrationRows.map((row) => row.order_id).filter(Boolean))) as string[]
    const profileIds = Array.from(new Set(registrationRows.map((row) => row.user_id).filter(Boolean))) as string[]

    const [{ data: ordersData, error: ordersError }, { data: profilesData, error: profilesError }] =
      await Promise.all([
        orderIds.length > 0
          ? admin.from('orders').select('id, status').in('id', orderIds)
          : Promise.resolve({ data: [], error: null }),
        profileIds.length > 0
          ? admin.from('profiles').select('id, full_name').in('id', profileIds)
          : Promise.resolve({ data: [], error: null }),
      ])

    if (ordersError) {
      console.error('[ambassador dashboard] orders error', ordersError)
      return NextResponse.json({ error: 'Erreur commandes' }, { status: 500 })
    }

    if (profilesError) {
      console.error('[ambassador dashboard] profiles error', profilesError)
      return NextResponse.json({ error: 'Erreur profils' }, { status: 500 })
    }

    const registrationIds = registrationRows.map((row) => row.id)

    const { data: pointEventsData, error: pointEventsError } = registrationIds.length > 0
      ? await admin
          .from('ambassador_points_events')
          .select('registration_id, points, race_format')
          .eq('ambassador_id', ambassadorId)
          .in('registration_id', registrationIds)
      : { data: [], error: null }

    if (pointEventsError) {
      console.error('[ambassador dashboard] point events error', pointEventsError)
      return NextResponse.json({ error: 'Erreur points' }, { status: 500 })
    }

    const ordersMap = new Map<string, AmbassadorPaymentStatus>()
    for (const row of (ordersData || []) as Array<{ id: string; status: string | null }>) {
      ordersMap.set(row.id, resolvePaymentStatus(row.status))
    }

    const profilesMap = new Map<string, string | null>()
    for (const row of (profilesData || []) as Array<{ id: string; full_name: string | null }>) {
      profilesMap.set(row.id, row.full_name)
    }

    const eventsMap = new Map<string, { points: number; race_format: AmbassadorRaceFormat }>()
    for (const row of (pointEventsData || []) as Array<{
      registration_id: string
      points: number
      race_format: string
    }>) {
      eventsMap.set(row.registration_id, {
        points: row.points,
        race_format: resolveRaceFormat(row.race_format),
      })
    }

    const recruitsTable: AmbassadorRecruitRow[] = registrationRows
      .map((row) => {
        const ticketDetails = getTicketDetails(row.ticket)
        const inferredFormat = resolveRaceFormat(
          ticketDetails.race_format || inferFormatFromLabels(ticketDetails.name, ticketDetails.race_name),
        )
        const paymentStatus = row.order_id ? ordersMap.get(row.order_id) || 'pending' : 'pending'
        const pointEvent = eventsMap.get(row.id)

        const points =
          paymentStatus === 'paid'
            ? pointEvent?.points ?? pointsForFormat(pointEvent?.race_format ?? inferredFormat)
            : 0

        return {
          id: row.id,
          name: formatRecruitName(
            row.user_id ? profilesMap.get(row.user_id) : null,
            row.email ?? null,
          ),
          signup_date: row.created_at,
          race_format: pointEvent?.race_format ?? inferredFormat,
          payment_status: paymentStatus,
          points,
          order_id: row.order_id,
        }
      })
      .sort((a, b) => {
        const aTime = a.signup_date ? new Date(a.signup_date).getTime() : 0
        const bTime = b.signup_date ? new Date(b.signup_date).getTime() : 0
        return bTime - aTime
      })

    const totalPoints = pointsData?.total_points ?? recruitsTable.reduce((sum, row) => sum + row.points, 0)
    const openCount =
      pointsData?.recruits_open ?? recruitsTable.filter((row) => row.race_format === 'open' && row.points > 0).length
    const rankedCount =
      pointsData?.recruits_ranked ??
      recruitsTable.filter((row) => row.race_format === 'ranked' && row.points > 0).length

    const { data: activeAmbassadorsData, error: activeAmbassadorsError } = await admin
      .from('ambassadors')
      .select('id, profile_id')
      .eq('is_active', true)

    if (activeAmbassadorsError) {
      console.error('[ambassador dashboard] active ambassadors error', activeAmbassadorsError)
      return NextResponse.json({ error: 'Erreur classement' }, { status: 500 })
    }

    const activeAmbassadors = (activeAmbassadorsData || []) as Array<{ id: string; profile_id: string }>
    const activeAmbassadorIds = activeAmbassadors.map((row) => row.id)
    const activeProfileIds = activeAmbassadors.map((row) => row.profile_id)

    const [{ data: leaderboardPointsData, error: leaderboardPointsError }, { data: leaderboardProfilesData, error: leaderboardProfilesError }] =
      await Promise.all([
        activeAmbassadorIds.length > 0
          ? admin
              .from('ambassador_points')
              .select('ambassador_id, total_points')
              .in('ambassador_id', activeAmbassadorIds)
          : Promise.resolve({ data: [], error: null }),
        activeProfileIds.length > 0
          ? admin
              .from('profiles')
              .select('id, full_name')
              .in('id', activeProfileIds)
          : Promise.resolve({ data: [], error: null }),
      ])

    if (leaderboardPointsError) {
      console.error('[ambassador dashboard] leaderboard points error', leaderboardPointsError)
      return NextResponse.json({ error: 'Erreur classement' }, { status: 500 })
    }

    if (leaderboardProfilesError) {
      console.error('[ambassador dashboard] leaderboard profiles error', leaderboardProfilesError)
      return NextResponse.json({ error: 'Erreur classement' }, { status: 500 })
    }

    const leaderboardPointsMap = new Map<string, number>()
    for (const row of (leaderboardPointsData || []) as Array<{ ambassador_id: string; total_points: number | null }>) {
      leaderboardPointsMap.set(row.ambassador_id, Number(row.total_points ?? 0))
    }

    const leaderboardProfileNameMap = new Map<string, string | null>()
    for (const row of (leaderboardProfilesData || []) as Array<{ id: string; full_name: string | null }>) {
      leaderboardProfileNameMap.set(row.id, row.full_name)
    }

    const leaderboardRows = activeAmbassadors
      .map((row) => ({
        ambassador_id: row.id,
        profile_id: row.profile_id,
        points: leaderboardPointsMap.get(row.id) ?? 0,
        name: formatLeaderboardName(leaderboardProfileNameMap.get(row.profile_id), row.profile_id),
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return a.name.localeCompare(b.name, 'fr')
      })

    const rankedLeaderboard = leaderboardRows.map((row, index) => ({
      rank: index + 1,
      name: row.name,
      points: row.points,
      is_current_user: row.ambassador_id === ambassadorId,
      ambassador_id: row.ambassador_id,
    }))

    const currentUserLeaderboardRow = rankedLeaderboard.find((row) => row.is_current_user) ?? null
    const leaderboardTop = rankedLeaderboard.slice(0, 10).map(({ rank, name, points, is_current_user }) => ({
      rank,
      name,
      points,
      is_current_user,
    }))

    const response: AmbassadorDashboardData = {
      code: ambassadorCode,
      total_points: totalPoints,
      points_breakdown: {
        open_count: openCount,
        ranked_count: rankedCount,
      },
      rewards,
      next_reward: getNextReward(totalPoints),
      leaderboard: {
        current_user_rank: currentUserLeaderboardRow?.rank ?? null,
        total_ambassadors: rankedLeaderboard.length,
        top: leaderboardTop,
      },
      recruits_table: recruitsTable,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[ambassador dashboard] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
