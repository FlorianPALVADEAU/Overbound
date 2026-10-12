import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Disclosure } from './Disclosure'

describe('Disclosure', () => {
  it('starts folded below lg and opens on click', () => {
    render(<Disclosure title="Filtres">contenu</Disclosure>)
    const button = screen.getByRole('button', { name: /Filtres/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('contenu')).toHaveClass('hidden', 'lg:block')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('contenu')).toHaveClass('block')
  })

  it('honours defaultOpen', () => {
    render(<Disclosure title="Récompenses" defaultOpen>contenu</Disclosure>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })
})
