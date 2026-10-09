import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { forceLuckyWheelCampaign } from './support/popups'

// The Lucky Wheel popup only appears on the routes allowlisted in
// src/lib/luckyWheel/placement.ts. The campaign API is stubbed to always
// return an active, immediately-triggered campaign, so a missing popup can
// only mean the route blocked it -- never "no campaign in this database".
// Events themselves are real: the specs skip when the environment has none.

const EVENT_SLUG = 'ultra-arena-2026'
const FEATURED_EVENT_ROUTES = ['/', '/events/formats', '/obstacles']
const EXCLUDED_ROUTES = [
  '/volunteers',
  '/bootcamps',
  '/about/our-story',
  '/about/faq',
  '/about/partners',
  '/blog',
  '/contact',
  '/events',
  `/events/${EVENT_SLUG}/register`,
  '/auth/login',
]

const wheelDialog = (page: Page) => page.getByRole('dialog', { name: 'Roue de la fortune' })

// React StrictMode (next dev) runs the widget's fetch effect twice, so the
// same lookup can appear more than once; what matters is which events were
// targeted.
const distinct = (ids: string[]) => [...new Set(ids)]

const fetchFeaturedEventId = async (request: APIRequestContext) => {
  const response = await request.get('/api/events/featured')
  if (!response.ok()) return null
  const body = (await response.json()) as { event: { id: string } | null }
  return body.event?.id ?? null
}

const fetchEventId = async (request: APIRequestContext, slug: string) => {
  const response = await request.get(`/api/events/${slug}`)
  if (!response.ok()) return null
  const body = (await response.json()) as { event?: { id: string } }
  return body.event?.id ?? null
}

test.describe('Lucky Wheel placement', () => {
  // First hit on each route compiles it in `next dev`.
  test.describe.configure({ timeout: 90_000 })

  for (const route of FEATURED_EVENT_ROUTES) {
    test(`opens on ${route}, targeting the featured event`, async ({ page, request }) => {
      const featuredEventId = await fetchFeaturedEventId(request)
      test.skip(!featuredEventId, 'no featured event in this environment')

      const requestedEventIds = await forceLuckyWheelCampaign(page)
      await page.goto(route)

      await expect(wheelDialog(page)).toBeVisible({ timeout: 20_000 })
      expect(distinct(requestedEventIds)).toEqual([featuredEventId])
    })
  }

  test('opens on an event page, targeting that event, and closes', async ({ page, request }) => {
    const eventId = await fetchEventId(request, EVENT_SLUG)
    test.skip(!eventId, `no "${EVENT_SLUG}" event in this environment`)

    const requestedEventIds = await forceLuckyWheelCampaign(page)
    await page.goto(`/events/${EVENT_SLUG}`)

    const dialog = wheelDialog(page)
    await expect(dialog).toBeVisible({ timeout: 20_000 })
    expect(distinct(requestedEventIds)).toEqual([eventId])

    await dialog.getByRole('button', { name: 'Fermer' }).click()
    await expect(dialog).toBeHidden()
  })

  for (const route of EXCLUDED_ROUTES) {
    test(`never opens on ${route}`, async ({ page, request }) => {
      // Without a featured event the widget never mounts anywhere, so this
      // test would pass for the wrong reason.
      test.skip(!(await fetchFeaturedEventId(request)), 'no featured event in this environment')

      const requestedEventIds = await forceLuckyWheelCampaign(page)
      // The header reads the featured event on every page; once it has
      // arrived, an unblocked widget would have everything it needs to
      // look up its campaign.
      const featuredLoaded = page.waitForResponse(/\/api\/events\/featured(\?|$)/)
      await page.goto(route)
      await featuredLoaded
      await page.waitForLoadState('networkidle')

      // Not even a campaign lookup: the route is rejected before any fetch.
      expect(requestedEventIds).toEqual([])
      await expect(wheelDialog(page)).toHaveCount(0)
    })
  }
})
