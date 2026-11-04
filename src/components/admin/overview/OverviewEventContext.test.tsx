import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OverviewEventContext } from './OverviewEventContext'

const replace = vi.fn()
const useAdminEvents = vi.fn()

vi.mock('@/app/api/admin/events/eventsQueries', () => ({
  useAdminEvents: () => useAdminEvents(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard',
}))

const events = [
  { id: 'event-1', slug: 'paris', title: 'Overbound Paris', date: '2026-09-20T08:00:00.000Z', location: 'Paris', capacity: 100, status: 'on_sale', created_at: '', updated_at: '' },
  { id: 'event-2', slug: 'lyon', title: 'Overbound Lyon', date: '2026-10-10T08:00:00.000Z', location: 'Lyon', capacity: 100, status: 'announced', created_at: '', updated_at: '' },
]

describe('OverviewEventContext', () => {
  beforeEach(() => {
    replace.mockReset()
    useAdminEvents.mockReset()
    useAdminEvents.mockReturnValue({ data: events, isLoading: false, isError: false, error: null, refetch: vi.fn() })
  })

  it('offers a picker and no banner when no event is named', () => {
    render(<OverviewEventContext eventId={null} />)

    expect(screen.getByRole('combobox', { name: 'Contexte événement' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Retirer le contexte/ })).not.toBeInTheDocument()
  })

  it('shows the active context as a banner and hides the picker until it is removed', () => {
    render(<OverviewEventContext eventId="event-1" />)

    expect(screen.getByRole('status', { name: 'Contexte événement actif' })).toHaveTextContent('Overbound Paris')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('removes the context from the URL in one click', () => {
    render(<OverviewEventContext eventId="event-1" />)

    fireEvent.click(screen.getByRole('button', { name: /Retirer le contexte/ }))

    expect(replace).toHaveBeenCalledWith('/dashboard', { scroll: false })
  })

  it('sets the chosen event in the URL from the picker', () => {
    render(<OverviewEventContext eventId={null} />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Contexte événement' }), { target: { value: 'event-2' } })

    expect(replace).toHaveBeenCalledWith('/dashboard?event=event-2', { scroll: false })
  })
})
