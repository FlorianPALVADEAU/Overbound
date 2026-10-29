import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getResendAudienceIdForSlug', () => {
  afterEach(() => {
    vi.resetModules()
    delete process.env.RESEND_DEFAULT_AUDIENCE_ID
    delete process.env.RESEND_AUDIENCE_EVENTS_ANNOUNCEMENTS
    delete process.env.RESEND_TOPIC_EVENTS_ANNOUNCEMENTS
  })

  it('prefers the slug-specific audience over the default audience', async () => {
    process.env.RESEND_DEFAULT_AUDIENCE_ID = 'default-audience'
    process.env.RESEND_AUDIENCE_EVENTS_ANNOUNCEMENTS = 'events-audience'

    const { getResendAudienceIdForSlug } = await import('./resendAudiences')
    expect(getResendAudienceIdForSlug('events-announcements')).toBe('events-audience')
  })

  it('uses the topic audience when no slug-specific variable exists', async () => {
    process.env.RESEND_DEFAULT_AUDIENCE_ID = 'default-audience'
    process.env.RESEND_TOPIC_EVENTS_ANNOUNCEMENTS = 'topic-audience'

    const { getResendAudienceIdForSlug } = await import('./resendAudiences')
    expect(getResendAudienceIdForSlug('events-announcements')).toBe('topic-audience')
  })
})

describe('EMAIL_CONTACTS_SYNC', () => {
  afterEach(() => {
    vi.resetModules()
    delete process.env.EMAIL_CONTACTS_SYNC
    delete process.env.RESEND_API_KEY
  })

  it('turns every Resend contact call into a no-op when set to off', async () => {
    process.env.EMAIL_CONTACTS_SYNC = 'off'
    delete process.env.RESEND_API_KEY

    const audiences = await import('./resendAudiences')

    await expect(audiences.listResendAudienceContacts('aud')).resolves.toEqual([])
    await expect(audiences.isResendContactSubscribed({ email: 'a@b.fr', audienceId: 'aud' })).resolves.toBe(false)
    await expect(audiences.getResendTopicPreferences('a@b.fr')).resolves.toBeNull()
    await expect(audiences.deleteResendContactByEmail('a@b.fr')).resolves.toEqual({ deleted: false })
    await expect(audiences.upsertResendContactInAudience({ email: 'a@b.fr', audienceId: 'aud' })).resolves.toBeNull()
    await expect(
      audiences.subscribeResendContactToAudiences({ email: 'a@b.fr', audienceIds: ['aud'] }),
    ).resolves.toBeUndefined()
    await expect(
      audiences.unsubscribeResendContactFromAudiences({ email: 'a@b.fr', audienceIds: ['aud'] }),
    ).resolves.toBeUndefined()
    await expect(audiences.markResendContactAsRegistered({ email: 'a@b.fr' })).resolves.toBeUndefined()
    await expect(
      audiences.syncResendContactTopics({ email: 'a@b.fr', preferences: { news_blog: true } }),
    ).resolves.toBeUndefined()
  })

  it('still reaches Resend by default, so the flag is the only thing that silences it', async () => {
    delete process.env.RESEND_API_KEY

    const audiences = await import('./resendAudiences')

    await expect(audiences.listResendAudienceContacts('aud')).rejects.toThrow('RESEND_API_KEY is not configured')
  })
})
