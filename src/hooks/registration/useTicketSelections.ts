import { useMemo, useState, useCallback } from 'react'
import type { EventTicket, TicketSelections } from '@/components/registration/types'

export function useTicketSelections(tickets: EventTicket[]) {
  const [ticketSelections, setTicketSelections] = useState<TicketSelections>({})

  const ticketMap = useMemo(
    () => Object.fromEntries(tickets.map((t) => [t.id, t])) as Record<string, EventTicket>,
    [tickets],
  )

  const selectedTicketSlots = useMemo(() => {
    const slots: string[] = []
    Object.entries(ticketSelections).forEach(([ticketId, quantity]) => {
      for (let i = 0; i < quantity; i += 1) {
        slots.push(ticketId)
      }
    })
    return slots
  }, [ticketSelections])

  const totalParticipants = selectedTicketSlots.length

  const handleTicketQuantityChange = useCallback((ticketId: string, nextQuantity: number) => {
    setTicketSelections((prev) => {
      const clamped = Math.max(0, nextQuantity)
      const draft = { ...prev }
      if (clamped === 0) {
        delete draft[ticketId]
      } else {
        draft[ticketId] = clamped
      }
      return draft
    })
  }, [])

  return {
    ticketSelections,
    setTicketSelections,
    ticketMap,
    selectedTicketSlots,
    totalParticipants,
    handleTicketQuantityChange,
  }
}
