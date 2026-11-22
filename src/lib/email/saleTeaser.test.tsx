import { describe, expect, it } from 'vitest'
import SaleTeaserEmail from '@/emails/SaleTeaserEmail'
import { renderEmail } from '@/lib/email/render'
import {
  buildTeaserContent,
  formatParisDay,
  formatParisTime,
  isTeaserDue,
  teaserCampaignKey,
  type TeaserEvent,
} from './saleTeaser'

const EVENT: TeaserEvent = {
  id: 'evt-1',
  slug: 'ultra-arena-2027',
  title: 'Overbound - Backyard à obstacles 2027',
  date: '2027-04-24T06:00:00Z',
  location: 'Base de Loisirs de Saint-Quentin-En-Yvelines',
  status: 'announced',
  // 07:00 in Paris (CET)
  sales_start: '2026-12-01T06:00:00Z',
  tshirt_offer_quota: 60,
}

const SEND_TIME = new Date('2026-11-23T08:00:00Z')

describe('isTeaserDue', () => {
  it('is due a week before the opening', () => {
    expect(isTeaserDue(EVENT, SEND_TIME)).toBe(true)
  })

  it('is not due once sales have started', () => {
    expect(isTeaserDue(EVENT, new Date('2026-12-01T06:00:01Z'))).toBe(false)
  })

  it('is not due long before the opening, so a stale cron entry stays silent', () => {
    expect(isTeaserDue(EVENT, new Date('2026-10-01T08:00:00Z'))).toBe(false)
  })

  it('is not due for an event that is not announced', () => {
    expect(isTeaserDue({ ...EVENT, status: 'on_sale' }, SEND_TIME)).toBe(false)
    expect(isTeaserDue({ ...EVENT, status: 'draft' }, SEND_TIME)).toBe(false)
  })

  it('is not due without an opening date', () => {
    expect(isTeaserDue({ ...EVENT, sales_start: null }, SEND_TIME)).toBe(false)
  })
})

describe('Paris date labels', () => {
  it('writes the first of the month as 1er', () => {
    expect(formatParisDay('2026-12-01T06:00:00Z')).toBe('mardi 1er décembre')
  })

  it('keeps other days as plain numbers and adds the year on request', () => {
    expect(formatParisDay('2027-04-24T06:00:00Z', { withYear: true })).toBe('samedi 24 avril 2027')
  })

  it('reads the time in Paris, in winter and in summer', () => {
    expect(formatParisTime('2026-12-01T06:00:00Z')).toBe('7h00')
    expect(formatParisTime('2027-04-24T06:00:00Z')).toBe('8h00')
  })

  it('reads the day in Paris when UTC is still the day before', () => {
    expect(formatParisDay('2026-11-30T23:30:00Z')).toBe('mardi 1er décembre')
  })
})

describe('buildTeaserContent', () => {
  it('builds the subject and the link from the event row', () => {
    const content = buildTeaserContent(EVENT, 'https://overbound-race.com/')

    expect(content.subject).toBe('La billetterie ouvre mardi 1er décembre à 7h00')
    expect(content.tshirtQuota).toBe(60)
    expect(content.countdownUrl).toBe('https://overbound-race.com/api/email/countdown?event=ultra-arena-2027')
    expect([content.salesWeekday, content.salesDate, content.salesTime]).toEqual(['mardi', '1er décembre', '7h00'])
    expect(content.eventUrl).toBe(
      'https://overbound-race.com/events/ultra-arena-2027?utm_source=email&utm_medium=marketing&utm_campaign=sale_teaser_ultra-arena-2027',
    )
  })

  it('drops the T-shirt line when the event has no offer', () => {
    expect(buildTeaserContent({ ...EVENT, tshirt_offer_quota: null }, 'https://x.test').tshirtQuota).toBeNull()
    expect(buildTeaserContent({ ...EVENT, tshirt_offer_quota: 0 }, 'https://x.test').tshirtQuota).toBeNull()
  })

  it('refuses an event without an opening date', () => {
    expect(() => buildTeaserContent({ ...EVENT, sales_start: null }, 'https://x.test')).toThrow('sales_start')
  })

  it('keys the campaign on the event, so a rerun resumes it', () => {
    expect(teaserCampaignKey(EVENT)).toBe('sale-teaser:evt-1')
  })
})

describe('SaleTeaserEmail', () => {
  it('shows the opening, the T-shirt offer and the unsubscribe link, with no en dash', async () => {
    const html = await renderEmail(
      SaleTeaserEmail({
        firstName: 'Léa',
        content: buildTeaserContent(EVENT, 'https://overbound-race.com'),
        unsubscribeUrl: 'https://overbound-race.com/unsubscribe/token',
      }),
    )

    expect(html).toContain('1er décembre')
    expect(html).toContain('Léa, plus de 330 personnes')
    expect(html).toContain('mardi, 7h00.')
    expect(html).toContain('T-shirt offert aux 60 premiers inscrits')
    expect(html).toContain('https://overbound-race.com/unsubscribe/token')
    expect(html).not.toContain(String.fromCharCode(0x2013))
  })

  it('leaves the T-shirt block out without a quota', async () => {
    const html = await renderEmail(
      SaleTeaserEmail({
        content: buildTeaserContent({ ...EVENT, tshirt_offer_quota: null }, 'https://overbound-race.com'),
        unsubscribeUrl: 'https://overbound-race.com/unsubscribe/token',
      }),
    )

    expect(html).not.toContain('T-shirt offert')
  })
})
