import { describe, it, expect } from 'vitest'
import {
  resolveUpsellSizes,
  extractTshirtSizes,
  normalizeTshirtSizes,
  buildTshirtMeta,
  calculatePromoDiscount,
  calculatePromoDiscounts,
  joinName,
  humanizeMetaKey,
} from './registration'
import { DEFAULT_TSHIRT_SIZES } from '@/constants/registration'

describe('registration utils', () => {
  describe('resolveUpsellSizes', () => {
    it('returns custom sizes when defined and non-empty', () => {
      const upsell = { options: { sizes: ['S', 'M', 'L'] } } as any
      expect(resolveUpsellSizes(upsell)).toEqual(['S', 'M', 'L'])
    })

    it('returns default sizes when options are null', () => {
      const upsell = { options: null } as any
      expect(resolveUpsellSizes(upsell)).toEqual(DEFAULT_TSHIRT_SIZES)
    })

    it('returns default sizes when sizes array is empty', () => {
      const upsell = { options: { sizes: [] } } as any
      expect(resolveUpsellSizes(upsell)).toEqual(DEFAULT_TSHIRT_SIZES)
    })

    it('returns default sizes when options are undefined', () => {
      const upsell = {} as any
      expect(resolveUpsellSizes(upsell)).toEqual(DEFAULT_TSHIRT_SIZES)
    })

    it('returns default sizes when sizes is null', () => {
      const upsell = { options: { sizes: null } } as any
      expect(resolveUpsellSizes(upsell)).toEqual(DEFAULT_TSHIRT_SIZES)
    })
  })

  describe('extractTshirtSizes', () => {
    it('returns empty array for undefined meta', () => {
      expect(extractTshirtSizes(undefined)).toEqual([])
    })

    it('returns empty array for empty meta object', () => {
      expect(extractTshirtSizes({})).toEqual([])
    })

    it('extracts valid sizes from meta.sizes array', () => {
      expect(extractTshirtSizes({ sizes: ['S', 'M', 'L'] })).toEqual(['S', 'M', 'L'])
    })

    it('filters out non-string values from sizes array', () => {
      expect(extractTshirtSizes({ sizes: ['S', 123, null, 'L'] })).toEqual(['S', 'L'])
    })

    it('filters out empty strings from sizes array', () => {
      expect(extractTshirtSizes({ sizes: ['S', '', 'L'] })).toEqual(['S', 'L'])
    })

    it('extracts single size from meta.size string', () => {
      expect(extractTshirtSizes({ size: 'XL' })).toEqual(['XL'])
    })

    it('returns empty for blank meta.size string', () => {
      expect(extractTshirtSizes({ size: '   ' })).toEqual([])
      expect(extractTshirtSizes({ size: '' })).toEqual([])
    })

    it('prefers sizes array over size string when both are present', () => {
      expect(extractTshirtSizes({ sizes: ['S'], size: 'XL' })).toEqual(['S'])
    })
  })

  describe('normalizeTshirtSizes', () => {
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL']

    it('returns empty array when quantity is 0', () => {
      expect(normalizeTshirtSizes({}, 0, availableSizes)).toEqual([])
    })

    it('returns empty array when quantity is negative', () => {
      expect(normalizeTshirtSizes({}, -5, availableSizes)).toEqual([])
    })

    it('fills with fallback (first available) when no initial sizes', () => {
      expect(normalizeTshirtSizes({}, 3, availableSizes)).toEqual(['XS', 'XS', 'XS'])
    })

    it('uses valid existing sizes and fills remainder with fallback', () => {
      const result = normalizeTshirtSizes({ sizes: ['S', 'M'] }, 4, availableSizes)
      expect(result).toEqual(['S', 'M', 'XS', 'XS'])
    })

    it('truncates to quantity when more sizes than needed', () => {
      const result = normalizeTshirtSizes({ sizes: ['S', 'M', 'L', 'XL'] }, 2, availableSizes)
      expect(result).toEqual(['S', 'M'])
    })

    it('replaces invalid sizes with fallback', () => {
      const result = normalizeTshirtSizes({ sizes: ['INVALID', 'S'] }, 2, availableSizes)
      expect(result).toEqual(['XS', 'S'])
    })

    it('always returns exactly quantity items', () => {
      expect(normalizeTshirtSizes({ sizes: ['S'] }, 5, availableSizes)).toHaveLength(5)
      expect(normalizeTshirtSizes({ sizes: ['S', 'M', 'L', 'XL', 'XS'] }, 2, availableSizes)).toHaveLength(2)
    })

    it('uses first available size as fallback when no sizes provided', () => {
      const sizes = ['M', 'L']
      const result = normalizeTshirtSizes({}, 2, sizes)
      expect(result).toEqual(['M', 'M'])
    })
  })

  describe('buildTshirtMeta', () => {
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL']

    it('returns empty object when quantity is 0', () => {
      expect(buildTshirtMeta({}, 0, availableSizes)).toEqual({})
    })

    it('returns empty object when quantity is negative', () => {
      expect(buildTshirtMeta({ sizes: ['S'] }, -1, availableSizes)).toEqual({})
    })

    it('includes a sizes array in the result', () => {
      const result = buildTshirtMeta({ sizes: ['S', 'M'] }, 2, availableSizes)
      expect(result.sizes).toEqual(['S', 'M'])
    })

    it('removes the legacy .size key', () => {
      const result = buildTshirtMeta({ size: 'S' }, 1, availableSizes)
      expect(result.size).toBeUndefined()
      expect(result.sizes).toHaveLength(1)
    })

    it('preserves other meta fields alongside sizes', () => {
      const result = buildTshirtMeta({ customField: 'value', size: 'S' }, 1, availableSizes)
      expect(result.customField).toBe('value')
      expect(result.size).toBeUndefined()
    })

    it('sizes array length matches requested quantity', () => {
      const result = buildTshirtMeta({}, 3, availableSizes)
      expect(result.sizes).toHaveLength(3)
    })
  })

  describe('calculatePromoDiscount', () => {
    const basePromo = {
      id: 'promo1',
      code: 'TEST10',
      currency: 'eur' as const,
      discount_percent: null as number | null,
      discount_amount: null as number | null,
    }

    it('returns 0 when promo is null', () => {
      expect(calculatePromoDiscount(null, 10000)).toBe(0)
    })

    it('returns 0 when ticketSubtotal is 0', () => {
      expect(calculatePromoDiscount({ ...basePromo, discount_percent: 20 }, 0)).toBe(0)
    })

    it('returns 0 when ticketSubtotal is negative', () => {
      expect(calculatePromoDiscount({ ...basePromo, discount_percent: 20 }, -100)).toBe(0)
    })

    it('applies percentage discount correctly', () => {
      expect(calculatePromoDiscount({ ...basePromo, discount_percent: 20 }, 10000)).toBe(2000)
    })

    it('applies fixed amount discount correctly', () => {
      expect(calculatePromoDiscount({ ...basePromo, discount_amount: 1500 }, 10000)).toBe(1500)
    })

    it('caps percentage discount at ticket subtotal', () => {
      expect(calculatePromoDiscount({ ...basePromo, discount_percent: 100 }, 10000)).toBe(10000)
    })

    it('caps fixed discount at ticket subtotal', () => {
      expect(calculatePromoDiscount({ ...basePromo, discount_amount: 15000 }, 10000)).toBe(10000)
    })

    it('prefers percentage discount over fixed amount when both are set', () => {
      const result = calculatePromoDiscount(
        { ...basePromo, discount_percent: 10, discount_amount: 500 },
        10000,
      )
      expect(result).toBe(1000)
    })

    it('returns 0 when both discount fields are null or zero', () => {
      expect(calculatePromoDiscount(basePromo, 10000)).toBe(0)
      expect(calculatePromoDiscount({ ...basePromo, discount_percent: 0 }, 10000)).toBe(0)
    })

    it('rounds correctly for non-round percentages', () => {
      // 33% de 10001 = 3300.33 → arrondi à 3300
      expect(calculatePromoDiscount({ ...basePromo, discount_percent: 33 }, 10001)).toBe(3300)
    })

    it('applies LUOFF30 only as the better-over-tier delta when non-cumulable', () => {
      const result = calculatePromoDiscount(
        { ...basePromo, code: 'LUOFF30', discount_percent: 30 },
        8000,
        {
          baseTicketSubtotal: 10000,
          tierDiscountAmount: 2000,
        },
      )

      // Palier = 2000, LUOFF30 seule = 3000 -> on n'ajoute que 1000 (meilleur écart)
      expect(result).toBe(1000)
    })

    it('does not apply LUOFF30 when active tier discount is already better', () => {
      const result = calculatePromoDiscount(
        { ...basePromo, code: 'LUOFF30', discount_percent: 30 },
        6000,
        {
          baseTicketSubtotal: 10000,
          tierDiscountAmount: 4000,
        },
      )

      expect(result).toBe(0)
    })
  })

  describe('calculatePromoDiscounts', () => {
    const basePromo = {
      id: 'promo1',
      code: 'TEST10',
      currency: 'eur' as const,
      discount_percent: null as number | null,
      discount_amount: null as number | null,
      is_ambassador: false,
    }

    it('returns 0 when no promos are provided', () => {
      expect(calculatePromoDiscounts([], 10000)).toBe(0)
    })

    it('sums multiple promo discounts and caps at subtotal', () => {
      const promos = [
        { ...basePromo, code: 'A', discount_percent: 20 },
        { ...basePromo, code: 'B', discount_amount: 1500 },
      ]

      expect(calculatePromoDiscounts(promos, 10000)).toBe(3500)
    })

    it('caps combined discount at ticket subtotal', () => {
      const promos = [
        { ...basePromo, code: 'A', discount_amount: 9000 },
        { ...basePromo, code: 'B', discount_amount: 5000 },
      ]

      expect(calculatePromoDiscounts(promos, 10000)).toBe(10000)
    })

    it('keeps LUOFF30 non-cumulable with tier discounts at aggregate level', () => {
      const promos = [
        { ...basePromo, code: 'LUOFF30', discount_percent: 30 },
      ]

      const discount = calculatePromoDiscounts(promos, 8000, {
        baseTicketSubtotal: 10000,
        tierDiscountAmount: 2000,
      })

      expect(discount).toBe(1000)
    })
  })

  describe('joinName', () => {
    it('joins first and last name with a space', () => {
      expect(joinName('Jean', 'Dupont')).toBe('Jean Dupont')
    })

    it('trims extra whitespace from both names', () => {
      expect(joinName('  Jean  ', '  Dupont  ')).toBe('Jean Dupont')
    })

    it('handles empty first name', () => {
      expect(joinName('', 'Dupont')).toBe('Dupont')
    })

    it('handles empty last name', () => {
      expect(joinName('Jean', '')).toBe('Jean')
    })

    it('handles both names empty', () => {
      expect(joinName('', '')).toBe('')
    })
  })

  describe('humanizeMetaKey', () => {
    it('replaces underscores with spaces', () => {
      expect(humanizeMetaKey('first_name')).toBe('First Name')
    })

    it('capitalizes the first letter of each word', () => {
      expect(humanizeMetaKey('emergency_contact_name')).toBe('Emergency Contact Name')
    })

    it('handles a single-word key', () => {
      expect(humanizeMetaKey('name')).toBe('Name')
    })

    it('handles an already-capitalized key', () => {
      expect(humanizeMetaKey('Name')).toBe('Name')
    })

    it('handles multiple consecutive underscores', () => {
      // underscores deviennent des espaces, chaque mot est capitalisé
      expect(humanizeMetaKey('a_b')).toBe('A B')
    })
  })
})
