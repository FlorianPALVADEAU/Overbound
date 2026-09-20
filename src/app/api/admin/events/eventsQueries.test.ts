import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMock = vi.hoisted(() => vi.fn())

vi.mock('../../axiosClient', () => ({
  default: { post: postMock },
}))

import { provisionAdminEventWaves } from './eventsQueries'

describe('provisionAdminEventWaves', () => {
  beforeEach(() => vi.clearAllMocks())

  it('accepts the 201 response returned after creating a SAS', async () => {
    postMock.mockResolvedValue({ status: 201, data: { created: true, wave_count: 1 } })

    await expect(provisionAdminEventWaves('event-1', 'ticket-1', {
      mode: 'single',
      start_time: '2027-02-07T11:00:00.000Z',
      capacity: 50,
    })).resolves.toEqual({ created: true, wave_count: 1 })
  })
})
