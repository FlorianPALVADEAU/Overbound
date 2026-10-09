'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ACCOUNT_REGISTRATIONS_QUERY_KEY } from '@/app/api/account/registrations/accountRegistrationsQueries'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'

type NoticeState =
  | { kind: 'hidden' }
  | { kind: 'cancelled' }
  | { kind: 'confirming' }
  | { kind: 'unlocked' }
  | { kind: 'failed'; message: string }

const confirmPayment = async (sessionId: string) => {
  const send = async (forceRefresh: boolean) =>
    fetch('/api/account/transfers/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getClientAuthHeaders({ forceRefresh })) },
      body: JSON.stringify({ session_id: sessionId }),
      credentials: 'include',
    })

  let response = await send(false)
  if (response.status === 401) response = await send(true)
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Activation impossible.')
  }
}

/**
 * Shown when Stripe sends the holder back after paying (or abandoning) the transfer
 * fee. The payment is confirmed straight from the return URL, so the bib shows
 * "Envoyer" immediately instead of waiting for a webhook.
 */
export function TransferReturnNotice() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<NoticeState>({ kind: 'hidden' })
  const sessionId = useRef<string | null>(null)

  const confirm = useCallback(async () => {
    if (!sessionId.current) return
    setState({ kind: 'confirming' })
    try {
      await confirmPayment(sessionId.current)
      await queryClient.invalidateQueries({ queryKey: ACCOUNT_REGISTRATIONS_QUERY_KEY })
      setState({ kind: 'unlocked' })
      // The session id has done its job; keep it out of the address bar and the history.
      window.history.replaceState(null, '', window.location.pathname)
    } catch (error) {
      setState({ kind: 'failed', message: error instanceof Error ? error.message : 'Activation impossible.' })
    }
  }, [queryClient])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const outcome = params.get('transfer')
    if (outcome === 'cancelled') {
      setState({ kind: 'cancelled' })
    } else if (outcome === 'success' && params.get('session_id')) {
      sessionId.current = params.get('session_id')
      void confirm()
    }
  }, [confirm])

  if (state.kind === 'hidden') return null

  const message = {
    cancelled: 'Paiement annulé : rien n’a été débité.',
    confirming: 'Paiement reçu, activation du transfert…',
    unlocked: 'Transfert débloqué. Touche « Envoyer » sur le dossard pour partager le lien.',
    failed: `${state.kind === 'failed' ? state.message : ''} Ton paiement n’est pas perdu : réessaie, ou contacte-nous.`,
  }[state.kind]

  return (
    <p role="status" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold ring-1 ring-primary/30">
      <span>{message}</span>
      {state.kind === 'failed' ? (
        <button type="button" onClick={confirm} className="min-h-8 font-bold text-primary underline-offset-4 hover:underline">
          Réessayer
        </button>
      ) : null}
    </p>
  )
}
