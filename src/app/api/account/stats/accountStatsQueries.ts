import { useQuery } from '@tanstack/react-query'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'
import type { AccountStats } from '@/lib/account/stats'

export const ACCOUNT_STATS_QUERY_KEY = ['account', 'stats'] as const

const fetchAccountStats = async (): Promise<AccountStats> => {
  const send = async (forceRefresh: boolean) =>
    fetch('/api/account/stats', {
      cache: 'no-store',
      headers: await getClientAuthHeaders({ forceRefresh }),
      credentials: 'include',
    })

  let response = await send(false)
  if (response.status === 401) response = await send(true)
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Impossible de récupérer tes statistiques')
  }
  return (await response.json()) as AccountStats
}

export const useAccountStats = () =>
  useQuery<AccountStats, Error>({
    queryKey: ACCOUNT_STATS_QUERY_KEY,
    queryFn: fetchAccountStats,
    staleTime: 2 * 60 * 1000,
  })
