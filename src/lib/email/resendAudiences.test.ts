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
