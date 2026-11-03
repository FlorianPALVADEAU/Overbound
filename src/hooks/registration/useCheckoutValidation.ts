import { useEffect, useMemo, useState } from 'react'
import type { EventTicket, Participant } from '@/components/registration/types'
import { validateCheckout } from '@/lib/checkout/checkoutValidation'
import { ADULT_AGE } from '@/lib/checkout/participantAge'
import { isOpenFormatTicket } from '@/lib/openSas'
import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import type { TshirtOffer } from '@/lib/tshirtOffer'
import type { CheckoutConsents } from './useCheckoutConsents'

interface CheckoutValidationArgs {
  participants: Participant[]
  ticketCount: number
  eventDate: string
  /** `events.minimum_age`; an event that does not carry it admits adults only. */
  minimumAge?: number
  ticketMap: Record<string, EventTicket>
  hasGroupAnchor: boolean
  consents: CheckoutConsents
  needsGroupAttestation: boolean
  tshirtOffer?: TshirtOffer | null
}

/**
 * Validates the checkout on every change. Errors stay hidden until the visitor
 * first tries to pay; then every problem shows and the page takes them to the
 * first one, focused for keyboards and screen readers.
 */
export function useCheckoutValidation({ participants, ticketCount, eventDate, minimumAge = ADULT_AGE, ticketMap, hasGroupAnchor, consents, needsGroupAttestation, tshirtOffer }: CheckoutValidationArgs) {
  const validation = useMemo(
    () =>
      validateCheckout({
        participants,
        ticketCount,
        eventDate,
        minimumAge,
        ticketIsOpenFormat: (ticketId) => {
          const ticket = ticketMap[ticketId]
          return ticket ? isOpenFormatTicket(ticket.name, ticket.race?.name) : false
        },
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
        tshirtOffer,
      }),
    [participants, ticketCount, eventDate, minimumAge, ticketMap, hasGroupAnchor, consents, needsGroupAttestation, tshirtOffer],
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
