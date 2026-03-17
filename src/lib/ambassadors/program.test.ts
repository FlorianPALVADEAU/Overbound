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
      expect(result?.points_required).toBe(1)
      expect(result?.points_remaining).toBe(1)
    })

    it('calculates points_remaining correctly when partway through a level', () => {
      const result = getNextReward(4)
      expect(result?.reward_level).toBe(4)
      expect(result?.points_remaining).toBe(1)
    })

    it('returns next level once a threshold is exactly reached', () => {
      const result = getNextReward(3)
      expect(result?.reward_level).toBe(4)
      expect(result?.points_required).toBe(5)
      expect(result?.points_remaining).toBe(2)
    })

    it('returns level 5 reward at 5 points', () => {
      const result = getNextReward(5)
      expect(result?.reward_level).toBe(5)
      expect(result?.points_required).toBe(8)
      expect(result?.points_remaining).toBe(3)
    })

    it('returns level 8 reward at 15 points', () => {
      const result = getNextReward(15)
      expect(result?.reward_level).toBe(8)
      expect(result?.points_required).toBe(20)
    })

    it('returns level 10 reward at 25 points', () => {
      const result = getNextReward(25)
      expect(result?.reward_level).toBe(10)
      expect(result?.points_required).toBe(30)
    })

    it('returns null when max level is reached (30+ points)', () => {
      expect(getNextReward(30)).toBeNull()
      expect(getNextReward(100)).toBeNull()
    })

    it('points_remaining is never negative', () => {
      const result = getNextReward(29)
      expect(result?.points_remaining).toBeGreaterThanOrEqual(0)
    })

    it('returned reward_name matches the AMBASSADOR_REWARD_LEVELS constant', () => {
      const result = getNextReward(0)
      const expectedLevel = AMBASSADOR_REWARD_LEVELS.find((l) => l.reward_level === 1)
      expect(result?.reward_name).toBe(expectedLevel?.reward_name)
    })
  })

  describe('getCurrentRewardLevel', () => {
    it('returns 0 when points < 1', () => {
      expect(getCurrentRewardLevel(0)).toBe(0)
    })

    it('returns 1 for 1 point', () => {
      expect(getCurrentRewardLevel(1)).toBe(1)
    })

    it('returns 3 for 3 points', () => {
      expect(getCurrentRewardLevel(3)).toBe(3)
    })

    it('returns 5 for [8, 9] points', () => {
      expect(getCurrentRewardLevel(8)).toBe(5)
      expect(getCurrentRewardLevel(9)).toBe(5)
    })

    it('returns 8 for [20, 24] points', () => {
      expect(getCurrentRewardLevel(20)).toBe(8)
      expect(getCurrentRewardLevel(24)).toBe(8)
    })

    it('returns 10 for 30+ points', () => {
      expect(getCurrentRewardLevel(30)).toBe(10)
      expect(getCurrentRewardLevel(999)).toBe(10)
    })

    it('getNextReward and getCurrentRewardLevel are consistent', () => {
      expect(getCurrentRewardLevel(3)).toBe(3)
      expect(getNextReward(3)?.reward_level).toBe(4)
    })
  })
})
