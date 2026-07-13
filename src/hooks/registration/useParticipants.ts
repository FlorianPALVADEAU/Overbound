import { useCallback, useEffect, useState, type RefObject } from 'react'
import type { EventUser, Participant } from '@/components/registration/types'

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

      let next = previous.slice(0, selectedTicketSlots.length)

      if (next.length < selectedTicketSlots.length) {
        const startIndex = next.length
        const newParticipants = selectedTicketSlots
          .slice(startIndex)
          .map((ticketId, index) => ({
            id: `participant-${startIndex + index + 1}`,
            ticketId,
            firstName: '',
            lastName: '',
            email: index === 0 && user?.email ? user.email : '',
            birthDate: index === 0 && user?.date_of_birth ? user.date_of_birth : '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            medicalInfo: '',
            licenseNumber: '',
            distanceIdealKm: '',
            distanceMinKm: '',
            difficultyLevel: null as Participant['difficultyLevel'],
          }))
        next = [...next, ...newParticipants]
      } else {
        next = next.map((participant, index) => ({
          ...participant,
          ticketId: selectedTicketSlots[index] ?? participant.ticketId,
        }))
      }

      return next
    })
    // suppressEmptySyncRef is a ref read for its current value, not a reactive dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketSlots, user?.email, user?.date_of_birth])

  // Backfill slot 0 once a guest authenticates mid-flow, without overwriting user edits
  useEffect(() => {
    if (!user) return

    setParticipants((previous) => {
      if (previous.length === 0) return previous
      const first = previous[0]
      const nextEmail = !first.email && user.email ? user.email : first.email
      const nextBirthDate = !first.birthDate && user.date_of_birth ? user.date_of_birth : first.birthDate

      if (nextEmail === first.email && nextBirthDate === first.birthDate) return previous

      return [{ ...first, email: nextEmail, birthDate: nextBirthDate }, ...previous.slice(1)]
    })
  }, [user])

  const handleParticipantChange = useCallback(
    (participantId: string, field: keyof Participant, value: string) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, [field]: value } : p)),
      )
    },
    [],
  )

  return { participants, setParticipants, handleParticipantChange }
}
