'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ACCOUNT_REGISTRATIONS_QUERY_KEY } from '@/app/api/account/registrations/accountRegistrationsQueries'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'
import { buildTransferUrl } from '@/lib/account/tickets'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'

const FEEDBACK_MS = 2500

export type TransferUiState = 'idle' | 'copied' | 'pending'

const requestCheckout = async (registrationId: string): Promise<{ url?: string; alreadyUnlocked?: boolean }> => {
  const send = async (forceRefresh: boolean) =>
    fetch(`/api/account/tickets/${registrationId}/transfer`, {
      method: 'POST',
      headers: { ...(await getClientAuthHeaders({ forceRefresh })), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ acceptTerms: true, waiveWithdrawal: true }),
    })

  let response = await send(false)
  if (response.status === 401) response = await send(true)
  const payload = (await response.json().catch(() => ({}))) as { url?: string; alreadyUnlocked?: boolean; error?: string }
  if (!response.ok) throw new Error(payload.error || 'Impossible de lancer le transfert.')
  return payload
}

/**
 * Hand a bib over: the first time the holder reads the transfer terms, waives
 * withdrawal and pays the fee on Stripe; once unlocked, one tap opens the native
 * share sheet (WhatsApp, SMS…) with the claim link, falling back to copying it.
 */
export function useTicketTransfer() {
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [consentTicket, setConsentTicket] = useState<AccountRegistrationItem | null>(null)

  useEffect(() => {
    if (!copiedId) return
    const timeout = setTimeout(() => setCopiedId(null), FEEDBACK_MS)
    return () => clearTimeout(timeout)
  }, [copiedId])

  const share = useCallback(async (ticket: AccountRegistrationItem) => {
    if (!ticket.transfer_token) return
    const url = buildTransferUrl(window.location.origin, ticket.transfer_token)
    const title = `Ton billet ${ticket.event_title ?? 'Overbound'}`

    if (typeof navigator.share === 'function') {
      try {
        // Everything goes in `text`, link last on its own line: targets that append `text` to
        // `url` (Messages, Mail, desktop browsers) would otherwise glue the message onto the link.
        await navigator.share({ text: `${title} — récupère-le ici :\n${url}` })
        return
      } catch (shareError) {
        // The user closing the sheet is not a failure; anything else falls through to copy.
        if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(ticket.registration_id)
    } catch (copyError) {
      console.error('Impossible de copier le lien de transfert', copyError)
    }
  }, [])

  const transfer = useCallback(
    async (ticket: AccountRegistrationItem) => {
      setError(null)
      if (ticket.transfer_unlocked) {
        await share(ticket)
        return
      }
      // Paying the fee requires the terms and the withdrawal waiver first.
      setConsentTicket(ticket)
    },
    [share],
  )

  const confirmConsent = useCallback(
    async () => {
      const ticket = consentTicket
      if (!ticket) return
      setConsentTicket(null)
      setPendingId(ticket.registration_id)
      try {
        const result = await requestCheckout(ticket.registration_id)
        if (result.url) {
          window.location.assign(result.url)
          return // keep the pending state while the browser leaves for Stripe
        }
        // Already paid elsewhere: refresh so the bib shows its "Envoyer" button.
        await queryClient.invalidateQueries({ queryKey: ACCOUNT_REGISTRATIONS_QUERY_KEY })
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : 'Impossible de lancer le transfert.')
      }
      setPendingId(null)
    },
    [consentTicket, queryClient],
  )

  const cancelConsent = useCallback(() => setConsentTicket(null), [])

  const stateFor = useCallback(
    (registrationId: string): TransferUiState =>
      pendingId === registrationId ? 'pending' : copiedId === registrationId ? 'copied' : 'idle',
    [copiedId, pendingId],
  )

  return { transfer, stateFor, error, consentTicket, confirmConsent, cancelConsent }
}
