import type { Page, Request } from '@playwright/test'
import { disableAutomaticPopups } from './popups'

// The checkout reads everything from its own APIs. Specs answer them with a
// fixed event so a run never depends on the database, and record what the
// page sends to the payment and registration APIs.

export const EVENT_SLUG = 'e2e-arena'
const EVENT_ID = '00000000-0000-4000-8000-00000000e2e0'

const OPEN_TICKET = {
  id: '00000000-0000-4000-8000-0000000000t1',
  event_id: EVENT_ID,
  name: 'Primal OPEN',
  description: 'Ton rythme, ton créneau.',
  final_price_cents: 5000,
  currency: 'eur',
  max_participants: 0,
  current_registrations: 0,
  operations_config: null,
  race: { id: 'race-1', name: 'Primal' },
}

const BUYER = { id: '00000000-0000-4000-8000-00000000b0b0', email: 'camille@example.com', fullName: 'Camille Martin' }

const registerData = (signedIn: boolean) => ({
  event: {
    id: EVENT_ID,
    slug: EVENT_SLUG,
    title: 'E2E Arena',
    date: '2030-09-12T06:00:00.000Z',
    location: 'Saint-Quentin-en-Yvelines',
    status: 'on_sale',
    capacity: 1000,
    price_tiers: [],
  },
  tickets: [OPEN_TICKET],
  upsells: [],
  availableSpots: 120,
  tierRegistrationCounts: {},
  user: signedIn ? BUYER : null,
})

export interface CheckoutCapture {
  paymentIntentBody: () => Record<string, unknown> | null
  registrationBody: () => Record<string, unknown> | null
}

const json = (request: Request) => request.postDataJSON() as Record<string, unknown>

/** Answers every API of the register page. Signed in: a buyer whose group has no departure yet. */
export const stubCheckoutApis = async (page: Page, { signedIn }: { signedIn: boolean }): Promise<CheckoutCapture> => {
  let paymentIntentBody: Record<string, unknown> | null = null
  let registrationBody: Record<string, unknown> | null = null

  await disableAutomaticPopups(page)
  // Consent already answered (refused): the cookie banner would otherwise cover the phone payment bar.
  await page.addInitScript(() => {
    window.localStorage.setItem('overbound-consent', JSON.stringify({ analytics: false, marketing: false, updatedAt: new Date().toISOString() }))
  })
  await page.route('**/api/session', (route) =>
    route.fulfill(
      signedIn
        ? { json: { user: { id: BUYER.id, email: BUYER.email }, profile: null, alerts: null } }
        : { status: 401, json: { error: 'Non authentifié' } },
    ),
  )
  await page.route('**/api/account/registrations', (route) =>
    route.fulfill({ json: { registrations: [], profile: { date_of_birth: '1990-05-04' } } }),
  )
  await page.route('**/api/groups/my', (route) =>
    route.fulfill({ json: signedIn ? { id: 'group-1', name: 'Team', invite_code: 'AB12CD34', members: [], anchor_event_id: null } : null }),
  )
  await page.route(`**/api/events/${EVENT_SLUG}/register-data**`, (route) => route.fulfill({ json: registerData(signedIn) }))
  await page.route('**/open-waves/selectable**', (route) =>
    route.fulfill({ json: { waves: [{ wave_index: 1, start_time: '2030-09-12T10:00:00.000Z', remaining: 40 }] } }),
  )
  await page.route('**/api/stripe/create-payment-intent', (route) => {
    paymentIntentBody = json(route.request())
    return route.fulfill({
      json: {
        freeOrder: true,
        freeOrderId: 'free_e2e',
        pricing: { ticketTotal: 5000, upsellTotal: 0, discountAmount: 5000, totalDue: 0, currency: 'eur' },
        freeOrderMetadata: { currency: 'eur' },
      },
    })
  })
  await page.route('**/api/registrations/create', (route) => {
    registrationBody = json(route.request())
    return route.fulfill({ json: { registrations: ['reg-e2e'] } })
  })

  return { paymentIntentBody: () => paymentIntentBody, registrationBody: () => registrationBody }
}

/** Fills participant 1 completely, SAS included. */
export const fillFirstParticipant = async (page: Page) => {
  await page.locator('#participant-1-firstName').fill('Camille')
  await page.locator('#participant-1-lastName').fill('Martin')
  await page.locator('#participant-1-email').fill('camille@example.com')
  await page.locator('#participant-1-birthDate').fill('1990-05-04')
  await page.locator('#participant-1-emergency').fill('Léo Martin')
  await page.locator('#participant-1-emergencyPhone').fill('0612345678')
  await page.locator('#participant-1-wave').click()
  await page.getByRole('option').first().click()
}

/** Accepts the waiver and rulebook, then draws a signature. */
export const signWaiver = async (page: Page) => {
  for (const id of ['disclaimer-read', 'rulebook-accepted', 'disclaimer-accepted']) await page.locator(`#${id}`).click()
  const pad = page.locator('#signature-pad canvas')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('signature pad not visible')
  await page.mouse.move(box.x + 20, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 80, { steps: 8 })
  await page.mouse.move(box.x + 200, box.y + 50, { steps: 8 })
  await page.mouse.up()
}
