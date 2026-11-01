import { expect, test, type Page } from '@playwright/test'
import { EVENT_SLUG, stubCheckoutApis } from './support/checkout'

// A friend who follows an ambassador link (/?ref=CODE) gets the code applied at registration.
const REGISTER_URL = `/events/${EVENT_SLUG}/register`
const STORAGE_KEY = 'overbound-referral'

const promo = (overrides: Record<string, unknown> = {}) => ({
  id: 'promo-1',
  code: 'ADA20',
  description: '-10 % avec le code de ton ami',
  discount_percent: 10,
  discount_amount: null,
  currency: 'eur',
  is_ambassador: true,
  target_upsell_id: null,
  ...overrides,
})

/** Answers the promo validation API and records the codes it was asked about. */
const stubPromoValidation = async (page: Page, answer: { status: number; json: unknown }) => {
  const asked: string[] = []
  await page.route('**/api/promotions/validate', (route) => {
    asked.push((route.request().postDataJSON() as { code: string }).code)
    return route.fulfill(answer)
  })
  return asked
}

const storedReferral = (page: Page) =>
  page.evaluate((key) => {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as { code: string }).code : null
  }, STORAGE_KEY)

test.describe('Ambassador referral link', () => {
  test('keeps the code of the link, in upper case', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: false })
    await page.goto('/?ref=ada20')

    await expect.poll(() => storedReferral(page)).toBe('ADA20')
  })

  test('ignores a malformed code', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: false })
    await page.goto('/?ref=%3Cscript%3E')
    await page.waitForLoadState('networkidle')

    expect(await storedReferral(page)).toBeNull()
  })

  test('applies the code at registration and forgets it', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: false })
    const asked = await stubPromoValidation(page, { status: 200, json: { promotionalCode: promo() } })

    await page.goto('/?ref=ADA20')
    await expect.poll(() => storedReferral(page)).toBe('ADA20')
    await page.goto(REGISTER_URL)

    await expect(page.getByText('Code ADA20', { exact: true }).filter({ visible: true }).first()).toBeVisible()
    expect(asked).toEqual(['ADA20'])
    expect(await storedReferral(page)).toBeNull()
  })

  // The link of an ambassador can point anywhere, including the register page of an event.
  test('applies the code when the link lands straight on the register page', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: false })
    const asked = await stubPromoValidation(page, { status: 200, json: { promotionalCode: promo() } })

    await page.goto(`${REGISTER_URL}?ref=ada20`)

    await expect(page.getByText('Code ADA20', { exact: true }).filter({ visible: true }).first()).toBeVisible()
    expect(asked).toEqual(['ADA20'])
  })

  test('drops a code that is not an ambassador code and leaves the field usable', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: false })
    await stubPromoValidation(page, { status: 200, json: { promotionalCode: promo({ code: 'WELCOME', is_ambassador: false }) } })

    await page.goto('/?ref=WELCOME')
    await expect.poll(() => storedReferral(page)).toBe('WELCOME')
    await page.goto(REGISTER_URL)

    await expect.poll(() => storedReferral(page)).toBeNull()
    await expect(page.getByText('Code WELCOME')).toHaveCount(0)
    await page.getByText("J'ai un code promo").click()
    await expect(page.getByLabel('Code promo')).toBeEditable()
  })

  test('drops an unknown code without showing an error', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: false })
    await stubPromoValidation(page, { status: 404, json: { error: 'Code promo invalide' } })

    await page.goto('/?ref=NOPE')
    await expect.poll(() => storedReferral(page)).toBe('NOPE')
    await page.goto(REGISTER_URL)

    await expect.poll(() => storedReferral(page)).toBeNull()
    await expect(page.getByText('Code promo invalide')).toHaveCount(0)
  })
})
