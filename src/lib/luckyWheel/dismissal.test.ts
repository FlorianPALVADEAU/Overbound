import { beforeEach, describe, expect, it } from 'vitest'
import { WHEEL_DISMISS_COOLDOWN_MS, isWheelDismissed, markWheelDismissed } from './dismissal'

describe('wheel dismissal', () => {
  beforeEach(() => localStorage.clear())

  it('is not dismissed by default', () => {
    expect(isWheelDismissed('e1')).toBe(false)
  })

  it('stays dismissed during the cooldown, per event', () => {
    markWheelDismissed('e1', 1000)
    expect(isWheelDismissed('e1', 1000 + WHEEL_DISMISS_COOLDOWN_MS - 1)).toBe(true)
    expect(isWheelDismissed('e2', 1000)).toBe(false)
  })

  it('comes back after the cooldown', () => {
    markWheelDismissed('e1', 1000)
    expect(isWheelDismissed('e1', 1000 + WHEEL_DISMISS_COOLDOWN_MS)).toBe(false)
  })
})
