import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminEventContextSelector } from './AdminEventContextSelector'

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
  {
    id: 'event-1', slug: 'paris', title: 'Overbound Paris', date: '2026-09-20T08:00:00.000Z',
    location: 'Paris', capacity: 100, status: 'on_sale', created_at: '', updated_at: '',
  },
  {
    id: 'event-2', slug: 'lyon', title: 'Overbound Lyon', date: '2026-10-10T08:00:00.000Z',
    location: 'Lyon', capacity: 100, status: 'announced', created_at: '', updated_at: '',
  },
]

describe('AdminEventContextSelector', () => {
  beforeEach(() => {
    replace.mockReset()
    useAdminEvents.mockReset()
  })

  it('does not select an event when several are available without URL context', () => {
    useAdminEvents.mockReturnValue({ data: events, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() })

    render(<AdminEventContextSelector />)

    expect(screen.getByRole('status')).toHaveTextContent('Sélectionnez explicitement un événement')
    expect(screen.getByRole('combobox')).toHaveValue('__no_event__')
    expect(screen.getByRole('link', { name: /Participants/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('keeps the selected event in links and updates the URL on change', () => {
    useAdminEvents.mockReturnValue({ data: events, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() })

    render(<AdminEventContextSelector eventId="event-1" />)

    expect(screen.getByText('Overbound Paris')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Participants/ })).toHaveAttribute('href', '?tab=members&event=event-1')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'event-2' } })
    expect(replace).toHaveBeenCalledWith('/dashboard?event=event-2')
  })

  it('renders loading, error and empty states', () => {
    useAdminEvents.mockReturnValue({ data: [], isLoading: true, isError: false, isFetching: false, refetch: vi.fn() })
    const { rerender } = render(<AdminEventContextSelector />)
    expect(screen.getByLabelText('Chargement du contexte événement')).toBeInTheDocument()

    useAdminEvents.mockReturnValue({ data: [], isLoading: false, isError: true, error: new Error('API indisponible'), isFetching: false, refetch: vi.fn() })
    rerender(<AdminEventContextSelector />)
    expect(screen.getByText('Contexte événement indisponible')).toBeInTheDocument()

    useAdminEvents.mockReturnValue({ data: [], isLoading: false, isError: false, isFetching: false, refetch: vi.fn() })
    rerender(<AdminEventContextSelector />)
    expect(screen.getByText('Aucun événement disponible')).toBeInTheDocument()
  })
})
