import { describe, expect, it } from 'vitest'
import { parseTransferToken } from './transferToken'

const TOKEN = '72c24b79-68c0-4ca5-ac6a-6602e5afab58'

describe('parseTransferToken', () => {
  it('returns a clean token unchanged (lower-cased)', () => {
    expect(parseTransferToken(TOKEN)).toBe(TOKEN)
    expect(parseTransferToken(TOKEN.toUpperCase())).toBe(TOKEN)
  })

  it('recovers the token from a link with share-sheet text glued on', () => {
    expect(parseTransferToken(`${TOKEN}Ton billet caca — récupère-le avec ce lien :`)).toBe(TOKEN)
  })

  it('returns null when there is no token at all', () => {
    expect(parseTransferToken('not-a-token')).toBeNull()
    expect(parseTransferToken('')).toBeNull()
    expect(parseTransferToken(null)).toBeNull()
  })
})
