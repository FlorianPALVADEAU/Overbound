import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSelectableOpenWaves } from './useSelectableOpenWaves'

const WAVES = { waves: [{ wave_index: 1, start_time: '2027-09-12T10:00:00+00:00', remaining: 10, capacity: 10 }] }

describe('useSelectableOpenWaves', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the waves of an enabled ticket', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(WAVES), { status: 200 })))

    const { result } = renderHook(() => useSelectableOpenWaves('event-1', 'ticket-1', true))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.waves).toEqual(WAVES.waves)
  })

  it('is not loading once it is disabled while a request is in flight (the select must not stay greyed)', async () => {
    let release: (response: Response) => void = () => undefined
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { release = resolve })))

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useSelectableOpenWaves('event-1', 'ticket-1', enabled),
      { initialProps: { enabled: true } },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(true))

    rerender({ enabled: false })
    await act(async () => {
      release(new Response(JSON.stringify(WAVES), { status: 200 }))
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.waves).toEqual([])
  })
})
