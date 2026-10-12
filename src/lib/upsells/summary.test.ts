import { describe, expect, it } from 'vitest'
import { summarizeUpsells } from './summary'

const TSHIRT = { id: 'tshirt', name: 'T-shirt', type: 'tshirt' as const, price_cents: 2000, currency: 'EUR' }
const names: Record<string, string> = { p1: 'Camille', p2: 'Léo', p3: 'Inès', p4: 'Noé', p5: 'Zoé' }
const nameOf = (id: string) => names[id] ?? id

const assigned = (...entries: Array<[string, string]>) => ({
  quantity: entries.length,
  meta: { assignments: entries.map(([participantId, size]) => ({ participantId, quantity: 1, size })) },
})

describe('summarizeUpsells', () => {
  it('names who takes the option and counts sizes', () => {
    const [item] = summarizeUpsells({ tshirt: assigned(['p1', 'M'], ['p2', 'M'], ['p3', 'L']) }, [TSHIRT], nameOf, 'eur')
    expect(item).toEqual({
      id: 'tshirt',
      label: 'T-shirt',
      quantity: 3,
      amount: 6000,
      currency: 'eur',
      details: ['Pour : Camille, Léo, Inès', 'Tailles : M ×2, L'],
    })
  })

  it('shortens a long list of names', () => {
    const [item] = summarizeUpsells(
      { tshirt: assigned(['p1', 'M'], ['p2', 'M'], ['p3', 'M'], ['p4', 'M'], ['p5', 'M']) },
      [TSHIRT],
      nameOf,
      'eur',
    )
    expect(item?.details[0]).toBe('Pour : Camille, Léo, Inès et 2 autres')
  })

  it('skips unknown and empty selections', () => {
    expect(summarizeUpsells({ ghost: { quantity: 1 }, tshirt: { quantity: 0 } }, [TSHIRT], nameOf, 'eur')).toEqual([])
  })
})
