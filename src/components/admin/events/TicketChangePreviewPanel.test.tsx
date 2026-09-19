import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TicketChangeConfirmationGate } from './TicketChangePreviewPanel'

describe('TicketChangeConfirmationGate', () => {
  const confirmation = {
    previewId: 'preview-1',
    previewExpiresAt: '2026-09-20T10:00:00.000Z',
    eventStartsAt: '2026-09-20T08:00:00.000Z',
    eventTimezone: 'Europe/Paris',
    expectedTicketId: '56e08f7d-24c3-44be-b123-4f034c669909',
    expectedWaveIndex: 1,
    expectedStartTime: '2026-09-20T08:00:00.000Z',
  }

  const baseProps = {
    eventId: '56e08f7d-24c3-44be-b123-4f034c669909',
    registrationId: '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    targetTicketId: '4d0272d2-647c-4b7b-8c68-3c9a3ecb99d9',
    confirmation,
  }

  it('allows a no-movement confirmation when the preview is valid', () => {
    render(
      <TicketChangeConfirmationGate
        {...baseProps}
        previewAllowed
        financialStatus="no_change"
        reason=""
        onReasonChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert', { name: 'Confirmation disponible' })).toHaveTextContent('Aucun mouvement financier')
    expect(screen.getByRole('button', { name: 'Confirmer sans mouvement financier' })).toBeEnabled()
    expect(screen.queryByLabelText('Motif de l’exception (préparation uniquement)')).not.toBeInTheDocument()
  })

  it('collects an exception reason locally without enabling a mutation', () => {
    const onReasonChange = vi.fn()
    render(
      <TicketChangeConfirmationGate
        {...baseProps}
        previewAllowed
        financialStatus="potential_change"
        reason="Prix historique conservé"
        onReasonChange={onReasonChange}
      />,
    )

    const reason = screen.getByLabelText('Motif de l’exception (préparation uniquement)')
    expect(reason).toHaveValue('Prix historique conservé')
    fireEvent.change(reason, { target: { value: 'Correction validée par l’admin' } })
    expect(onReasonChange).toHaveBeenCalledWith('Correction validée par l’admin')
    expect(screen.getByRole('button', { name: 'Confirmer sans mouvement financier' })).toBeDisabled()
  })

  it('does not ask for a financial reason when the preview is blocked', () => {
    render(
      <TicketChangeConfirmationGate
        {...baseProps}
        previewAllowed={false}
        financialStatus="potential_change"
        reason=""
        onReasonChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('Motif de l’exception (préparation uniquement)')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmer sans mouvement financier' })).toBeDisabled()
  })
})
