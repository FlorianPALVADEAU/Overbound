import { test } from '@playwright/test'
import { EVENT_SLUG, stubCheckoutApis } from './support/checkout'
import { assertNoElementOverflowsParent, assertNoHorizontalScroll, assertTapTargetsAreLargeEnough } from './support/layout'

// The generic responsive spec loads /register against the live database and
// often sees an empty page. This one renders the real checkout from stubbed
// APIs, in its two states: untouched, and with every error showing.

const assertLayout = async (page: import('@playwright/test').Page) => {
  await assertNoHorizontalScroll(page)
  await assertNoElementOverflowsParent(page)
  await assertTapTargetsAreLargeEnough(page)
}

test.describe('Checkout layout', () => {
  test.describe.configure({ timeout: 90_000 })

  test('the untouched checkout respects the responsive contract', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: true })
    await page.goto(`/events/${EVENT_SLUG}/register`)
    await page.locator('#participant-1-firstName').waitFor()
    await assertLayout(page)
  })

  test('the checkout with every error showing respects the responsive contract', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: true })
    await page.goto(`/events/${EVENT_SLUG}/register`)
    await page.locator('#participant-1-firstName').waitFor()
    await page.getByRole('button', { name: 'Payer en sécurité' }).filter({ visible: true }).first().click()
    await page.getByText('Ce champ est obligatoire.').first().waitFor()
    await assertLayout(page)
  })
})
