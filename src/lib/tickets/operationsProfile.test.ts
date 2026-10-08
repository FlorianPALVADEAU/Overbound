import { describe, expect, it } from 'vitest'
import { ticketUsesWaveSelection } from './operationsProfile'

describe('ticketUsesWaveSelection', () => {
  const configured = (departure_mode: string) => ({
    departure_mode,
    departure_change_policy: 'preserve',
  })

  it('follows the explicit configuration, whatever the name says', () => {
    expect(ticketUsesWaveSelection({ name: 'pipi', operations_config: configured('wave') })).toBe(true)
    expect(ticketUsesWaveSelection({ name: 'Pass OPEN', operations_config: configured('fixed') })).toBe(false)
    expect(ticketUsesWaveSelection({ name: 'Pass OPEN', operations_config: configured('none') })).toBe(false)
  })

  it('falls back to the legacy OPEN name only when the ticket is unconfigured', () => {
    expect(ticketUsesWaveSelection({ name: 'Pass OPEN', operations_config: null })).toBe(true)
    expect(ticketUsesWaveSelection({ name: 'Pass', race: { name: 'Open arena' }, operations_config: {} })).toBe(true)
    expect(ticketUsesWaveSelection({ name: 'Pass RANKED', operations_config: null })).toBe(false)
  })
})
