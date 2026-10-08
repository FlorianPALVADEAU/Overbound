import { describe, expect, it } from 'vitest'
import {
  buildInviteMessage,
  buildInviteUrl,
  buildWhatsAppUrl,
  defaultGroupName,
  parseGroupIntent,
  parseInviteCode,
} from './invite'

describe('group invite helpers', () => {
  it('parses only known group intents', () => {
    expect(parseGroupIntent('create')).toBe('create')
    expect(parseGroupIntent('join')).toBe('join')
    expect(parseGroupIntent('delete')).toBeNull()
    expect(parseGroupIntent(null)).toBeNull()
  })

  it('normalizes a valid invite code and rejects junk', () => {
    expect(parseInviteCode(' ab12cd34 ')).toBe('AB12CD34')
    expect(parseInviteCode('<script>')).toBeNull()
    expect(parseInviteCode('')).toBeNull()
    expect(parseInviteCode(undefined)).toBeNull()
  })

  it('builds a registration link carrying the invite code', () => {
    expect(buildInviteUrl('https://x.test', 'edition-1', 'AB12CD34')).toBe(
      'https://x.test/events/edition-1/register?invite=AB12CD34',
    )
  })

  it('builds a WhatsApp link with the encoded message', () => {
    const message = buildInviteMessage('Ultra Arena', 'https://x.test/r?invite=AB')
    expect(buildWhatsAppUrl(message)).toBe(`https://wa.me/?text=${encodeURIComponent(message)}`)
    expect(message).toContain('Ultra Arena')
  })

  it('names a group after the first name, with a fallback', () => {
    expect(defaultGroupName('Camille Durand')).toBe('Groupe de Camille')
    expect(defaultGroupName(null)).toBe('Mon groupe')
    expect(defaultGroupName('   ')).toBe('Mon groupe')
  })
})
