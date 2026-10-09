'use client'

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ACCOUNT_REGISTRATIONS_QUERY_KEY } from '@/app/api/account/registrations/accountRegistrationsQueries'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'

/** Cancels a "billet flexible" bib after an explicit confirmation, then refreshes the wallet. */
export function useFlexibleRefund() {
  const queryClient = useQueryClient()
  const [ticket, setTicket] = useState<AccountRegistrationItem | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestCancel = useCallback((selected: AccountRegistrationItem) => {
    setError(null)
    setTicket(selected)
  }, [])

  const close = useCallback(() => {
    if (!pending) setTicket(null)
  }, [pending])

  const confirm = useCallback(async () => {
    if (!ticket) return
    setPending(true)
    setError(null)
    try {
      const send = async (forceRefresh: boolean) =>
        fetch(`/api/account/tickets/${ticket.registration_id}/refund`, {
          method: 'POST',
          headers: { ...(await getClientAuthHeaders({ forceRefresh })), 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ confirm: true }),
        })
      let response = await send(false)
      if (response.status === 401) response = await send(true)
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Impossible d’annuler ce billet.')
      setTicket(null)
      await queryClient.invalidateQueries({ queryKey: ACCOUNT_REGISTRATIONS_QUERY_KEY })
    } catch (refundError) {
      setError(refundError instanceof Error ? refundError.message : 'Impossible d’annuler ce billet.')
    } finally {
      setPending(false)
    }
  }, [queryClient, ticket])

  return { ticket, pending, error, requestCancel, close, confirm }
}
