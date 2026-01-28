import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EventUpsell, Participant, SelectedUpsellState, UpsellSummaryItem } from '@/components/registration/types'
import {
  resolveUpsellSizes,
  buildTshirtMeta,
  normalizeTshirtSizes,
  humanizeMetaKey,
} from '@/lib/registration'

export function useUpsells(
  upsells: EventUpsell[],
  selectedTicketSlots: string[],
  participants: Participant[],
  defaultCurrency: string,
) {
  const [selectedUpsells, setSelectedUpsells] = useState<SelectedUpsellState>({})

  // Sync upsell quantities/meta when ticket slots change
  useEffect(() => {
    setSelectedUpsells((previous) => {
      if (upsells.length === 0) return previous

      let hasChanges = false
      const nextState: SelectedUpsellState = { ...previous }
      const maxPerTicket = selectedTicketSlots.length

      upsells.forEach((upsell) => {
        const entry = nextState[upsell.id]
        if (!entry) return
        const allowedQuantity = Math.min(entry.quantity, maxPerTicket)
        if (allowedQuantity <= 0) {
          delete nextState[upsell.id]
          hasChanges = true
          return
        }
        if (upsell.type === 'tshirt') {
          const availableSizes = resolveUpsellSizes(upsell)
          const normalizedMeta = buildTshirtMeta(entry.meta, allowedQuantity, availableSizes)
          const metaChanged = JSON.stringify(entry.meta ?? {}) !== JSON.stringify(normalizedMeta)
          if (entry.quantity !== allowedQuantity || metaChanged) {
            nextState[upsell.id] = {
              quantity: allowedQuantity,
              ...(Object.keys(normalizedMeta).length > 0 ? { meta: normalizedMeta } : {}),
            }
            hasChanges = true
          }
        } else if (upsell.type === 'photos') {
          const validTicketIds = new Set(selectedTicketSlots)
          const currentAssignments: string[] = Array.isArray(entry.meta?.assignments)
            ? (entry.meta!.assignments as string[])
            : []
          let filtered = currentAssignments.filter((t) => validTicketIds.has(t))
          if (filtered.length > allowedQuantity) filtered = filtered.slice(0, allowedQuantity)
          const meta = { ...(entry.meta || {}), assignments: filtered }
          const metaChanged = JSON.stringify(entry.meta ?? {}) !== JSON.stringify(meta)
          if (entry.quantity !== allowedQuantity || metaChanged) {
            nextState[upsell.id] = { quantity: allowedQuantity, meta }
            hasChanges = true
          }
        }
      })

      return hasChanges ? nextState : previous
    })
  }, [selectedTicketSlots.length, upsells])

  const handleUpsellChange = useCallback(
    (upsellId: string, quantity: number) => {
      setSelectedUpsells((previous) => {
        const upsell = upsells.find((item) => item.id === upsellId)
        const maxAllowed =
          upsell?.type === 'tshirt' || upsell?.type === 'photos'
            ? selectedTicketSlots.length
            : Number.MAX_SAFE_INTEGER
        const nextQuantity = Math.min(Math.max(0, quantity), maxAllowed)
        const existing = previous[upsellId]

        let nextMeta = existing?.meta ? { ...existing.meta } : {}

        if (upsell?.type === 'tshirt') {
          const availableSizes = resolveUpsellSizes(upsell)
          nextMeta = buildTshirtMeta(existing?.meta, nextQuantity, availableSizes)
        }
        if (upsell?.type === 'photos') {
          const currentAssignments: string[] = Array.isArray(existing?.meta?.assignments)
            ? (existing!.meta!.assignments as string[])
            : []
          const validTicketIds = new Set(selectedTicketSlots)
          let filtered = currentAssignments.filter((t) => validTicketIds.has(t))
          if (filtered.length > nextQuantity) filtered = filtered.slice(0, nextQuantity)
          nextMeta = { ...(existing?.meta || {}), assignments: filtered }
        }

        if (nextQuantity === 0 && Object.keys(nextMeta).length === 0) {
          if (!existing) return previous
          const { [upsellId]: _removed, ...rest } = previous
          return rest
        }

        return {
          ...previous,
          [upsellId]: {
            quantity: nextQuantity,
            ...(Object.keys(nextMeta).length > 0 ? { meta: nextMeta } : {}),
          },
        }
      })
    },
    [upsells, selectedTicketSlots],
  )

  const handleUpsellAssignmentToggle = useCallback(
    (upsellId: string, ticketId: string, checked: boolean) => {
      setSelectedUpsells((previous) => {
        const upsell = upsells.find((u) => u.id === upsellId)
        if (!upsell || upsell.type !== 'photos') return previous
        const entry = previous[upsellId]
        if (!entry) return previous
        const quantity = entry.quantity
        const current: string[] = Array.isArray(entry.meta?.assignments)
          ? (entry.meta!.assignments as string[])
          : []
        const has = current.includes(ticketId)
        let next = current
        if (checked) {
          if (!has && current.length < quantity) next = [...current, ticketId]
        } else if (has) {
          next = current.filter((t) => t !== ticketId)
        }
        return {
          ...previous,
          [upsellId]: { ...entry, meta: { ...(entry.meta || {}), assignments: next } },
        }
      })
    },
    [upsells],
  )

  const handleUpsellSizeChange = useCallback(
    (upsellId: string, index: number, size: string) => {
      setSelectedUpsells((previous) => {
        const upsell = upsells.find((item) => item.id === upsellId)
        if (!upsell) return previous

        const existing = previous[upsellId]
        if (!existing || existing.quantity <= index) return previous

        const availableSizes = resolveUpsellSizes(upsell)
        if (!availableSizes.includes(size)) return previous

        const normalizedSizes = normalizeTshirtSizes(existing.meta, existing.quantity, availableSizes)
        if (normalizedSizes[index] === size) return previous
        normalizedSizes[index] = size

        const baseMeta = { ...(existing.meta || {}) }
        delete baseMeta.size

        return {
          ...previous,
          [upsellId]: { ...existing, meta: { ...baseMeta, sizes: normalizedSizes } },
        }
      })
    },
    [upsells],
  )

  const selectedUpsellList = useMemo(() => {
    return Object.entries(selectedUpsells)
      .filter(([, config]) => config.quantity > 0)
      .map(([id, config]) => {
        const upsell = upsells.find((item) => item.id === id)
        if (!upsell) return null
        return { upsell, quantity: config.quantity, meta: config.meta || {} }
      })
      .filter(Boolean) as Array<{ upsell: EventUpsell; quantity: number; meta: Record<string, any> }>
  }, [selectedUpsells, upsells])

  const upsellSummaryItems = useMemo(() => {
    const items: UpsellSummaryItem[] = []

    selectedUpsellList.forEach(({ upsell, quantity, meta }) => {
      const currency = (upsell.currency || defaultCurrency).toLowerCase()

      if (upsell.type === 'tshirt') {
        const availableSizes = resolveUpsellSizes(upsell)
        const sizes = normalizeTshirtSizes(meta, quantity, availableSizes)
        sizes.forEach((size, index) => {
          items.push({
            id: `${upsell.id}-${index}`,
            label: upsell.name,
            quantity: 1,
            amount: upsell.price_cents,
            currency,
            details: [`Taille ${size}`],
          })
        })
        return
      }

      const details: string[] = []
      if (upsell.type === 'photos') {
        const assignments: string[] = Array.isArray(meta?.assignments) ? (meta.assignments as string[]) : []
        if (assignments.length) {
          const labels = assignments.map((ticketId) => {
            const index = selectedTicketSlots.findIndex((t) => t === ticketId)
            const p = participants[index]
            return p && (p.firstName || p.lastName)
              ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `Participant #${index + 1}`
              : `Participant #${index + 1}`
          })
          details.push(`Attribué à: ${labels.join(', ')}`)
        }
      }
      if (meta && typeof meta === 'object') {
        Object.entries(meta).forEach(([key, value]) => {
          if (value === null || value === undefined) return
          if (key === 'sizes' && Array.isArray(value)) {
            const formatted = value.filter((s): s is string => typeof s === 'string' && s.length > 0)
            if (formatted.length > 0) details.push(`Tailles : ${formatted.join(', ')}`)
            return
          }
          if (key === 'size' && typeof value === 'string' && value.length > 0) {
            details.push(`Taille ${value}`)
            return
          }
          if (Array.isArray(value)) {
            const serialized = value.map((entry) => String(entry)).join(', ')
            if (serialized.length > 0) details.push(`${humanizeMetaKey(key)} : ${serialized}`)
            return
          }
          if (typeof value === 'object') return
          details.push(`${humanizeMetaKey(key)} : ${String(value)}`)
        })
      }

      items.push({
        id: upsell.id,
        label: upsell.name,
        quantity,
        amount: upsell.price_cents * quantity,
        currency,
        details,
      })
    })

    return items
  }, [defaultCurrency, selectedUpsellList, selectedTicketSlots, participants])

  return {
    selectedUpsells,
    setSelectedUpsells,
    handleUpsellChange,
    handleUpsellAssignmentToggle,
    handleUpsellSizeChange,
    upsellSummaryItems,
  }
}
