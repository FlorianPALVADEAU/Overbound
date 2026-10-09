import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const navigation = vi.hoisted(() => ({ pathname: '/' as string | null }))
const queries = vi.hoisted(() => ({
  useEventDetail: vi.fn(),
  useFeaturedEvent: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

vi.mock('@/app/api/events/[id]/eventDetailQueries', () => ({
  useEventDetail: queries.useEventDetail,
}))

vi.mock('@/app/api/events/featured/featuredEventQueries', () => ({
  useFeaturedEvent: queries.useFeaturedEvent,
}))

// The real widget fetches its campaign and owns its trigger logic; here we
// only check which event GlobalLuckyWheelWidget hands it, and whether it
// mounts it at all.
vi.mock('next/dynamic', () => ({
  default: () =>
    function LuckyWheelWidgetStub({ eventId }: { eventId: string }) {
      return <div data-testid="lucky-wheel" data-event-id={eventId} />
    },
}))

import { GlobalLuckyWheelWidget } from './GlobalLuckyWheelWidget'

const FEATURED_EVENT_ID = '00000000-0000-4000-8000-000000000001'
const ROUTE_EVENT_ID = '00000000-0000-4000-8000-000000000002'

const renderAt = (pathname: string | null) => {
  navigation.pathname = pathname
  return render(<GlobalLuckyWheelWidget />)
}

describe('GlobalLuckyWheelWidget', () => {
  beforeEach(() => {
    queries.useEventDetail.mockReset()
    queries.useFeaturedEvent.mockReset()
    queries.useEventDetail.mockImplementation((id: string) => ({
      data: id ? { event: { id: ROUTE_EVENT_ID } } : undefined,
    }))
    queries.useFeaturedEvent.mockReturnValue({ data: { event: { id: FEATURED_EVENT_ID } } })
  })

  it.each(['/', '/events/formats', '/obstacles'])('mounts the wheel on the featured event on %s', (pathname) => {
    renderAt(pathname)

    expect(screen.getByTestId('lucky-wheel')).toHaveAttribute('data-event-id', FEATURED_EVENT_ID)
    // No event lookup by URL param on these pages (empty id = query disabled).
    expect(queries.useEventDetail).toHaveBeenCalledWith('')
  })

  it('mounts the wheel on the event named in the URL on an event page', () => {
    renderAt('/events/ultra-arena-2026')

    expect(queries.useEventDetail).toHaveBeenCalledWith('ultra-arena-2026')
    expect(screen.getByTestId('lucky-wheel')).toHaveAttribute('data-event-id', ROUTE_EVENT_ID)
  })

  it('never falls back to the featured event while the URL event is unresolved', () => {
    queries.useEventDetail.mockReturnValue({ data: undefined })

    renderAt('/events/unknown-slug')

    expect(screen.queryByTestId('lucky-wheel')).not.toBeInTheDocument()
  })

  it.each([
    '/volunteers',
    '/bootcamps',
    '/about/faq',
    '/events/ultra-arena-2026/register',
    '/races/some-race-id',
    '/account/ticket/abc',
    '/dashboard',
  ])('renders nothing on %s and never looks up the URL param as an event', (pathname) => {
    const { container } = renderAt(pathname)

    expect(container).toBeEmptyDOMElement()
    expect(queries.useEventDetail).toHaveBeenCalledWith('')
  })

  it('renders nothing when no featured event exists', () => {
    queries.useFeaturedEvent.mockReturnValue({ data: { event: null } })

    const { container } = renderAt('/')

    expect(container).toBeEmptyDOMElement()
  })

  it('unmounts the wheel on client-side navigation to a non-allowlisted route', () => {
    const { rerender } = renderAt('/')
    expect(screen.getByTestId('lucky-wheel')).toBeInTheDocument()

    navigation.pathname = '/volunteers'
    rerender(<GlobalLuckyWheelWidget />)

    expect(screen.queryByTestId('lucky-wheel')).not.toBeInTheDocument()
  })

  it('swaps target event on client-side navigation from a page to an event page', () => {
    const { rerender } = renderAt('/')
    expect(screen.getByTestId('lucky-wheel')).toHaveAttribute('data-event-id', FEATURED_EVENT_ID)

    navigation.pathname = '/events/ultra-arena-2026'
    rerender(<GlobalLuckyWheelWidget />)

    expect(screen.getByTestId('lucky-wheel')).toHaveAttribute('data-event-id', ROUTE_EVENT_ID)
  })
})
