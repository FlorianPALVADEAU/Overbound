import { describe, expect, it } from 'vitest'
import { buildReceiptBreakdown, sumLines } from './receiptBreakdown'

const participants = [
  { name: 'Alice Martin', ticketLabel: 'Primal OPEN', ticketUnitCents: 4500, flexible: false },
  { name: 'Bob Durand', ticketLabel: 'Primal OPEN', ticketUnitCents: 4500, flexible: true },
  { name: null, ticketLabel: 'Fury RANKED', ticketUnitCents: 6500, flexible: false },
]

describe('buildReceiptBreakdown', () => {
  it('puts each option under the participants it was assigned to, with the size', () => {
    const { participants: result, orderLines } = buildReceiptBreakdown({
      participants,
      flexibleFeeCents: 500,
      options: [
        {
          name: 'Pack photo',
          unitCents: 1000,
          quantity: 2,
          assignments: [
            { participantIndex: 0, quantity: 1 },
            { participantIndex: 1, quantity: 1 },
          ],
        },
        { name: 'T-shirt', unitCents: 2000, quantity: 1, assignments: [{ participantIndex: 2, quantity: 1, size: 'M' }] },
        { name: 'Patch adhésif', unitCents: 300, quantity: 2, assignments: [{ participantIndex: 2, quantity: 2 }] },
      ],
    })

    expect(orderLines).toEqual([])
    expect(result[0].lines.map((l) => l.description)).toEqual(['Primal OPEN', 'Pack photo'])
    expect(result[1].lines.map((l) => l.description)).toEqual(['Primal OPEN', 'Option billet flexible', 'Pack photo'])
    expect(result[2].lines.map((l) => [l.description, l.detail, l.quantity, l.total])).toEqual([
      ['Fury RANKED', undefined, 1, 65],
      ['T-shirt', 'Taille M', 1, 20],
      ['Patch adhésif', undefined, 2, 6],
    ])
  })

  it('names an anonymous participant by position and keeps the receipt total exact', () => {
    const { participants: result, orderLines } = buildReceiptBreakdown({
      participants,
      flexibleFeeCents: 500,
      options: [{ name: 'Pack photo', unitCents: 1000, quantity: 1, assignments: [{ participantIndex: 0, quantity: 1 }] }],
    })

    expect(result[2].name).toBe('Participant 3')
    const all = [...result.flatMap((p) => p.lines), ...orderLines]
    expect(sumLines(all)).toBe(45 + 45 + 5 + 65 + 10)
  })

  it('keeps unassigned options and options pointing at an unknown participant on the order', () => {
    const { participants: result, orderLines } = buildReceiptBreakdown({
      participants,
      flexibleFeeCents: 500,
      options: [
        { name: 'Pack photo', unitCents: 1000, quantity: 2, assignments: null },
        { name: 'T-shirt', unitCents: 2000, quantity: 1, assignments: [{ participantIndex: 9, quantity: 1 }] },
      ],
    })

    expect(result.every((p) => p.lines.every((l) => l.description !== 'Pack photo' && l.description !== 'T-shirt'))).toBe(true)
    expect(orderLines.map((l) => [l.description, l.quantity, l.total])).toEqual([
      ['Pack photo', 2, 20],
      ['T-shirt', 1, 20],
    ])
  })

  it('lists the OPEN companion on its own line under its participant, before the flexible option', () => {
    const { participants: result } = buildReceiptBreakdown({
      participants: [
        {
          name: 'Alice Martin',
          ticketLabel: 'Fury RANKED',
          ticketUnitCents: 7000,
          flexible: true,
          companion: { label: 'Option OPEN : Primal OPEN', cents: 2900 },
        },
      ],
      flexibleFeeCents: 890,
      options: [],
    })

    expect(result[0].lines.map((l) => [l.description, l.total])).toEqual([
      ['Fury RANKED', 70],
      ['Option OPEN : Primal OPEN', 29],
      ['Option billet flexible', 8.9],
    ])
    expect(sumLines(result[0].lines)).toBeCloseTo(107.9)
  })
})
