import { expect, type Page } from '@playwright/test'
import { disableAutomaticPopups } from './popups'

// Real flow against a dev project and Stripe TEST mode: nothing is stubbed.
// Opt-in only (E2E_STRIPE_RECIPE=1): it creates real orders in the target database.

export const RECIPE_EVENT_SLUG = 'e2e-checkout'
export const RECIPE_EVENT_ID = 'e2e00000-0000-4000-8000-000000000001'
export const OPEN_TICKET_ID = 'e2e00000-0000-4000-8000-0000000000a1'
export const RANKED_TICKET_ID = 'e2e00000-0000-4000-8000-0000000000a2'

export const recipeEnabled = () => process.env.E2E_STRIPE_RECIPE === '1'

/** Captain of the anchored group: used by the anchored-group scenario only. */
export const recipeUser = () => {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD
  if (!email || !password) throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD are required')
  return { email, password }
}

/** Account without group or anchor: every other scenario, so the SAS picker is open. */
export const soloUser = () => {
  const email = process.env.E2E_SOLO_EMAIL
  const password = process.env.E2E_SOLO_PASSWORD
  if (!email || !password) throw new Error('E2E_SOLO_EMAIL and E2E_SOLO_PASSWORD are required')
  return { email, password }
}

export const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
} as const

export const prepareBrowser = async (page: Page) => {
  await disableAutomaticPopups(page)
  await page.addInitScript(() => {
    window.localStorage.setItem('overbound-consent', JSON.stringify({ analytics: false, marketing: false, updatedAt: new Date().toISOString() }))
  })
}

export const signIn = async (page: Page, credentials: { email: string; password: string } = recipeUser()) => {
  const { email, password } = credentials
  await page.goto('/auth/login')
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('input[type="password"]').first().press('Enter')
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 30_000 })
}

export const openCheckout = async (page: Page, ticketId: string) => {
  // The group anchor decides whether the SAS picker exists: wait for it before the form is filled.
  const myGroup = page.waitForResponse((response) => response.url().includes('/api/groups/my'), { timeout: 30_000 })
  await page.goto(`/events/${RECIPE_EVENT_SLUG}/register?ticket=${ticketId}`)
  await myGroup
  await page.locator('#participant-1-firstName').waitFor({ timeout: 30_000 })
}

/** Sets the bib count of a ticket through its quantity select ("Quantité pour OPEN - E2E"). */
export const setTicketQuantity = async (page: Page, ticketName: 'OPEN' | 'RANKED', quantity: number) => {
  await page.getByRole('combobox', { name: `Quantité pour ${ticketName} - E2E` }).click()
  await page.getByRole('option', { name: new RegExp(`^${quantity} billet`) }).click()
}

export const fillParticipant = async (page: Page, n: number, { wave }: { wave: boolean }) => {
  const id = (field: string) => page.locator(`#participant-${n}-${field}`)
  // With several participants, a folded panel renders no field: open its header first.
  // Direct child only: the wave picker inside the panel is also a button with aria-expanded="false".
  const folded = page.locator(`#participant-panel-participant-${n} > button[aria-expanded="false"]`)
  if (await folded.count()) await folded.click()
  // The birth date unlocks the rest of the participant form: it comes first.
  await id('birthDate').fill('1990-05-04')
  await id('firstName').fill(`Prénom${n}`)
  await id('lastName').fill(`Nom${n}`)
  await id('email').fill(`participant${n}@example.com`)
  await page.locator('label', { has: page.locator(`input[name="participant-${n}-sex"][value="femme"]`) }).click()
  await id('emergency').fill('Contact Urgence')
  await id('emergencyPhone').fill('0612345678')
  // A group anchor replaces the picker with its departure time: nothing to choose then.
  if (wave && (await id('wave').count()) > 0) {
    await id('wave').click()
    await page.getByRole('listbox').getByRole('option').first().click()
  }
}

export const setFlexible = async (page: Page, n: number) => {
  await page.locator(`#participant-${n}-flexible`).click()
}

/** Ticks the OPEN option of a RANKED participant and picks the SAS at `optionIndex` (0-based) of the picker. */
export const setCompanion = async (page: Page, n: number, optionIndex: number) => {
  await page.locator(`#participant-${n}-companion`).click()
  await page.locator(`#participant-${n}-companion-wave`).click()
  await page.getByRole('option').nth(optionIndex).click()
}

export const applyPromo = async (page: Page, code: string) => {
  const input = page.getByLabel('Code promo')
  if (!(await input.isVisible())) await page.getByText("J'ai un code promo").first().click()
  await input.fill(code)
  await page.getByRole('button', { name: 'Appliquer' }).click()
}

export const signWaiver = async (page: Page) => {
  for (const id of ['rulebook-accepted', 'disclaimer-accepted']) await page.locator(`#${id}`).click()
  if (await page.locator('#group-attestation').count()) await page.locator('#group-attestation').click()
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

/** Total shown in the checkout summary, in cents. */
export const summaryTotalCents = async (page: Page): Promise<number> => {
  // The "Total" row's amount: the last price in the aside is a line of the collapsed detail, not the total.
  const text = await page.locator('aside').getByText('Total', { exact: true }).locator('xpath=following-sibling::*[1]').innerText()
  return Math.round(Number(text.replace(/[^\d,]/g, '').replace(',', '.')) * 100)
}

export const clickPay = async (page: Page) => {
  await page.getByRole('button', { name: 'Payer en sécurité' }).filter({ visible: true }).first().click()
}

/** Types a card into the Stripe Payment Element and pays. */
export const payWithCard = async (page: Page, card: string) => {
  await page.waitForURL(`**/events/${RECIPE_EVENT_SLUG}/register/payment`, { timeout: 30_000 })
  const frame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
  await frame.locator('[name="number"]').fill(card, { timeout: 30_000 })
  await frame.locator('[name="expiry"]').fill('1234')
  await frame.locator('[name="cvc"]').fill('123')
  const postal = frame.locator('[name="postalCode"]')
  if (await postal.count()) await postal.fill('75001')
  await page.getByRole('button', { name: /^Payer / }).click()
}

export const expectSuccess = async (page: Page) => {
  await page.waitForURL(`**/events/${RECIPE_EVENT_SLUG}/success?registration_id=*`, { timeout: 60_000 })
  expect(page.url()).toContain('registration_id=')
}
