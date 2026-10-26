import { describe, expect, it } from 'vitest'
import { computeOrderPricing, toPricingSummary } from '@/lib/orderPricing'
import { order, participantsOn, percentCode, tier } from '@/lib/orderPricing/testFixtures'
import { summarizeUpsells } from '@/lib/upsells/summary'
import { buildOrderLines, type OrderLineNames } from './orderLines'

const names: OrderLineNames = {
  ticket: (id) => (id === 'open' ? 'OPEN' : 'RANKED'),
  tier: (id) => (id === 'early' ? 'Early' : null),
  participant: (index) => ['Camille', 'Léo', 'Inès', 'Noé', 'Zoé'][index] ?? '',
  upsell: (id) => (id === 'tshirt' ? 'T-shirt' : id),
}

const UPSELLS = [{ id: 'tshirt', name: 'T-shirt', type: 'tshirt' as const, price_cents: 2000 }]

const linesFor = (input: Parameters<typeof order>[0]) => {
  const result = computeOrderPricing(order(input))
  if (!result.ok) throw new Error('priced order expected')
  const summary = toPricingSummary(result.value, 'eur')
  const selections = Object.fromEntries((input?.upsellLines ?? []).map((line) => [line.upsellId, { quantity: line.quantity }]))
  return { summary, lines: buildOrderLines(summary, summarizeUpsells(selections, UPSELLS, () => '', 'eur'), names) }
}

describe('buildOrderLines', () => {
  it('adds up to the total, whatever the order', () => {
    const { summary, lines } = linesFor({
      participants: [...participantsOn('open', 'ranked', 'open'), { ticketId: 'open', flexible: true }],
      tiers: [tier({ maxRegistrations: 2 }), tier({ id: 'late', displayOrder: 2, discountPercentage: 0 })],
      upsellLines: [{ upsellId: 'tshirt', quantity: 2 }],
      promos: [percentCode('SUMMER', 10), percentCode('TEE50', 50, { targetUpsellId: 'tshirt' })],
    })
    expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(summary.totalDue)
  })

  it('names the participants and the tier of a ticket line, with the full price crossed out', () => {
    const { lines } = linesFor({ participants: participantsOn('open', 'open'), tiers: [tier()] })
    expect(lines[0]).toEqual({
      key: 'ticket-open-early-8000',
      kind: 'ticket',
      label: '2 × OPEN',
      details: ['Camille, Léo', 'Tarif Early'],
      amountCents: 8000,
      fullAmountCents: 10000,
    })
  })

  it('shows one line per code, with its target', () => {
    const { lines } = linesFor({
      upsellLines: [{ upsellId: 'tshirt', quantity: 1 }],
      promos: [percentCode('TEE50', 50, { targetUpsellId: 'tshirt' })],
    })
    expect(lines.at(-1)).toMatchObject({ label: 'Code TEE50', details: ['Sur T-shirt'], amountCents: -1000 })
  })

  it('falls back to one ticket line and one discount line for an old draft', () => {
    const lines = buildOrderLines(
      { ticketTotal: 5000, upsellTotal: 0, discountAmount: 500, totalDue: 4500, currency: 'eur' },
      [],
      names,
    )
    expect(lines).toEqual([
      { key: 'tickets', kind: 'ticket', label: 'Billets', details: [], amountCents: 5000 },
      { key: 'discount', kind: 'discount', label: 'Réduction', details: [], amountCents: -500 },
    ])
  })

  it('shows the group discount, and says a beaten code is not cumulable', () => {
    const { lines, summary } = linesFor({
      participants: participantsOn('open', 'open', 'open', 'open', 'open', 'open'),
      promos: [percentCode('AMB10', 10, { isAmbassador: true })],
    })
    expect(lines.filter((line) => line.kind === 'discount')).toEqual([
      { key: 'group-discount', kind: 'discount', label: 'Remise groupe −20 %', details: [], amountCents: -6000 },
      {
        key: 'discount-AMB10',
        kind: 'discount',
        label: 'Code AMB10',
        details: ['Non cumulable : la remise groupe est plus avantageuse'],
        amountCents: -0,
      },
    ])
    expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(summary.totalDue)
  })

  it('says a code that beats the group discount replaces it', () => {
    const { lines } = linesFor({
      participants: participantsOn('open', 'open'),
      promos: [percentCode('AMB30', 30, { isAmbassador: true })],
    })
    expect(lines.at(-1)).toMatchObject({
      label: 'Code AMB30',
      details: ['Non cumulable : plus avantageux que la remise groupe'],
      amountCents: -3000,
    })
  })
})

describe('buildOrderLines — options under their ticket', () => {
  const holders: Record<string, { ticketId: string; name: string }> = {
    p1: { ticketId: 'open', name: 'Camille' },
    p2: { ticketId: 'ranked', name: 'Léo' },
  }
  const withHolders: OrderLineNames = { ...names, assignee: (id) => holders[id] ?? null }

  it('puts each option right after the ticket line of whoever takes it, and keeps the sum', () => {
    const result = computeOrderPricing(order({ participants: participantsOn('open', 'ranked'), upsellLines: [{ upsellId: 'tshirt', quantity: 2 }] }))
    if (!result.ok) throw new Error('priced order expected')
    const summary = toPricingSummary(result.value, 'eur')
    const items = summarizeUpsells(
      { tshirt: { quantity: 2, meta: { assignments: [{ participantId: 'p1', quantity: 1, size: 'M' }, { participantId: 'p2', quantity: 1, size: 'L' }] } } },
      UPSELLS,
      (id) => holders[id]?.name ?? '',
      'eur',
    )
    const lines = buildOrderLines(summary, items, withHolders)
    expect(lines.map((line) => [line.kind, line.nested ?? false])).toEqual([
      ['ticket', false],
      ['upsell', true],
      ['ticket', false],
      ['upsell', true],
    ])
    expect(lines[1].details).toEqual(['Camille (M)'])
    expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(summary.totalDue)
  })

  it('keeps an option as a plain line when nobody is assigned', () => {
    const { lines } = linesFor({ participants: participantsOn('open'), upsellLines: [{ upsellId: 'tshirt', quantity: 1 }] })
    expect(lines.find((line) => line.kind === 'upsell')?.nested).toBeUndefined()
  })
})
