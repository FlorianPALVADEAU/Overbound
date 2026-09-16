import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock, renderEmailMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  renderEmailMock: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

vi.mock('@/lib/email/render', () => ({
  renderEmail: renderEmailMock,
}))

import { sendTicketEmail, sendReceiptEmail } from './email'

describe('sendTicketEmail', () => {
  beforeEach(() => {
    sendMock.mockReset()
    renderEmailMock.mockReset()
    renderEmailMock.mockResolvedValue('<html>ticket</html>')
  })

  const baseParams = {
    to: 'runner@example.com',
    participantName: 'Alex Runner',
    eventTitle: 'Ultra Arena 2026',
    eventDate: '12 septembre 2026',
    eventLocation: 'Île de loisirs de Saint-Quentin-en-Yvelines',
    qrUrl: 'https://overbound-race.com/qr/abc123',
    manageUrl: 'https://overbound-race.com/account/registrations/abc123',
    ticketName: 'Primal OPEN',
  }

  it('sends the ticket email with the rendered HTML, recipient and subject built from the event title', async () => {
    const result = await sendTicketEmail(baseParams)

    expect(renderEmailMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledWith({
      from: "Florian d'Overbound <no-reply@overbound-race.com>",
      to: baseParams.to,
      subject: `Ton billet — ${baseParams.eventTitle}`,
      html: '<html>ticket</html>',
    })
    expect(result).toBeUndefined()
  })

  it('propagates the resolved Resend response (including embedded API errors) without throwing', async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field' },
    })

    const result = await sendTicketEmail(baseParams)

    expect(result).toEqual({
      data: null,
      error: { name: 'validation_error', message: 'Invalid `to` field' },
    })
  })

  it('rejects when the Resend client throws (e.g. network failure)', async () => {
    sendMock.mockRejectedValueOnce(new Error('network unreachable'))

    await expect(sendTicketEmail(baseParams)).rejects.toThrow('network unreachable')
  })

  it('rejects when template rendering fails, without ever calling Resend', async () => {
    renderEmailMock.mockRejectedValueOnce(new Error('render failed'))

    await expect(sendTicketEmail(baseParams)).rejects.toThrow('render failed')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('supports an optional start_time (RANKED tickets have no wave slot)', async () => {
    await sendTicketEmail({ ...baseParams, startTime: null })

    expect(renderEmailMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
  })
})

describe('sendReceiptEmail', () => {
  beforeEach(() => {
    sendMock.mockReset()
    renderEmailMock.mockReset()
    renderEmailMock.mockResolvedValue('<html>receipt</html>')
  })

  const baseParams = {
    to: 'runner@example.com',
    fullName: 'Alex Runner',
    invoiceNumber: 'INV-2026-0001',
    invoiceDate: '12 mars 2026',
    eventName: 'Ultra Arena 2026',
    items: [
      { description: 'Billet Primal OPEN', quantity: 1, unitPrice: 49, total: 49 },
    ],
    subtotal: 49,
    total: 49,
    paymentMethod: 'card',
  }

  it('sends the receipt email with the rendered HTML, recipient and event-based subject', async () => {
    const result = await sendReceiptEmail(baseParams)

    expect(renderEmailMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledWith({
      from: 'Overbound <no-reply@overbound-race.com>',
      to: baseParams.to,
      subject: `Reçu de paiement — ${baseParams.eventName}`,
      html: '<html>receipt</html>',
    })
    expect(result).toBeUndefined()
  })

  it('propagates the resolved Resend response (including embedded API errors) without throwing', async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { name: 'rate_limit_exceeded', message: 'Too many requests' },
    })

    const result = await sendReceiptEmail(baseParams)

    expect(result).toEqual({
      data: null,
      error: { name: 'rate_limit_exceeded', message: 'Too many requests' },
    })
  })

  it('rejects when the Resend client throws', async () => {
    sendMock.mockRejectedValueOnce(new Error('service unavailable'))

    await expect(sendReceiptEmail(baseParams)).rejects.toThrow('service unavailable')
  })

  it('supports a discount, custom currency and multiple line items (branching invoice content)', async () => {
    await sendReceiptEmail({
      ...baseParams,
      currency: 'USD',
      discount: 10,
      discountLabel: 'Code promo LUOFF30',
      tax: 5,
      total: 44,
      items: [
        { description: 'Billet Primal OPEN', quantity: 1, unitPrice: 49, total: 49 },
        { description: 'Assurance annulation', quantity: 1, unitPrice: 5, total: 5 },
      ],
      billingAddress: '1 rue de la Course, 75000 Paris',
      invoiceUrl: 'https://overbound-race.com/account/invoices/inv-1.pdf',
    })

    expect(renderEmailMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `Reçu de paiement — ${baseParams.eventName}`,
      })
    )
  })
})
