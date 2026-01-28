import { useCallback, useEffect, useState } from 'react'
import type { EventUser, Participant } from '@/components/registration/types'

export function useParticipants(
  selectedTicketSlots: string[],
  user: EventUser | null,
) {
  const [participants, setParticipants] = useState<Participant[]>([])

  useEffect(() => {
    setParticipants((previous) => {
      if (selectedTicketSlots.length === 0) return []

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
  }, [selectedTicketSlots, user?.email, user?.date_of_birth])

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
