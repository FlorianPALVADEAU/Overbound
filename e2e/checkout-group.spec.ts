import { expect, test, type Page } from '@playwright/test'
import { EVENT_SLUG, fillFirstParticipant, signWaiver, stubCheckoutApis } from './support/checkout'

const REGISTER_URL = `/events/${EVENT_SLUG}/register`

const chooseQuantity = async (page: Page, label: RegExp) => {
  await page.getByRole('combobox', { name: 'Quantité pour Primal OPEN' }).click()
  await page.getByRole('option', { name: label }).click()
}

test.describe('Checkout — group order', () => {
  test.describe.configure({ timeout: 90_000 })

  test('3 tickets apply −15 % and show it in the summary', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: true })
    await page.goto(REGISTER_URL)
    await page.locator('#participant-1-firstName').waitFor()

    await chooseQuantity(page, /^3 billets/)

    await expect(page.getByText('Remise groupe −15 % appliquée').first()).toBeVisible()
    await expect(page.getByText('0 / 3 complet')).toBeVisible()
    // 3 × 50 € − 15 % = 127,50 €
    await expect(page.getByText(/127,50\s*€/).first()).toBeVisible()
  })

  test('only the first participant is open, the others unfold on click', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: true })
    await page.goto(REGISTER_URL)
    await page.locator('#participant-1-firstName').waitFor()
    await chooseQuantity(page, /^2 billets/)

    await expect(page.locator('#participant-1-firstName')).toBeVisible()
    await expect(page.locator('#participant-2-firstName')).toHaveCount(0)

    await page.getByRole('button', { name: /Participant 2|2/ }).filter({ hasText: 'À compléter' }).first().click()
    await expect(page.locator('#participant-2-firstName')).toBeVisible()
  })

  test('Payer with an empty 2nd participant unfolds it and focuses its first missing field', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: true })
    await page.goto(REGISTER_URL)
    await page.locator('#participant-1-firstName').waitFor()
    await chooseQuantity(page, /^2 billets/)
    await fillFirstParticipant(page)
    await signWaiver(page)
    await expect(page.locator('#participant-2-firstName')).toHaveCount(0)

    await page.getByRole('button', { name: 'Payer en sécurité' }).filter({ visible: true }).first().click()

    await expect(page.locator('#participant-2-firstName')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.activeElement?.id ?? '')).toMatch(/^participant-2-/)
    await expect(page.getByText('Ce champ est obligatoire.').first()).toBeVisible()
  })

  test('the quantity above 10 goes through a numeric input and shows −20 %', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: true })
    await page.goto(REGISTER_URL)
    await page.locator('#participant-1-firstName').waitFor()

    await chooseQuantity(page, /11 billets ou plus/)
    await page.getByRole('spinbutton').first().fill('12')
    await page.getByRole('spinbutton').first().blur()

    await expect(page.getByText('Remise groupe −20 % appliquée').first()).toBeVisible()
    await expect(page.getByText('0 / 12 complet')).toBeVisible()
  })
})
