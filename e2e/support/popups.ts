import type { Page } from '@playwright/test'

// Automatic popups (Lucky Wheel, marketing popup) depend on live campaigns in
// the database and on time/scroll triggers. Specs stub their APIs so a page
// renders the same way on every run, whatever the environment's data.

const LUCKY_WHEEL_CAMPAIGN_URL = /\/api\/lucky-wheel\/campaign(\?|$)/
// Only the public list read by PopupPromotion, not /api/promotions/validate etc.
const PROMOTIONS_LIST_URL = /\/api\/promotions(\?|$)/

/**
 * Hero background video never loads: the <video> keeps showing its poster.
 * The video starts after a variable idle delay and loops, so a screenshot
 * would otherwise land on the poster or on any frame, differing every run.
 */
export const freezeHeroVideo = async (page: Page) => {
  await page.route(/\/videos\/.*\.(webm|mp4)(\?|$)/, (route) => route.abort())
}

export const STUB_LUCKY_WHEEL_CAMPAIGN = {
  id: '00000000-0000-4000-8000-00000000c0de',
  name: 'E2E campaign',
  // Open as soon as the widget mounts.
  trigger_rules: { delay_ms: 0 },
  rewards: [
    { id: '00000000-0000-4000-8000-0000000000a1', name: 'Réduction 10 %', rarity: 'common', imageUrl: null },
    { id: '00000000-0000-4000-8000-0000000000a2', name: 'Dossard offert', rarity: 'legendary', imageUrl: null },
  ],
}

/** Neither popup ever opens: for layout and visual-snapshot specs. */
export const disableAutomaticPopups = async (page: Page) => {
  await page.route(LUCKY_WHEEL_CAMPAIGN_URL, (route) => route.fulfill({ json: { campaign: null } }))
  await page.route(PROMOTIONS_LIST_URL, (route) => route.fulfill({ json: { promotions: [] } }))
}

/**
 * The Lucky Wheel always has an active campaign that opens immediately, and
 * the marketing popup never competes for the one-popup-per-session slot.
 * Returns the event_id of every campaign lookup the page made, in order.
 */
export const forceLuckyWheelCampaign = async (page: Page) => {
  const requestedEventIds: string[] = []
  await page.route(LUCKY_WHEEL_CAMPAIGN_URL, (route) => {
    requestedEventIds.push(new URL(route.request().url()).searchParams.get('event_id') ?? '')
    return route.fulfill({ json: { campaign: STUB_LUCKY_WHEEL_CAMPAIGN } })
  })
  await page.route(PROMOTIONS_LIST_URL, (route) => route.fulfill({ json: { promotions: [] } }))
  return requestedEventIds
}
