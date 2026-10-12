import { useEffect, useMemo, useState } from 'react'
import type { EventTicket, Participant } from '@/components/registration/types'
import { validateCheckout } from '@/lib/checkout/checkoutValidation'
import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import type { CheckoutConsents } from './useCheckoutConsents'

interface CheckoutValidationArgs {
  participants: Participant[]
  ticketCount: number
  eventDate: string
  ticketMap: Record<string, EventTicket>
  hasGroupAnchor: boolean
  consents: CheckoutConsents
  needsGroupAttestation: boolean
}

/**
 * Validates the checkout on every change. Errors stay hidden until the visitor
 * first tries to pay; then every problem shows and the page takes them to the
 * first one, focused for keyboards and screen readers.
 */
export function useCheckoutValidation({ participants, ticketCount, eventDate, ticketMap, hasGroupAnchor, consents, needsGroupAttestation }: CheckoutValidationArgs) {
  const validation = useMemo(
    () =>
      validateCheckout({
        participants,
        ticketCount,
        eventDate,
        ticketUsesWaveSelection: (ticketId) => {
          const ticket = ticketMap[ticketId]
          return ticket ? ticketUsesWaveSelection(ticket) : false
        },
        hasGroupAnchor,
        consents: {
          disclaimerRead: consents.disclaimerRead,
          rulebookAccepted: consents.rulebookAccepted,
          disclaimerAccepted: consents.disclaimerAccepted,
        },
        groupAttestation: needsGroupAttestation ? consents.groupAttestation : undefined,
        hasSignature: Boolean(consents.signatureImage),
      }),
    [participants, ticketCount, eventDate, ticketMap, hasGroupAnchor, consents, needsGroupAttestation],
  )
  const [showErrors, setShowErrors] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    if (focusRequest === 0 || !validation.firstInvalidId) return
    const target = document.getElementById(validation.firstInvalidId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.focus({ preventScroll: true })
    // Runs once per reveal request, after the errors have rendered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest])

  const revealErrors = () => {
    setShowErrors(true)
    setFocusRequest((count) => count + 1)
  }

  return { validation, showErrors, revealErrors }
}
