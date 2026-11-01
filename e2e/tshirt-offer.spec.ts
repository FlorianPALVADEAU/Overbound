import { expect, test, type Page } from '@playwright/test'
import { EVENT_SLUG, fillFirstParticipant, signWaiver, stubCheckoutApis } from './support/checkout'
import { disableAutomaticPopups } from './support/popups'

// Free T-shirt for the first N registrations: announcement bar, checkout size field.
// Every API is stubbed, so a run never depends on the database.

const REGISTER_URL = `/events/${EVENT_SLUG}/register`

const payButton = (page: Page) => page.getByRole('button', { name: 'Payer en sécurité' }).filter({ visible: true }).first()

const featuredEvent = (tshirtOffer: { quota: number; claimed: number; remaining: number } | null) => ({
  event: {
    id: '00000000-0000-4000-8000-00000000e2e0',
    slug: EVENT_SLUG,
    title: 'E2E Arena',
    date: '2030-09-12T06:00:00.000Z',
    location: 'Saint-Quentin-en-Yvelines',
    status: 'on_sale',
    capacity: 1000,
    tickets: [],
    price_tiers: [],
  },
  availableSpots: 120,
  tshirtOffer,
})

const stubFeatured = async (page: Page, tshirtOffer: { quota: number; claimed: number; remaining: number } | null) => {
  await disableAutomaticPopups(page)
  await page.addInitScript(() => {
    window.localStorage.setItem('overbound-consent', JSON.stringify({ analytics: false, marketing: false, updatedAt: new Date().toISOString() }))
  })
  await page.route('**/api/events/featured', (route) => route.fulfill({ json: featuredEvent(tshirtOffer) }))
}

test.describe('T-shirt offer bar', () => {
  test('announces the live stock, links to the checkout and can be closed for the session', async ({ page }) => {
    await stubFeatured(page, { quota: 60, claimed: 45, remaining: 15 })
    await page.goto('/blog')

    const bar = page.getByRole('region', { name: 'Offre T-shirt' })
    await expect(bar).toContainText('T-shirt offert : plus que 15')
    await expect(bar.getByRole('link', { name: 'Je m’inscris' })).toHaveAttribute('href', `/events/${EVENT_SLUG}/register`)

    await bar.getByRole('button', { name: 'Fermer l’annonce' }).click()
    await expect(bar).toBeHidden()
    await page.reload()
    await expect(bar).toBeHidden()
  })

  test('disappears once the stock is gone', async ({ page }) => {
    await stubFeatured(page, { quota: 60, claimed: 60, remaining: 0 })
    await Promise.all([page.waitForResponse(/\/api\/events\/featured/), page.goto('/blog')])
    await expect(page.getByRole('region', { name: 'Offre T-shirt' })).toHaveCount(0)
  })

  test('is absent when the event has no offer', async ({ page }) => {
    await stubFeatured(page, null)
    await Promise.all([page.waitForResponse(/\/api\/events\/featured/), page.goto('/blog')])
    await expect(page.getByRole('region', { name: 'Offre T-shirt' })).toHaveCount(0)
  })
})

test.describe('T-shirt size at checkout', () => {
  test.describe.configure({ timeout: 90_000 })

  test('asks for a size while stock lasts, then sends it to the registration API', async ({ page }) => {
    const capture = await stubCheckoutApis(page, { signedIn: true, tshirtOffer: { quota: 60, claimed: 59, remaining: 1 } })
    await page.goto(REGISTER_URL)

    await expect(page.getByText('T-shirt offert : plus que 1').first()).toBeVisible()
    await fillFirstParticipant(page)
    await signWaiver(page)

    // No size yet: payment is refused and the size field takes the focus.
    await payButton(page).click()
    await expect(page.locator('#participant-1-tshirt-size')).toBeFocused()
    await expect(page.getByText('Choisis la taille de ton T-shirt.')).toBeVisible()
    expect(capture.paymentIntentBody()).toBeNull()

    await page.locator('#participant-1-tshirt-size').click()
    await page.getByRole('option', { name: 'M', exact: true }).click()
    await payButton(page).click()

    await expect.poll(capture.registrationBody).not.toBeNull()
    expect(capture.registrationBody()).toMatchObject({ participants: [{ firstName: 'Camille', tshirtSize: 'M' }] })
  })

  test('asks nothing once the T-shirts are gone', async ({ page }) => {
    const capture = await stubCheckoutApis(page, { signedIn: true, tshirtOffer: { quota: 60, claimed: 60, remaining: 0 } })
    await page.goto(REGISTER_URL)

    await fillFirstParticipant(page)
    await expect(page.locator('#participant-1-tshirt-size')).toHaveCount(0)
    await signWaiver(page)
    await payButton(page).click()

    await expect.poll(capture.registrationBody).not.toBeNull()
    expect(capture.registrationBody()?.participants).toEqual([expect.not.objectContaining({ tshirtSize: expect.anything() })])
  })

  test('hides the bar on the checkout itself (the page has its own card)', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: true, tshirtOffer: { quota: 60, claimed: 10, remaining: 50 } })
    await page.route('**/api/events/featured', (route) => route.fulfill({ json: featuredEvent({ quota: 60, claimed: 10, remaining: 50 }) }))
    await Promise.all([page.waitForResponse(/\/api\/events\/featured/), page.goto(REGISTER_URL)])
    await expect(page.getByRole('region', { name: 'Offre T-shirt' })).toHaveCount(0)
  })
})
