import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TicketChangeConfirmationGate } from './TicketChangePreviewPanel'

describe('TicketChangeConfirmationGate', () => {
  it('explains the 501 contract block and keeps confirmation disabled', () => {
    render(
      <TicketChangeConfirmationGate
        previewAllowed
        financialStatus="no_change"
        reason=""
        onReasonChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert', { name: 'Confirmation indisponible' })).toHaveTextContent(
      'Le contrat d’audit et d’idempotence n’est pas encore déployé.',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Aucune modification n’a été effectuée.')
    expect(screen.getByRole('button', { name: 'Confirmation désactivée' })).toBeDisabled()
    expect(screen.getByTitle('NO_MOVEMENT_CONFIRMATION_CONTRACT_MISSING')).toBeDisabled()
    expect(screen.queryByLabelText('Motif de l’exception (préparation uniquement)')).not.toBeInTheDocument()
  })

  it('collects an exception reason locally without enabling a mutation', () => {
    const onReasonChange = vi.fn()
    render(
      <TicketChangeConfirmationGate
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
    expect(screen.getByRole('button', { name: 'Confirmation désactivée' })).toBeDisabled()
  })

  it('does not ask for a financial reason when the preview is blocked', () => {
    render(
      <TicketChangeConfirmationGate
        previewAllowed={false}
        financialStatus="potential_change"
        reason=""
        onReasonChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('Motif de l’exception (préparation uniquement)')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmation désactivée' })).toBeDisabled()
  })
})
