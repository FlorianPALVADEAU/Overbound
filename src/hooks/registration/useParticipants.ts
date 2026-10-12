import { useCallback, useEffect, useState, type RefObject } from 'react'
import type { EventUser, Participant } from '@/components/registration/types'
import { splitFullName } from '@/lib/checkout/fullName'

/** A blank bib; the first one is prefilled with the buyer's account details. */
const emptyParticipant = (position: number, ticketId: string, buyer: EventUser | null): Participant => {
  const name = splitFullName(buyer?.fullName)
  return {
    id: `participant-${position + 1}`,
    ticketId,
    firstName: name.firstName,
    lastName: name.lastName,
    email: buyer?.email ?? '',
    birthDate: buyer?.date_of_birth ?? '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalInfo: '',
    healthDataConsent: false,
    flexible: false,
    selectedWaveIndex: null,
  }
}

export function useParticipants(
  selectedTicketSlots: string[],
  user: EventUser | null,
  suppressEmptySyncRef?: RefObject<boolean>,
) {
  const [participants, setParticipants] = useState<Participant[]>([])

  useEffect(() => {
    setParticipants((previous) => {
      if (selectedTicketSlots.length === 0) {
        // A draft restore may set participants and ticketSelections in separate
        // renders; skip the wipe on the transient render where slots haven't
        // caught up yet, so the restored participants aren't lost mid-flight.
        if (suppressEmptySyncRef?.current && previous.length > 0) return previous
        return []
      }

      // Bibs follow the ticket slots one by one: keep who is typed, re-attach them to their slot, add blanks.
      const kept = previous.slice(0, selectedTicketSlots.length).map((participant, index) => {
        const ticketId = selectedTicketSlots[index] as string
        // SAS belong to a ticket: a bib that changes ticket must pick its SAS again.
        return ticketId === participant.ticketId ? participant : { ...participant, ticketId, selectedWaveIndex: null }
      })
      const added = selectedTicketSlots
        .slice(kept.length)
        .map((ticketId, offset) => emptyParticipant(kept.length + offset, ticketId, kept.length + offset === 0 ? user : null))
      const next = [...kept, ...added]
      return next
    })
    // suppressEmptySyncRef is a ref read for its current value, not a reactive dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketSlots, user?.email, user?.date_of_birth, user?.fullName])

  // Backfill slot 0 once a guest authenticates mid-flow, without overwriting user edits
  useEffect(() => {
    if (!user) return

    setParticipants((previous) => {
      if (previous.length === 0) return previous
      const first = previous[0]
      const name = splitFullName(user.fullName)
      const filled = {
        ...first,
        firstName: first.firstName || name.firstName,
        lastName: first.lastName || name.lastName,
        email: first.email || user.email || '',
        birthDate: first.birthDate || user.date_of_birth || '',
      }
      const unchanged = (['firstName', 'lastName', 'email', 'birthDate'] as const).every((key) => filled[key] === first[key])
      return unchanged ? previous : [filled, ...previous.slice(1)]
    })
  }, [user])

  const handleParticipantChange = useCallback(
    (participantId: string, field: keyof Participant, value: string | boolean) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, [field]: value } : p)),
      )
    },
    [],
  )

  const handleWaveSelection = useCallback((participantId: string, waveIndex: number | null) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, selectedWaveIndex: waveIndex } : p)),
    )
  }, [])

  return { participants, setParticipants, handleParticipantChange, handleWaveSelection }
}
