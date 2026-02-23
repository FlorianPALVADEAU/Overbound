import { describe, it, expect } from 'vitest'
import {
  resolveRaceFormat,
  resolvePaymentStatus,
  getNextReward,
  getCurrentRewardLevel,
  AMBASSADOR_REWARD_LEVELS,
} from './program'

describe('Ambassador Program Utils', () => {
  describe('resolveRaceFormat', () => {
    it('returns "ranked" for "ranked" string', () => {
      expect(resolveRaceFormat('ranked')).toBe('ranked')
    })

    it('returns "ranked" for uppercase "RANKED"', () => {
      expect(resolveRaceFormat('RANKED')).toBe('ranked')
    })

    it('returns "ranked" for mixed case "Ranked"', () => {
      expect(resolveRaceFormat('Ranked')).toBe('ranked')
    })

    it('returns "open" for "open"', () => {
      expect(resolveRaceFormat('open')).toBe('open')
    })

    it('returns "open" for null', () => {
      expect(resolveRaceFormat(null)).toBe('open')
    })

    it('returns "open" for undefined', () => {
      expect(resolveRaceFormat(undefined)).toBe('open')
    })

    it('returns "open" for unknown values', () => {
      expect(resolveRaceFormat('elite')).toBe('open')
      expect(resolveRaceFormat('trail')).toBe('open')
    })
  })

  describe('resolvePaymentStatus', () => {
    it('returns "paid" for "paid"', () => {
      expect(resolvePaymentStatus('paid')).toBe('paid')
    })

    it('returns "refunded" for "refunded"', () => {
      expect(resolvePaymentStatus('refunded')).toBe('refunded')
    })

    it('returns "cancelled" for "cancelled"', () => {
      expect(resolvePaymentStatus('cancelled')).toBe('cancelled')
    })

    it('returns "pending" for unknown values', () => {
      expect(resolvePaymentStatus('unknown')).toBe('pending')
      expect(resolvePaymentStatus('processing')).toBe('pending')
    })

    it('returns "pending" for null', () => {
      expect(resolvePaymentStatus(null)).toBe('pending')
    })

    it('returns "pending" for undefined', () => {
      expect(resolvePaymentStatus(undefined)).toBe('pending')
    })

    it('is case-insensitive', () => {
      expect(resolvePaymentStatus('PAID')).toBe('paid')
      expect(resolvePaymentStatus('Refunded')).toBe('refunded')
      expect(resolvePaymentStatus('CANCELLED')).toBe('cancelled')
    })
  })

  describe('getNextReward', () => {
    it('returns level 1 reward for 0 points', () => {
      const result = getNextReward(0)
      expect(result?.reward_level).toBe(1)
      expect(result?.points_required).toBe(5)
      expect(result?.points_remaining).toBe(5)
    })

    it('calculates points_remaining correctly when partway through a level', () => {
      const result = getNextReward(3)
      expect(result?.reward_level).toBe(1)
      expect(result?.points_remaining).toBe(2)
    })

    it('returns next level once a threshold is exactly reached', () => {
      const result = getNextReward(5)
      expect(result?.reward_level).toBe(2)
      expect(result?.points_required).toBe(10)
      expect(result?.points_remaining).toBe(5)
    })

    it('returns level 3 reward at 10 points', () => {
      const result = getNextReward(10)
      expect(result?.reward_level).toBe(3)
      expect(result?.points_required).toBe(20)
    })

    it('returns level 4 reward at 20 points', () => {
      const result = getNextReward(20)
      expect(result?.reward_level).toBe(4)
      expect(result?.points_required).toBe(35)
    })

    it('returns level 5 reward at 35 points', () => {
      const result = getNextReward(35)
      expect(result?.reward_level).toBe(5)
      expect(result?.points_required).toBe(50)
    })

    it('returns null when max level is reached (50+ points)', () => {
      expect(getNextReward(50)).toBeNull()
      expect(getNextReward(100)).toBeNull()
    })

    it('points_remaining is never negative', () => {
      // 4 points → 1 point before level 1
      const result = getNextReward(4)
      expect(result?.points_remaining).toBeGreaterThanOrEqual(0)
    })

    it('returned reward_name matches the AMBASSADOR_REWARD_LEVELS constant', () => {
      const result = getNextReward(0)
      const expectedLevel = AMBASSADOR_REWARD_LEVELS.find((l) => l.reward_level === 1)
      expect(result?.reward_name).toBe(expectedLevel?.reward_name)
    })
  })

  describe('getCurrentRewardLevel', () => {
    it('returns 0 when points < 5', () => {
      expect(getCurrentRewardLevel(0)).toBe(0)
      expect(getCurrentRewardLevel(4)).toBe(0)
    })

    it('returns 1 for [5, 9] points', () => {
      expect(getCurrentRewardLevel(5)).toBe(1)
      expect(getCurrentRewardLevel(9)).toBe(1)
    })

    it('returns 2 for [10, 19] points', () => {
      expect(getCurrentRewardLevel(10)).toBe(2)
      expect(getCurrentRewardLevel(19)).toBe(2)
    })

    it('returns 3 for [20, 34] points', () => {
      expect(getCurrentRewardLevel(20)).toBe(3)
      expect(getCurrentRewardLevel(34)).toBe(3)
    })

    it('returns 4 for [35, 49] points', () => {
      expect(getCurrentRewardLevel(35)).toBe(4)
      expect(getCurrentRewardLevel(49)).toBe(4)
    })

    it('returns 5 for 50+ points', () => {
      expect(getCurrentRewardLevel(50)).toBe(5)
      expect(getCurrentRewardLevel(999)).toBe(5)
    })

    it('getNextReward and getCurrentRewardLevel are consistent', () => {
      // À 5 points on est level 1, le suivant est level 2
      expect(getCurrentRewardLevel(5)).toBe(1)
      expect(getNextReward(5)?.reward_level).toBe(2)
    })
  })
})
