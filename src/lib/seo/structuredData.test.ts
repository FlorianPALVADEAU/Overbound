import { describe, expect, it } from 'vitest'
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildSportsEventJsonLd,
  buildTeaserVideoJsonLd,
  buildWebSiteJsonLd,
} from './structuredData'

const EVENT = {
  title: 'Ultra Arena 2026',
  date: '2026-09-12T08:00:00+00:00',
  location: 'Île de Loisirs de Saint-Quentin-en-Yvelines',
  slug: 'ultra-arena-2026',
  status: 'completed',
}

describe('organization and website', () => {
  it('links the website to the organization by @id', () => {
    const org = buildOrganizationJsonLd()
    expect(buildWebSiteJsonLd().publisher['@id']).toBe(org['@id'])
  })

  it('makes no uniqueness claim and carries no stale year', () => {
    const text = JSON.stringify(buildOrganizationJsonLd()).toLowerCase()
    expect(text).not.toContain('première course')
    expect(text).not.toContain('2026')
  })
})

describe('buildBreadcrumbJsonLd', () => {
  it('prepends the home item and numbers positions', () => {
    const list = buildBreadcrumbJsonLd([{ name: 'Formats', path: '/events/formats' }])
    expect(list.itemListElement.map((i) => i.position)).toEqual([1, 2])
    expect(list.itemListElement[1].item).toMatch(/\/events\/formats$/)
  })
})

describe('buildSportsEventJsonLd', () => {
  it('keeps a finished edition EventScheduled and adds geo when coordinates exist', () => {
    const ld = buildSportsEventJsonLd({ ...EVENT, latitude: 48.78, longitude: 2.03 })
    expect(ld.eventStatus).toBe('https://schema.org/EventScheduled')
    expect(ld.location.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 48.78, longitude: 2.03 })
    expect(ld.location.address.addressRegion).toBe('Île-de-France')
  })

  it('omits geo without coordinates and marks a cancelled event', () => {
    const ld = buildSportsEventJsonLd({ ...EVENT, status: 'cancelled' })
    expect(ld.location.geo).toBeUndefined()
    expect(ld.eventStatus).toBe('https://schema.org/EventCancelled')
  })

  it('builds offers only for tickets with a price', () => {
    const ld = buildSportsEventJsonLd({
      ...EVENT,
      status: 'on_sale',
      tickets: [{ name: 'OPEN', final_price_cents: 4500, currency: 'eur' }, { name: 'Sans prix' }],
    })
    expect(ld.offers).toHaveLength(1)
    expect(ld.offers?.[0]).toMatchObject({ priceCurrency: 'EUR', availability: 'https://schema.org/InStock' })
  })
})

describe('legal identity, end date, listings and video', () => {
  it('names the legal entity and the founder from COMPANY_INFO', () => {
    const org = buildOrganizationJsonLd()
    expect(org.legalName).toBe('Palvadeau Organisation')
    expect(org.founder.name).toBe('Florian Palvadeau')
  })

  it('exposes endDate only when the event has one', () => {
    expect(buildSportsEventJsonLd({ ...EVENT, end_date: '2026-09-12T17:00:00+00:00' }).endDate).toBe('2026-09-12T17:00:00+00:00')
    expect(buildSportsEventJsonLd(EVENT).endDate).toBeUndefined()
  })

  it('links third-party listings only on the 2026 edition', () => {
    expect(buildSportsEventJsonLd(EVENT).sameAs?.length).toBeGreaterThan(0)
    expect(buildSportsEventJsonLd({ ...EVENT, slug: 'edition-2027' }).sameAs).toBeUndefined()
  })

  it('builds a VideoObject with absolute URLs and an ISO 8601 duration', () => {
    const video = buildTeaserVideoJsonLd()
    expect(video.contentUrl).toMatch(/^https?:\/\/.+\/videos\/teaser\.mp4$/)
    expect(video.duration).toMatch(/^PT(\d+H)?(\d+M)?(\d+S)?$/)
  })
})
