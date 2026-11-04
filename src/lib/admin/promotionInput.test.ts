import { describe, expect, it } from 'vitest'
import { promotionUpdateSchema } from './promotionInput'

const valid = {
  title: 'Lucky Wheel',
  description: 'Tente ta chance',
  link_url: '/events/ultra-arena-2027',
  link_text: '',
  starts_at: '2027-01-01T00:00:00.000Z',
  ends_at: '2027-02-01T00:00:00.000Z',
}

describe('promotionUpdateSchema', () => {
  it('fills the defaults: banner type, active, and the standard link text when blank', () => {
    const parsed = promotionUpdateSchema.parse(valid)
    expect(parsed).toMatchObject({ type: 'banner', is_active: true, link_text: "Découvrir l'offre", popup_config: null })
  })

  it('refuses an end date that is not after the start date', () => {
    const result = promotionUpdateSchema.safeParse({ ...valid, ends_at: valid.starts_at })
    expect(result.success).toBe(false)
  })

  it('refuses a blank title, description or link', () => {
    expect(promotionUpdateSchema.safeParse({ ...valid, title: '  ' }).success).toBe(false)
    expect(promotionUpdateSchema.safeParse({ ...valid, description: '' }).success).toBe(false)
    expect(promotionUpdateSchema.safeParse({ ...valid, link_url: '' }).success).toBe(false)
  })

  it('refuses an unreadable date', () => {
    expect(promotionUpdateSchema.safeParse({ ...valid, starts_at: 'demain' }).success).toBe(false)
  })
})
