import { expect, test } from '@playwright/test'
import {
  OPEN_TICKET_ID,
  RANKED_TICKET_ID,
  TEST_CARDS,
  addTicket,
  applyPromo,
  clickPay,
  expectSuccess,
  fillParticipant,
  openCheckout,
  payWithCard,
  prepareBrowser,
  recipeEnabled,
  setFlexible,
  signIn,
  signWaiver,
  summaryTotalCents,
} from './support/stripeRecipe'

// Recette of the checkout with real orders (Stripe test mode, dev database).
// Run with: E2E_STRIPE_RECIPE=1 E2E_USER_EMAIL=… E2E_USER_PASSWORD=… PLAYWRIGHT_BASE_URL=… \
//   npx playwright test e2e/stripe-recipe.spec.ts --project=functional-desktop-1280x800
// The database is checked afterwards; see docs/fdr/FDR-0018 §4.

test.describe('Stripe recipe', () => {
  test.skip(!recipeEnabled(), 'opt-in: creates real orders (E2E_STRIPE_RECIPE=1)')
  test.describe.configure({ mode: 'serial', timeout: 180_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBrowser(page)
    await signIn(page)
  })

  test('1. one OPEN ticket, paid by card: 50 €', async ({ page }) => {
    await openCheckout(page, OPEN_TICKET_ID)
    await fillParticipant(page, 1, { wave: true })
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(5000)
    await clickPay(page)
    await payWithCard(page, TEST_CARDS.success)
    await expectSuccess(page)
  })

  test('2. two OPEN tickets, free OPEN ticket code + ambassador -50 %: 25 €', async ({ page }) => {
    await openCheckout(page, OPEN_TICKET_ID)
    await addTicket(page, 'OPEN')
    await fillParticipant(page, 1, { wave: true })
    await fillParticipant(page, 2, { wave: true })
    await applyPromo(page, 'E2EFREEOPENTICKET')
    await applyPromo(page, 'E2EAMBHALF')
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(2500)
    await clickPay(page)
    await payWithCard(page, TEST_CARDS.success)
    await expectSuccess(page)
  })

  test('3. a declined card, then a good one: one registration only', async ({ page }) => {
    await openCheckout(page, RANKED_TICKET_ID)
    await fillParticipant(page, 1, { wave: false })
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(7000)
    await clickPay(page)
    await payWithCard(page, TEST_CARDS.declined)
    await expect(page.getByText(/refusée|declined/i).first()).toBeVisible({ timeout: 30_000 })
    const frame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    await frame.locator('[name="number"]').fill(TEST_CARDS.success)
    await page.getByRole('button', { name: /^Payer / }).click()
    await expectSuccess(page)
  })

  test('4. 100 % order with a flexible bib is charged the option only (8,90 €)', async ({ page }) => {
    await openCheckout(page, OPEN_TICKET_ID)
    await fillParticipant(page, 1, { wave: true })
    await setFlexible(page, 1)
    await applyPromo(page, 'E2EFREE')
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(890)
    await clickPay(page)
    await payWithCard(page, TEST_CARDS.success)
    await expectSuccess(page)
  })

  test('5. a free order registers without Stripe', async ({ page }) => {
    await openCheckout(page, OPEN_TICKET_ID)
    await fillParticipant(page, 1, { wave: true })
    await applyPromo(page, 'E2EFREE')
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(0)
    await clickPay(page)
    await expectSuccess(page)
  })

  test('6. the active tier fills up mid-order: 2 bibs at -20 %, the third at full price', async ({ page }) => {
    // Needs the fixture tiers (Early -20 % capped at 2, then Late at full price).
    await openCheckout(page, RANKED_TICKET_ID)
    await addTicket(page, 'RANKED')
    await addTicket(page, 'RANKED')
    for (const n of [1, 2, 3]) await fillParticipant(page, n, { wave: false })
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(5600 + 5600 + 7000)
    await clickPay(page)
    await payWithCard(page, TEST_CARDS.success)
    await expectSuccess(page)
  })

  test('7. a free order from an anchored group is put on the group departure', async ({ page }) => {
    // Needs the fixture group: signed-in user is a member, anchored on wave 2.
    await openCheckout(page, OPEN_TICKET_ID)
    await expect(page.getByText('Départ fixé par ton groupe')).toBeVisible()
    await fillParticipant(page, 1, { wave: false })
    await applyPromo(page, 'E2EFREE')
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(0)
    await clickPay(page)
    await expectSuccess(page)
  })
})
