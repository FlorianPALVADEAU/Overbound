import { expect, test } from '@playwright/test'
import {
  OPEN_TICKET_ID,
  RANKED_TICKET_ID,
  TEST_CARDS,
  setTicketQuantity,
  applyPromo,
  clickPay,
  expectSuccess,
  fillParticipant,
  openCheckout,
  payWithCard,
  prepareBrowser,
  recipeEnabled,
  recipeUser,
  setCompanion,
  setFlexible,
  signIn,
  signWaiver,
  soloUser,
  summaryTotalCents,
} from './support/stripeRecipe'

// Recette of the checkout with real orders (Stripe test mode, dev database).
// Run with: E2E_STRIPE_RECIPE=1 E2E_USER_EMAIL=… E2E_USER_PASSWORD=… E2E_SOLO_EMAIL=… E2E_SOLO_PASSWORD=… PLAYWRIGHT_BASE_URL=… \
//   npx playwright test e2e/stripe-recipe.spec.ts --project=functional-desktop-1280x800
// The database is checked afterwards; see docs/fdr/FDR-0018 §4.

test.describe('Stripe recipe', () => {
  test.skip(!recipeEnabled(), 'opt-in: creates real orders (E2E_STRIPE_RECIPE=1)')
  test.describe.configure({ mode: 'serial', timeout: 180_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBrowser(page)
    await signIn(page, soloUser())
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
    await setTicketQuantity(page, 'OPEN', 2)
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

  test('8. a RANKED bib with the OPEN option: +29 €, an unreachable SAS is greyed, two bibs are created', async ({ page }) => {
    await openCheckout(page, RANKED_TICKET_ID)
    await fillParticipant(page, 1, { wave: false })
    const base = await summaryTotalCents(page)
    await page.locator('#participant-1-companion').click()
    await page.locator('#participant-1-companion-wave').click()
    // SAS 1 (12h00) starts before the RANKED can be finished and rested from: greyed with its reason.
    await expect(page.getByRole('option').nth(0)).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByRole('option').nth(0)).toContainText('Trop tôt')
    await page.getByRole('option').nth(1).click()
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(base + 2900)
    await clickPay(page)
    await payWithCard(page, TEST_CARDS.success)
    await expectSuccess(page)
  })

  test('9. a flexible RANKED bib with the OPEN option is cancelled and refunded as one set', async ({ page }) => {
    await openCheckout(page, RANKED_TICKET_ID)
    await fillParticipant(page, 1, { wave: false })
    const base = await summaryTotalCents(page)
    await setCompanion(page, 1, 2)
    await setFlexible(page, 1)
    await signWaiver(page)
    expect(await summaryTotalCents(page)).toBe(base + 2900 + 890)
    await clickPay(page)
    await payWithCard(page, TEST_CARDS.success)
    await expectSuccess(page)

    // The cancellation goes through the real route, with the buyer's session.
    const registrationId = new URL(page.url()).searchParams.get('registration_id')
    const response = await page.request.post(`/api/account/tickets/${registrationId}/refund`, { data: { confirm: true } })
    expect(response.status()).toBe(200)
    expect((await response.json()).refundedCents).toBe(base + 2900)
  })
})

// Separate describe: this account is captain of a group anchored on wave 2, so its SAS is fixed.
test.describe('Stripe recipe, anchored group', () => {
  test.skip(!recipeEnabled(), 'opt-in: creates real orders (E2E_STRIPE_RECIPE=1)')
  test.describe.configure({ mode: 'serial', timeout: 180_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBrowser(page)
    await signIn(page, recipeUser())
  })

  test('7. a free order from an anchored group is put on the group departure', async ({ page }) => {
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
