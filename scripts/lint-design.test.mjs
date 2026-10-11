import { describe, expect, it } from 'vitest'
import { compare, countViolations } from './lint-design.mjs'

describe('countViolations', () => {
  it('counts each forbidden pattern', () => {
    const source = `<p className="text-[#26AA26] text-gray-300 text-[11px] tracking-[0.3em] font-black bg-red-600 dark:bg-card max-w-6xl">`
    expect(countViolations(source)).toEqual({
      'arbitrary-hex': 1,
      'raw-gray': 1,
      'arbitrary-font-size': 1,
      'arbitrary-tracking': 1,
      'font-black': 1,
      'raw-red': 1,
      'dark-variant': 1,
      'container-width': 1,
    })
  })

  it('accepts design-system tokens', () => {
    const source = `<h2 className="font-display text-display-md text-primary tracking-eyebrow text-label bg-signal text-subtle">`
    expect(countViolations(source)).toEqual({})
  })
})

describe('compare (ratchet)', () => {
  it('passes when legacy counts stay or go down', () => {
    const baseline = { 'a.tsx': { 'raw-gray': 3 } }
    expect(compare({ 'a.tsx': { 'raw-gray': 2 } }, baseline)).toEqual([])
  })

  it('fails when a count grows or a new file adds a violation', () => {
    const baseline = { 'a.tsx': { 'raw-gray': 3 } }
    const current = { 'a.tsx': { 'raw-gray': 4 }, 'b.tsx': { 'font-black': 1 } }
    expect(compare(current, baseline)).toEqual([
      { file: 'a.tsx', ruleId: 'raw-gray', n: 4, allowed: 3 },
      { file: 'b.tsx', ruleId: 'font-black', n: 1, allowed: 0 },
    ])
  })
})
