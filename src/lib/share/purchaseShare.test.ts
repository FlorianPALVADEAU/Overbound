import { describe, expect, it } from 'vitest'
import { buildShareText, buildShareUrl, buildSocialShareLinks, getFirstName } from './purchaseShare'

describe('getFirstName', () => {
  it('returns the first word', () => {
    expect(getFirstName('  Jeanne  Dupont ')).toBe('Jeanne')
  })
  it('returns null when empty or missing', () => {
    expect(getFirstName('   ')).toBeNull()
    expect(getFirstName(null)).toBeNull()
  })
})

describe('buildShareUrl', () => {
  it('targets the public event page with share UTM and no trailing slash issue', () => {
    expect(buildShareUrl('https://overbound-race.com/', 'ultra arena')).toBe(
      'https://overbound-race.com/events/ultra%20arena?utm_source=share&utm_medium=social&utm_campaign=purchase_share',
    )
  })
})

describe('buildSocialShareLinks', () => {
  const url = 'https://x.test/events/a?utm_source=share&b=1'
  const links = buildSocialShareLinks(url, buildShareText('Ultra Arena'))
  it('encodes the url in every network link', () => {
    for (const link of [links.x, links.reddit, links.facebook]) {
      expect(link).toContain(encodeURIComponent(url))
    }
  })
  it('puts text and url together for whatsapp', () => {
    expect(decodeURIComponent(links.whatsapp.split('text=')[1])).toContain(url)
  })
})
