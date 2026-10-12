import { expect, test } from '@playwright/test'
import { EVENT_SLUG, fillFirstParticipant, signWaiver, stubCheckoutApis } from './support/checkout'

const REGISTER_URL = `/events/${EVENT_SLUG}/register`

/** The visible "Payer" action: the summary button on desktop, the bottom bar on phones. */
const payButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Payer en sécurité' }).filter({ visible: true }).first()

test.describe('Checkout', () => {
  test.describe.configure({ timeout: 90_000 })

  test('a click on Payer with missing fields shows them and focuses the first one', async ({ page }) => {
    await stubCheckoutApis(page, { signedIn: false })
    await page.goto(REGISTER_URL)

    const pay = payButton(page)
    await expect(pay).toBeEnabled()
    await pay.click()

    await expect(page.locator('#participant-1-firstName')).toBeFocused()
    await expect(page.getByText('Ce champ est obligatoire.').first()).toBeVisible()
  })

  test('a free order sends the chosen SAS and the group to the registration API', async ({ page }) => {
    const capture = await stubCheckoutApis(page, { signedIn: true })
    await page.goto(REGISTER_URL)

    await fillFirstParticipant(page)
    await signWaiver(page)
    await payButton(page).click()

    await expect.poll(capture.registrationBody).not.toBeNull()
    expect(capture.paymentIntentBody()).toMatchObject({
      groupId: 'group-1',
      participants: [{ birthDate: '1990-05-04', selectedWaveIndex: 1 }],
    })
    expect(capture.registrationBody()).toMatchObject({
      paymentIntentId: 'free_e2e',
      groupId: 'group-1',
      participants: [{ firstName: 'Camille', selectedWaveIndex: 1 }],
    })
    await page.waitForURL(`**/events/${EVENT_SLUG}/success?registration_id=reg-e2e`)
  })

  test('a participant under 18 is refused before any payment', async ({ page }) => {
    const capture = await stubCheckoutApis(page, { signedIn: true })
    await page.goto(REGISTER_URL)

    await fillFirstParticipant(page)
    await page.locator('#participant-1-birthDate').fill('2020-01-01')
    await signWaiver(page)
    await payButton(page).click()

    await expect(page.locator('#participant-1-birthDate')).toBeFocused()
    await expect(page.getByText("Il faut avoir 18 ans le jour de l'événement.")).toBeVisible()
    expect(capture.paymentIntentBody()).toBeNull()
  })
})
