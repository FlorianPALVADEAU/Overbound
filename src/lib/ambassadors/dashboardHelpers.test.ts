import { describe, it, expect } from 'vitest'
import {
  resolveRewardStatus,
  deriveNameFromEmail,
  formatRecruitName,
  formatLeaderboardName,
  getTicketDetails,
} from './dashboardHelpers'

describe('resolveRewardStatus', () => {
  it('returns "claimed" for "claimed" (case-insensitive)', () => {
    expect(resolveRewardStatus('claimed')).toBe('claimed')
    expect(resolveRewardStatus('CLAIMED')).toBe('claimed')
  })

  it('returns "fulfilled" for "fulfilled" (case-insensitive)', () => {
    expect(resolveRewardStatus('fulfilled')).toBe('fulfilled')
    expect(resolveRewardStatus('FULFILLED')).toBe('fulfilled')
  })

  it('returns "cancelled" for "cancelled" so a cancelled reward is never shown as claimable', () => {
    expect(resolveRewardStatus('cancelled')).toBe('cancelled')
    expect(resolveRewardStatus('CANCELLED')).toBe('cancelled')
  })

  it('defaults to "earned" for anything else', () => {
    expect(resolveRewardStatus('earned')).toBe('earned')
    expect(resolveRewardStatus('')).toBe('earned')
    expect(resolveRewardStatus(null)).toBe('earned')
    expect(resolveRewardStatus(undefined)).toBe('earned')
    expect(resolveRewardStatus('unknown')).toBe('earned')
  })
})

describe('deriveNameFromEmail', () => {
  it('capitalizes the first letter of each word', () => {
    expect(deriveNameFromEmail('julien.damiani@gmail.com')).toBe('Julien Damiani')
  })

  it('replaces dots, underscores and hyphens with spaces', () => {
    expect(deriveNameFromEmail('jean_pierre.martin@test.com')).toBe('Jean Pierre Martin')
    expect(deriveNameFromEmail('anne-sophie@test.com')).toBe('Anne Sophie')
  })

  it('collapses multiple separators into a single space', () => {
    expect(deriveNameFromEmail('a..b--c__d@test.com')).toBe('A B C D')
  })

  it('handles email with no @ gracefully', () => {
    expect(deriveNameFromEmail('noatsign')).toBe('Noatsign')
  })

  it('trims leading and trailing whitespace from the result', () => {
    expect(deriveNameFromEmail('.leading@test.com')).toBe('Leading')
  })
})

describe('formatRecruitName', () => {
  describe('solo order (isSharedOrder = false)', () => {
    it('prefers full profile name', () => {
      expect(formatRecruitName(false, 'Julien Damiani', 'julien@test.com')).toBe('Julien Damiani')
    })

    it('falls back to email-derived name when the display name is absent', () => {
      expect(formatRecruitName(false, null, 'julien.damiani@test.com')).toBe('Julien Damiani')
      expect(formatRecruitName(false, '', 'julien.damiani@test.com')).toBe('Julien Damiani')
    })

    it('returns "Utilisateur" when both are missing', () => {
      expect(formatRecruitName(false, null, null)).toBe('Utilisateur')
      expect(formatRecruitName(false, undefined, undefined)).toBe('Utilisateur')
    })
  })

  describe('shared order (isSharedOrder = true)', () => {
    it('prefers email-derived name', () => {
      expect(formatRecruitName(true, 'Miloudi Payer', 'participant.reel@test.com')).toBe('Participant Reel')
    })

    it('falls back to the display name when email is absent', () => {
      expect(formatRecruitName(true, 'Miloudi Payer', null)).toBe('Miloudi Payer')
    })

    it('returns "Utilisateur" when both are missing', () => {
      expect(formatRecruitName(true, null, null)).toBe('Utilisateur')
    })

    it('shows individual names instead of the payer name for each registration', () => {
      const payer = 'Miloudi Payer'
      expect(formatRecruitName(true, payer, 'alice.martin@test.com')).toBe('Alice Martin')
      expect(formatRecruitName(true, payer, 'bob.dupont@test.com')).toBe('Bob Dupont')
      expect(formatRecruitName(true, payer, 'claire.durand@test.com')).toBe('Claire Durand')
    })
  })
})

describe('formatLeaderboardName', () => {
  it('returns "Prénom I." for a full name', () => {
    expect(formatLeaderboardName({ first_name: 'Julien', last_name: 'Damiani' }, 'uuid-1')).toBe('Julien D.')
    expect(formatLeaderboardName({ first_name: 'Anne', last_name: 'Sophie Martin' }, 'uuid-2')).toBe('Anne S.')
  })

  it('returns first name only if there is no last name', () => {
    expect(formatLeaderboardName({ first_name: 'Julien', last_name: null }, 'uuid-3')).toBe('Julien')
  })

  it('falls back to "Ambassadeur XXXX" using profile ID prefix when name is absent', () => {
    expect(formatLeaderboardName(null, 'abcd1234')).toBe('Ambassadeur ABCD')
    expect(formatLeaderboardName({ first_name: '', last_name: 'Martin' }, 'abcd1234')).toBe('Ambassadeur ABCD')
    expect(formatLeaderboardName({ first_name: '  ', last_name: null }, 'abcd1234')).toBe('Ambassadeur ABCD')
  })
})

describe('getTicketDetails', () => {
  it('returns nulls for null or non-object input', () => {
    expect(getTicketDetails(null)).toEqual({ name: null, race_format: null, race_name: null })
    expect(getTicketDetails(undefined)).toEqual({ name: null, race_format: null, race_name: null })
    expect(getTicketDetails('string')).toEqual({ name: null, race_format: null, race_name: null })
  })

  it('extracts fields from a plain ticket object', () => {
    const ticket = { name: 'Dossard Open', race_format: 'open', race: { name: 'Course A' } }
    expect(getTicketDetails(ticket)).toEqual({
      name: 'Dossard Open',
      race_format: 'open',
      race_name: 'Course A',
    })
  })

  it('unwraps ticket from a single-element array (Supabase join shape)', () => {
    const ticket = [{ name: 'Dossard Ranked', race_format: 'ranked', race: [{ name: 'Course B' }] }]
    expect(getTicketDetails(ticket)).toEqual({
      name: 'Dossard Ranked',
      race_format: 'ranked',
      race_name: 'Course B',
    })
  })

  it('handles a ticket with no race', () => {
    const ticket = { name: 'Dossard Open', race_format: 'open', race: null }
    expect(getTicketDetails(ticket)).toEqual({
      name: 'Dossard Open',
      race_format: 'open',
      race_name: null,
    })
  })

  it('handles missing optional fields gracefully', () => {
    expect(getTicketDetails({})).toEqual({ name: null, race_format: null, race_name: null })
  })
})
