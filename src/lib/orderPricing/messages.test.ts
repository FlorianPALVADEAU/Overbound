import { describe, expect, it } from 'vitest'
import { pricingErrorMessage, promoRejectionMessage } from './messages'

describe('pricing messages', () => {
  it('names the code an OPEN ticket code was refused for', () => {
    expect(promoRejectionMessage({ code: 'FREEOPENTICKET', reason: 'OPEN_TICKET_CODE_WITHOUT_OPEN_TICKET' })).toContain(
      'FREEOPENTICKET',
    )
  })

  it('names the ticket that has no price', () => {
    expect(pricingErrorMessage({ kind: 'TICKET_PRICE_MISSING', ticketId: 't', ticketName: 'OPEN' })).toContain('OPEN')
  })
})
