import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

export interface StubTshirtOffer {
  quota: number
  claimed: number
  remaining: number
}

export type StubSex = 'homme' | 'femme'

/** The Supabase project URL, from the environment or `.env.local`: the browser session is stored under its host. */
const supabaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  const line = envFile.split('\n').find((entry) => entry.startsWith('NEXT_PUBLIC_SUPABASE_URL='))
  if (!line) throw new Error('NEXT_PUBLIC_SUPABASE_URL introuvable : impossible de simuler une session')
  return line.slice('NEXT_PUBLIC_SUPABASE_URL='.length).trim()
}

/**
 * Stores a Supabase session for the buyer, as @supabase/ssr keeps it: a `base64-` cookie named after the
 * project. The browser then counts the visitor as signed in and reads the account (profile sex and birth
 * date prefill). The token is never checked: every API the page calls is stubbed.
 */
const seedBrowserSession = async (page: Page) => {
  const ref = new URL(supabaseUrl()).hostname.split('.')[0]
  const session = {
    access_token: 'e2e-access-token',
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: BUYER.id, email: BUYER.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { full_name: BUYER.fullName } },
  }
  await page.context().addCookies([
    { name: `sb-${ref}-auth-token`, value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`, domain: 'localhost', path: '/' },
  ])
}

const registerData = (signedIn: boolean, tshirtOffer: StubTshirtOffer | null, minimumAge: number, sex: StubSex | null) => ({
  event: {
    id: EVENT_ID,
    slug: EVENT_SLUG,
    title: 'E2E Arena',
    date: '2030-09-12T06:00:00.000Z',
    location: 'Saint-Quentin-en-Yvelines',
    status: 'on_sale',
    capacity: 1000,
    price_tiers: [],
    minimum_age: minimumAge,
  },
  tickets: [OPEN_TICKET],
  upsells: [],
  availableSpots: 120,
  tshirtOffer,
  tierRegistrationCounts: {},
  user: signedIn ? { ...BUYER, sex } : null,
})

export interface CheckoutCapture {
  paymentIntentBody: () => Record<string, unknown> | null
  registrationBody: () => Record<string, unknown> | null
}

const json = (request: Request) => request.postDataJSON() as Record<string, unknown>

/** Answers every API of the register page. Signed in: a buyer whose group has no departure yet. */
export const stubCheckoutApis = async (
  page: Page,
  {
    signedIn,
    tshirtOffer = null,
    minimumAge = 18,
    profileSex = null,
  }: { signedIn: boolean; tshirtOffer?: StubTshirtOffer | null; minimumAge?: number; profileSex?: StubSex | null },
): Promise<CheckoutCapture> => {
  let paymentIntentBody: Record<string, unknown> | null = null
  let registrationBody: Record<string, unknown> | null = null

  await disableAutomaticPopups(page)
  if (signedIn && profileSex) await seedBrowserSession(page)
  // Consent already answered (refused): the cookie banner would otherwise cover the phone payment bar.
  await page.addInitScript(() => {
    window.localStorage.setItem('overbound-consent', JSON.stringify({ analytics: false, marketing: false, updatedAt: new Date().toISOString() }))
  })
  await page.route('**/api/session', (route) =>
    route.fulfill(
      signedIn
        ? { json: { user: { id: BUYER.id, email: BUYER.email }, profile: profileSex ? { sex: profileSex } : null, alerts: null } }
        : { status: 401, json: { error: 'Non authentifié' } },
    ),
  )
  await page.route('**/api/account/registrations', (route) =>
    route.fulfill({ json: { registrations: [], profile: { date_of_birth: '1990-05-04', sex: profileSex } } }),
  )
  await page.route('**/api/groups/my', (route) =>
    route.fulfill({ json: signedIn ? { id: 'group-1', name: 'Team', invite_code: 'AB12CD34', members: [], anchor_event_id: null } : null }),
  )
  await page.route(`**/api/events/${EVENT_SLUG}/register-data**`, (route) =>
    route.fulfill({ json: registerData(signedIn, tshirtOffer, minimumAge, profileSex) }),
  )
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

/** Picks the sex of bib `position` (1-based), as the visitor does on the radio group. */
export const chooseSex = async (page: Page, position: number, sex: StubSex) => {
  // The radio is visually hidden: the visitor clicks its label, as on screen.
  await page
    .locator('label', { has: page.locator(`input[name="participant-${position}-sex"][value="${sex}"]`) })
    .click()
}

/** Fills participant 1 completely, SAS included. `sex: null` leaves the sex to the visitor. */
export const fillFirstParticipant = async (page: Page, sex: StubSex | null = 'femme') => {
  await page.locator('#participant-1-firstName').fill('Camille')
  await page.locator('#participant-1-lastName').fill('Martin')
  await page.locator('#participant-1-email').fill('camille@example.com')
  await page.locator('#participant-1-birthDate').fill('1990-05-04')
  if (sex) await chooseSex(page, 1, sex)
  await page.locator('#participant-1-emergency').fill('Léo Martin')
  await page.locator('#participant-1-emergencyPhone').fill('0612345678')
  await page.locator('#participant-1-wave').click()
  await page.getByRole('option').first().click()
}

export interface StubParticipant {
  firstName: string
  lastName: string
  email: string
  birthDate: string
  /** Asked on every bib, for the rankings. */
  sex: StubSex
  /** Minors only: the legal representative, also the adult on site by default. */
  guardian?: { name: string; phone: string; email: string }
}

/** Fills participant `position` (1-based) completely, SAS included. Others unfold on click, in order. */
export const fillParticipant = async (page: Page, position: number, participant: StubParticipant) => {
  if (position > 1) await page.getByRole('button').filter({ hasText: 'À compléter' }).first().click()
  const field = (name: string) => page.locator(`#participant-${position}-${name}`)
  await field('firstName').fill(participant.firstName)
  await field('lastName').fill(participant.lastName)
  await field('email').fill(participant.email)
  await field('birthDate').fill(participant.birthDate)
  await chooseSex(page, position, participant.sex)
  await field('emergency').fill('Anne Martin')
  await field('emergencyPhone').fill('0612345678')
  if (participant.guardian) {
    await field('guardian').fill(participant.guardian.name)
    await field('guardianPhone').fill(participant.guardian.phone)
    await field('guardianEmail').fill(participant.guardian.email)
    // The adult on site is asked explicitly; here it is the same person.
    await field('referent').fill(participant.guardian.name)
    await field('referentPhone').fill(participant.guardian.phone)
  }
  await field('wave').click()
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
