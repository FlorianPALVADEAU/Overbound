import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ArticleTocList } from './ArticleToc'

const items = [
  { id: 'premier', text: 'Premier' },
  { id: 'second', text: 'Second' },
  { id: 'troisieme', text: 'Troisième' },
]

describe('ArticleTocList', () => {
  it('marks the clicked entry as current', () => {
    render(<ArticleTocList items={items} />)

    fireEvent.click(screen.getByRole('link', { name: 'Troisième' }))

    expect(screen.getByRole('link', { name: 'Troisième' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByRole('link', { name: 'Premier' })).not.toHaveAttribute('aria-current')
  })
})
