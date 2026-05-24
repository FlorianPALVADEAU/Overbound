import { describe, expect, it } from 'vitest'
import { buildMetaUserData } from './metaCapi'

const EMAIL_HASH = 'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514'
const EXTERNAL_ID_HASH = 'fcdec6df4d44dbc637c7c5b58efface52a7f8a88535423430255be0bb89bedd8'

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
      em: [EMAIL_HASH],
      external_id: [EXTERNAL_ID_HASH],
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
