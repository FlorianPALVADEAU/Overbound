export type SlotInput = {
  slotId: string
  startTime: string
  capacity?: number
  assignedCount?: number
}

export type RegistrationInput = {
  registrationId: string
  orderId?: string | null
  preferredWindow?: { from: string; to: string }
  preferredSlotIds?: string[]
  priority?: number
}

export type AssignSlotsOptions = {
  capacityPerSlot?: number
  allowOutsideWindow?: boolean
}

export type AssignmentValue = string | string[]

export type AssignSlotsResult = {
  assignments: Record<string, AssignmentValue>
  slotsState: Record<string, { assignedCount: number; remainingCapacity: number }>
  unassigned: Array<{ registrationId: string; reason: UnassignedReason }>
}

export type UnassignedReason =
  | 'ORDER_TOO_LARGE_MANUAL'
  | 'NO_SLOT_FOR_ORDER'
  | 'NO_SLOT_IN_WINDOW'
  | 'NO_VALID_PREFERRED_SLOTS'

type SlotInternal = {
  slotId: string
  startTimeMs: number
  capacity: number
  assignedCount: number
}

const toMillis = (value: string) => new Date(value).getTime()

const compareOrders = (a: OrderUnit, b: OrderUnit) => {
  const pA = a.priority ?? 0
  const pB = b.priority ?? 0
  if (pA !== pB) return pB - pA
  if (a.groupSize !== b.groupSize) return a.groupSize - b.groupSize
  return a.orderId.localeCompare(b.orderId)
}

const isValidWindow = (window?: { from: string; to: string }) => {
  if (!window) return false
  const from = toMillis(window.from)
  const to = toMillis(window.to)
  return Number.isFinite(from) && Number.isFinite(to) && from <= to
}

const getWindowBounds = (window?: { from: string; to: string }) => ({
  from: window ? toMillis(window.from) : null,
  to: window ? toMillis(window.to) : null,
})

const withinWindow = (slot: SlotInternal, window?: { from: string; to: string }) => {
  if (!window) return true
  const { from, to } = getWindowBounds(window)
  if (from === null || to === null) return true
  return slot.startTimeMs >= from && slot.startTimeMs <= to
}

const slotRemaining = (slot: SlotInternal) => slot.capacity - slot.assignedCount

const allocationScore = (slot: SlotInternal, added: number) => (slot.assignedCount + added) / slot.capacity

const pickBestSlot = (slots: SlotInternal[], groupSize: number) => {
  let best: SlotInternal | null = null
  let bestScore = Infinity
  for (const slot of slots) {
    if (slotRemaining(slot) < groupSize) continue
    const score = allocationScore(slot, groupSize)
    if (score < bestScore) {
      best = slot
      bestScore = score
      continue
    }
    if (score === bestScore && best && slot.startTimeMs < best.startTimeMs) {
      best = slot
    }
  }
  return best
}

type OrderUnit = {
  orderId: string
  registrationIds: string[]
  groupSize: number
  preferredWindow?: { from: string; to: string }
  preferredSlotIds?: string[]
  priority?: number
}

const buildScopeSlots = (
  allSlots: SlotInternal[],
  order: OrderUnit,
  allowOutsideWindow: boolean,
) => {
  const validPreferredIds = (order.preferredSlotIds || []).filter(Boolean)
  const preferredIdSet = validPreferredIds.length > 0 ? new Set(validPreferredIds) : null
  const hasWindow = isValidWindow(order.preferredWindow)

  let scoped = allSlots

  if (preferredIdSet) {
    const filtered = allSlots.filter((slot) => preferredIdSet.has(slot.slotId))
    if (filtered.length > 0) {
      scoped = filtered
    } else if (!allowOutsideWindow) {
      return { slots: [], reason: 'NO_VALID_PREFERRED_SLOTS' as UnassignedReason }
    }
  } else if (hasWindow) {
    scoped = allSlots.filter((slot) => withinWindow(slot, order.preferredWindow))
  }

  if (scoped.length === 0 && !allowOutsideWindow && hasWindow) {
    return { slots: [], reason: 'NO_SLOT_IN_WINDOW' as UnassignedReason }
  }

  if (scoped.length === 0 && allowOutsideWindow) {
    scoped = allSlots
  }

  return { slots: scoped, reason: null as UnassignedReason | null }
}

export const assignSlots = (
  slots: SlotInput[],
  registrations: RegistrationInput[],
  options: AssignSlotsOptions = {},
): AssignSlotsResult => {
  const capacityFallback = options.capacityPerSlot ?? 0
  const allowOutsideWindow = options.allowOutsideWindow ?? false

  const slotsInternal = slots
    .map((slot) => {
      const capacity = slot.capacity ?? capacityFallback
      return {
        slotId: slot.slotId,
        startTimeMs: toMillis(slot.startTime),
        capacity,
        assignedCount: slot.assignedCount ?? 0,
      }
    })
    .filter((slot) => Number.isFinite(slot.startTimeMs) && slot.capacity > 0)
    .sort((a, b) => a.startTimeMs - b.startTimeMs)

  const assignments: Record<string, AssignmentValue> = {}
  const unassigned: Array<{ registrationId: string; reason: UnassignedReason }> = []

  const ordersMap = new Map<string, OrderUnit>()
  for (const registration of registrations) {
    const orderId = registration.orderId ?? registration.registrationId
    const existing = ordersMap.get(orderId)
    if (!existing) {
      ordersMap.set(orderId, {
        orderId,
        registrationIds: [registration.registrationId],
        groupSize: 1,
        preferredWindow: registration.preferredWindow,
        preferredSlotIds: registration.preferredSlotIds,
        priority: registration.priority ?? 0,
      })
    } else {
      existing.registrationIds.push(registration.registrationId)
      existing.groupSize += 1
      existing.priority = Math.max(existing.priority ?? 0, registration.priority ?? 0)
    }
  }

  const sortedOrders = Array.from(ordersMap.values()).sort(compareOrders)

  for (const order of sortedOrders) {
    if (order.groupSize > 10) {
      for (const registrationId of order.registrationIds) {
        unassigned.push({ registrationId, reason: 'ORDER_TOO_LARGE_MANUAL' })
      }
      continue
    }

    const { slots: scopedSlots, reason } = buildScopeSlots(slotsInternal, order, allowOutsideWindow)
    if (scopedSlots.length === 0) {
      for (const registrationId of order.registrationIds) {
        unassigned.push({ registrationId, reason: reason ?? 'NO_SLOT_FOR_ORDER' })
      }
      continue
    }

    const bestSlot = pickBestSlot(scopedSlots, order.groupSize)
    if (!bestSlot) {
      for (const registrationId of order.registrationIds) {
        unassigned.push({ registrationId, reason: 'NO_SLOT_FOR_ORDER' })
      }
      continue
    }

    bestSlot.assignedCount += order.groupSize
    for (const registrationId of order.registrationIds) {
      assignments[registrationId] = bestSlot.slotId
    }
  }

  const slotsState: AssignSlotsResult['slotsState'] = {}
  for (const slot of slotsInternal) {
    slotsState[slot.slotId] = {
      assignedCount: slot.assignedCount,
      remainingCapacity: Math.max(slot.capacity - slot.assignedCount, 0),
    }
  }

  return { assignments, slotsState, unassigned }
}
