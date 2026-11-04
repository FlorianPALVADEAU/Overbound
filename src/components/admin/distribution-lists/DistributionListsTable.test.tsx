import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DistributionListWithStats } from '@/types/DistributionList'
import { EVENT_OPENING_FIRST_LIST_ID } from '@/lib/subscriptions/constants'
import { DistributionListsTable } from './DistributionListsTable'

vi.mock('@/hooks/useDistributionLists', () => ({
  useDistributionLists: () => ({ deleteList: vi.fn(), toggleActive: vi.fn() }),
}))

const list = (overrides: Partial<DistributionListWithStats>): DistributionListWithStats => ({
  id: 'list-a',
  name: 'Newsletter',
  description: null,
  slug: 'newsletter',
  type: 'news',
  active: true,
  subscriber_count: 12,
  ...overrides,
} as DistributionListWithStats)

describe('DistributionListsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows every list with its subscriber count', () => {
    render(
      <DistributionListsTable
        lists={[list({}), list({ id: 'list-b', name: 'Bénévoles', slug: 'benevoles', subscriber_count: 3 })]}
        onEdit={vi.fn()}
        onViewSubscribers={vi.fn()}
        onRefresh={vi.fn()}
      />,
    )

    expect(screen.getAllByText('Newsletter').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bénévoles').length).toBeGreaterThan(0)
    expect(screen.getAllByText('12').length).toBeGreaterThan(0)
  })

  it('locks the status switch of the event opening list (success and refusal of the toggle)', () => {
    render(
      <DistributionListsTable
        lists={[list({ id: EVENT_OPENING_FIRST_LIST_ID, name: 'Ouvertures', slug: 'ouvertures' }), list({})]}
        onEdit={vi.fn()}
        onViewSubscribers={vi.fn()}
        onRefresh={vi.fn()}
      />,
    )

    const locked = screen.getAllByRole('switch', { name: 'Désactiver Ouvertures' })
    const open = screen.getAllByRole('switch', { name: 'Désactiver Newsletter' })
    expect(locked.length).toBeGreaterThan(0)
    locked.forEach((element) => expect(element).toBeDisabled())
    open.forEach((element) => expect(element).not.toBeDisabled())
  })

  it('shows the empty message when there is no list', () => {
    render(<DistributionListsTable lists={[]} onEdit={vi.fn()} onViewSubscribers={vi.fn()} onRefresh={vi.fn()} />)

    expect(screen.getByText('Aucune liste de distribution')).toBeInTheDocument()
  })
})
