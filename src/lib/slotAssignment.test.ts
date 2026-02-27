import { describe, expect, it } from 'vitest'
import { assignSlots, type SlotInput } from './slotAssignment'

const makeSlots = (count: number, capacity = 10): SlotInput[] => {
  const base = new Date('2026-01-01T08:00:00.000Z')
  return Array.from({ length: count }, (_, i) => ({
    slotId: `slot-${i + 1}`,
    startTime: new Date(base.getTime() + i * 10 * 60 * 1000).toISOString(),
    capacity,
  }))
}

describe('assignSlots', () => {
  it('keeps same order_id in the same slot', () => {
    const slots = makeSlots(3, 10)
    const { assignments } = assignSlots(
      slots,
      [
        { registrationId: 'r1', orderId: 'o1' },
        { registrationId: 'r2', orderId: 'o1' },
      ],
      {},
    )
    expect(assignments.r1).toBeTypeOf('string')
    expect(assignments.r1).toBe(assignments.r2)
  })

  it('does not auto-assign orders >10', () => {
    const slots = makeSlots(4, 20)
    const result = assignSlots(
      slots,
      Array.from({ length: 11 }, (_, i) => ({
        registrationId: `r${i + 1}`,
        orderId: 'o1',
      })),
      {},
    )
    expect(result.assignments.r1).toBeUndefined()
    expect(result.unassigned[0]?.reason).toBe('ORDER_TOO_LARGE_MANUAL')
  })

  it('never exceeds capacity', () => {
    const slots = makeSlots(2, 5)
    const result = assignSlots(
      slots,
      [
        { registrationId: 'r1', orderId: 'o1' },
        { registrationId: 'r2', orderId: 'o1' },
        { registrationId: 'r3', orderId: 'o2' },
        { registrationId: 'r4', orderId: 'o2' },
        { registrationId: 'r5', orderId: 'o2' },
        { registrationId: 'r6', orderId: 'o2' },
        { registrationId: 'r7', orderId: 'o3' },
        { registrationId: 'r8', orderId: 'o4' },
        { registrationId: 'r9', orderId: 'o4' },
        { registrationId: 'r10', orderId: 'o4' },
        { registrationId: 'r11', orderId: 'o4' },
        { registrationId: 'r12', orderId: 'o4' },
      ],
      {},
    )
    const state = Object.values(result.slotsState)
    expect(state[0].assignedCount).toBeLessThanOrEqual(5)
    expect(state[1].assignedCount).toBeLessThanOrEqual(5)
    expect(result.unassigned.find((item) => item.registrationId === 'r8')).toBeTruthy()
  })

  it('respects preferred window', () => {
    const slots = makeSlots(5, 10)
    const windowFrom = slots[2].startTime
    const windowTo = slots[3].startTime
    const result = assignSlots(
      slots,
      [
        {
          registrationId: 'r1',
          orderId: 'o1',
          preferredWindow: { from: windowFrom, to: windowTo },
        },
        {
          registrationId: 'r2',
          orderId: 'o1',
          preferredWindow: { from: windowFrom, to: windowTo },
        },
        {
          registrationId: 'r3',
          orderId: 'o1',
          preferredWindow: { from: windowFrom, to: windowTo },
        },
        {
          registrationId: 'r4',
          orderId: 'o1',
          preferredWindow: { from: windowFrom, to: windowTo },
        },
      ],
      { allowOutsideWindow: false },
    )
    expect(['slot-3', 'slot-4']).toContain(result.assignments.r1 as string)
  })

  it('chooses least filled after assignment', () => {
    const slots = makeSlots(2, 10)
    slots[0] = { ...slots[0], assignedCount: 8 }
    const result = assignSlots(
      slots,
      [{ registrationId: 'r1', orderId: 'o1' }],
      {},
    )
    expect(result.assignments.r1).toBe('slot-2')
  })

  it('keeps processing order stable by priority then size then orderId', () => {
    const slots = makeSlots(2, 10)
    const result = assignSlots(
      slots,
      [
        { registrationId: 'r1', orderId: 'b', priority: 1 },
        { registrationId: 'r2', orderId: 'b', priority: 1 },
        { registrationId: 'r3', orderId: 'a', priority: 2 },
      ],
      {},
    )
    expect(result.assignments.r3).toBe('slot-1')
  })
})
