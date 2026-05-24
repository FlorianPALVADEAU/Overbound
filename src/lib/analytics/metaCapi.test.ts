import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildMetaUserData } from './metaCapi'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

describe('buildMetaUserData', () => {
  it('hashes user identifiers and keeps transport fields intact', () => {
    expect(
      buildMetaUserData({
        email: '  User@Example.com ',
        externalId: '  user-123  ',
        clientIpAddress: '127.0.0.1',
        clientUserAgent: 'Mozilla/5.0',
        fbp: 'fbp-token',
        fbc: 'fbc-token',
      }),
    ).toEqual({
      em: [sha256('user@example.com')],
      external_id: [sha256('user-123')],
      client_ip_address: '127.0.0.1',
      client_user_agent: 'Mozilla/5.0',
      fbp: 'fbp-token',
      fbc: 'fbc-token',
    })
  })

  it('returns undefined when no user data is provided', () => {
    expect(buildMetaUserData()).toBeUndefined()
  })
})
