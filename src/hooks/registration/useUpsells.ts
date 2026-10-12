import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EventUpsell, Participant, SelectedUpsellState } from '@/components/registration/types'
import { joinName, resolveUpsellSizes } from '@/lib/registration'
import {
  pruneAssignments,
  readAssignments,
  setParticipantQuantity,
  totalQuantity,
  upsellMaxPerParticipant,
  type UpsellAssignment,
} from '@/lib/upsells/assignments'
import { summarizeUpsells } from '@/lib/upsells/summary'

/**
 * Options chosen per participant: every selection is a list of assignments
 * ("this participant takes N"), stored in `meta.assignments`. The entry's
 * `quantity` is always the sum, so pricing keeps working on totals.
 */
export function useUpsells(
  upsells: EventUpsell[],
  _selectedTicketSlots: string[],
  participants: Participant[],
  defaultCurrency: string,
) {
  const [selectedUpsells, setSelectedUpsells] = useState<SelectedUpsellState>({})
  const participantIds = useMemo(() => participants.map((participant) => participant.id), [participants])
  const participantKey = participantIds.join('|')

  const write = useCallback(
    (previous: SelectedUpsellState, upsellId: string, assignments: UpsellAssignment[]): SelectedUpsellState => {
      if (assignments.length === 0) {
        if (!previous[upsellId]) return previous
        const { [upsellId]: _removed, ...rest } = previous
        return rest
      }
      return { ...previous, [upsellId]: { quantity: totalQuantity(assignments), meta: { assignments } } }
    },
    [],
  )

  // Keep selections in line with the order: a removed ticket takes its options
  // with it, and every t-shirt always has a size.
  useEffect(() => {
    setSelectedUpsells((previous) => {
      let next = previous
      for (const [upsellId, entry] of Object.entries(previous)) {
        const upsell = upsells.find((item) => item.id === upsellId)
        if (!upsell) {
          const { [upsellId]: _removed, ...rest } = next
          next = rest
          continue
        }
        const max = upsellMaxPerParticipant(upsell.type)
        const sizes = upsell.type === 'tshirt' ? resolveUpsellSizes(upsell) : []
        const current = readAssignments(entry.meta)
        const cleaned = pruneAssignments(current, participantIds, max).map((assignment) =>
          upsell.type === 'tshirt' && !sizes.includes(assignment.size ?? '')
            ? { ...assignment, size: sizes[0] }
            : assignment,
        )
        if (JSON.stringify(cleaned) !== JSON.stringify(current) || entry.quantity !== totalQuantity(cleaned)) {
          next = write(next, upsellId, cleaned)
        }
      }
      return next
    })
    // participantKey stands for participantIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantKey, upsells, write])

  const assignmentsOf = (state: SelectedUpsellState, upsellId: string) => readAssignments(state[upsellId]?.meta)

  /** Sets what one participant takes (0 removes them). Sizes default to the first available. */
  const setUpsellForParticipant = useCallback(
    (upsellId: string, participantId: string, quantity: number, size?: string) => {
      const upsell = upsells.find((item) => item.id === upsellId)
      if (!upsell || !participantIds.includes(participantId)) return
      const sizes = upsell.type === 'tshirt' ? resolveUpsellSizes(upsell) : []
      setSelectedUpsells((previous) => {
        const current = assignmentsOf(previous, upsellId)
        const existingSize = current.find((entry) => entry.participantId === participantId)?.size
        const chosenSize = upsell.type === 'tshirt' ? (size ?? existingSize ?? sizes[0]) : undefined
        const next = setParticipantQuantity(current, participantId, quantity, upsellMaxPerParticipant(upsell.type), chosenSize)
        return write(previous, upsellId, next)
      })
    },
    [upsells, participantIds, write],
  )

  /** Everyone in the order takes `quantity`; sizes already chosen are kept. */
  const setUpsellForAll = useCallback(
    (upsellId: string, quantity: number) => {
      const upsell = upsells.find((item) => item.id === upsellId)
      if (!upsell) return
      const max = upsellMaxPerParticipant(upsell.type)
      const sizes = upsell.type === 'tshirt' ? resolveUpsellSizes(upsell) : []
      setSelectedUpsells((previous) => {
        const current = assignmentsOf(previous, upsellId)
        const next = participantIds.reduce(
          (accumulator, participantId) =>
            setParticipantQuantity(
              accumulator,
              participantId,
              quantity,
              max,
              upsell.type === 'tshirt' ? (current.find((entry) => entry.participantId === participantId)?.size ?? sizes[0]) : undefined,
            ),
          current,
        )
        return write(previous, upsellId, next)
      })
    },
    [upsells, participantIds, write],
  )

  const clearUpsell = useCallback(
    (upsellId: string) => setSelectedUpsells((previous) => write(previous, upsellId, [])),
    [write],
  )

  /** One size for every participant who already has a t-shirt. */
  const setUpsellSizeForAll = useCallback(
    (upsellId: string, size: string) => {
      setSelectedUpsells((previous) => {
        const next = assignmentsOf(previous, upsellId).map((entry) => ({ ...entry, size }))
        return write(previous, upsellId, next)
      })
    },
    [write],
  )

  const upsellSummaryItems = useMemo(() => {
    const nameOf = (participantId: string) => {
      const index = participants.findIndex((participant) => participant.id === participantId)
      const participant = participants[index]
      return (participant && joinName(participant.firstName, participant.lastName)) || `Participant ${index + 1}`
    }
    return summarizeUpsells(selectedUpsells, upsells, nameOf, defaultCurrency)
  }, [defaultCurrency, participants, selectedUpsells, upsells])

  return {
    selectedUpsells,
    setSelectedUpsells,
    setUpsellForParticipant,
    setUpsellForAll,
    clearUpsell,
    setUpsellSizeForAll,
    upsellSummaryItems,
  }
}
