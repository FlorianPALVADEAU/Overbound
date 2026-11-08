import { beforeEach, describe, expect, it, vi } from 'vitest'

const { resolveAudienceMock, loadSegmentIdentityMock } = vi.hoisted(() => ({
  resolveAudienceMock: vi.fn(),
  loadSegmentIdentityMock: vi.fn(),
}))

vi.mock('@/lib/email/audience', () => ({ resolveAudience: resolveAudienceMock }))
vi.mock('@/lib/email/segmentStore', () => ({ loadSegmentIdentity: loadSegmentIdentityMock }))

import { resolveSegmentedAudience } from './segmentedAudience'

const audience = [
  { email: 'buyer@x.fr', userId: 'u1' },
  { email: 'lead@x.fr', userId: null },
]

beforeEach(() => {
  vi.clearAllMocks()
  resolveAudienceMock.mockResolvedValue(audience)
  loadSegmentIdentityMock.mockResolvedValue({ userIds: new Set(['u1']), emails: new Set() })
})

describe('resolveSegmentedAudience', () => {
  it('returns the consenting audience untouched, without reading a segment, for all', async () => {
    const result = await resolveSegmentedAudience({ listIds: ['l1'] })

    expect(result).toEqual(audience)
    expect(loadSegmentIdentityMock).not.toHaveBeenCalled()
  })

  it('narrows the consenting audience to registered people of one event', async () => {
    const result = await resolveSegmentedAudience({ listIds: ['l1'], segment: 'registered', eventId: 'e1' })

    expect(result.map((r) => r.email)).toEqual(['buyer@x.fr'])
    expect(resolveAudienceMock).toHaveBeenCalledWith({ listIds: ['l1'] })
    expect(loadSegmentIdentityMock).toHaveBeenCalledWith('registered', 'e1')
  })

  it('returns people who are not registered', async () => {
    const result = await resolveSegmentedAudience({ listIds: ['l1'], segment: 'not_registered' })

    expect(result.map((r) => r.email)).toEqual(['lead@x.fr'])
  })

  it('never widens the audience when the segment cannot be read', async () => {
    loadSegmentIdentityMock.mockRejectedValue(new Error('down'))

    await expect(resolveSegmentedAudience({ listIds: ['l1'], segment: 'registered' })).rejects.toThrow('down')
  })
})
