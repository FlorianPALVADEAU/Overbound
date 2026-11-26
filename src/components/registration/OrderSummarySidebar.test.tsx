import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import OrderSummarySidebar from './OrderSummarySidebar'
import type { OrderLine } from '@/lib/checkout/orderLines'

const lines: OrderLine[] = [
  { key: 'ticket-open', kind: 'ticket', label: 'Billet OPEN', details: [], amountCents: 5000 },
  { key: 'ticket-ranked', kind: 'ticket', label: 'Billet RANKED', details: [], amountCents: 7000 },
]

const baseProps = {
  lines,
  totalCents: 12000,
  currency: 'EUR',
  hasFlexible: false,
  ticketCount: 2,
  upsellCount: 0,
  groupDiscountLabels: [],
  pricingNotices: [],
  appliedPromos: [],
  promoInput: '',
  promoError: null,
  onPromoInputChange: vi.fn(),
  onValidatePromo: vi.fn(),
  onRemovePromo: vi.fn(),
  submissionMessage: null,
}

describe('OrderSummarySidebar', () => {
  it('keeps the order detail toggle clickable', () => {
    render(<OrderSummarySidebar {...baseProps} />)
    const toggle = screen.getByRole('button', { name: 'Voir le détail (2 lignes)' })
    expect(toggle).toBeEnabled()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps the promo code input enabled', () => {
    render(<OrderSummarySidebar {...baseProps} />)
    expect(screen.getByRole('textbox')).toBeEnabled()
  })
})
