import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('keeps a design-system font size next to a color', () => {
    expect(cn('text-display-md', 'text-primary')).toBe('text-display-md text-primary')
  })

  it('still dedupes two font sizes, including custom ones', () => {
    expect(cn('text-sm', 'text-lead')).toBe('text-lead')
    expect(cn('tracking-tight', 'tracking-eyebrow')).toBe('tracking-eyebrow')
  })
})
