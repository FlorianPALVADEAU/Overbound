import { describe, expect, it } from 'vitest'
import { isHoneypotTriggered, labelOf, PROJECT_TYPES, quoteRequestSchema, toQuoteRow } from './quoteRequest'

const valid = {
  companyName: 'Acme',
  fullName: 'Claire Martin',
  email: '  Claire@Acme.FR ',
  teamSize: '10-19',
  projectType: 'tickets',
}

describe('quoteRequestSchema', () => {
  it('accepts a minimal request and lowercases the email', () => {
    const parsed = quoteRequestSchema.parse(valid)
    expect(parsed.email).toBe('claire@acme.fr')
  })

  it('rejects an invalid email', () => {
    expect(quoteRequestSchema.safeParse({ ...valid, email: 'claire' }).success).toBe(false)
  })

  it('rejects a team size outside the grid', () => {
    expect(quoteRequestSchema.safeParse({ ...valid, teamSize: '1000' }).success).toBe(false)
  })

  it('rejects a line break in a single-line field (subject injection)', () => {
    expect(quoteRequestSchema.safeParse({ ...valid, companyName: 'Acme\nBcc: x@y.z' }).success).toBe(false)
  })

  it('rejects an unknown utm key', () => {
    expect(quoteRequestSchema.safeParse({ ...valid, utm: { fbclid: 'x' } }).success).toBe(false)
  })
})

describe('toQuoteRow', () => {
  it('stores empty optional fields as null', () => {
    const row = toQuoteRow(quoteRequestSchema.parse({ ...valid, phone: '', message: '', utm: {} }))
    expect(row).toMatchObject({ phone: null, message: null, utm: null, company_name: 'Acme' })
  })
})

describe('isHoneypotTriggered', () => {
  it('flags a filled honeypot only', () => {
    expect(isHoneypotTriggered({ website: 'http://spam' })).toBe(true)
    expect(isHoneypotTriggered({ website: '  ' })).toBe(false)
    expect(isHoneypotTriggered({})).toBe(false)
  })
})

describe('labelOf', () => {
  it('falls back to the raw value', () => {
    expect(labelOf(PROJECT_TYPES, 'custom')).toBe('Événement sur mesure')
    expect(labelOf(PROJECT_TYPES, 'other')).toBe('other')
  })
})
