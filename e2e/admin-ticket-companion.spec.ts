import { expect, test, type Page } from '@playwright/test'
import { OPEN_TICKET_ID, RANKED_TICKET_ID, RECIPE_EVENT_ID, prepareBrowser, signIn } from './support/stripeRecipe'

// Admin screen of the "Option OPEN" (ticket form, ticket list, delete guard), against the dev database.
// Needs the e2e-checkout fixture (e2e/support/stripe-recipe.fixture.sql) and an admin of its organization:
//   E2E_ADMIN_RECIPE=1 E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… \
//   npx playwright test e2e/admin-ticket-companion.spec.ts --project=functional-desktop-1280x800
// Every test leaves the option as the fixture defines it (OPEN - E2E, 29 €, 230 min, 20 min).

const adminEnabled = () => process.env.E2E_ADMIN_RECIPE === '1'

const adminUser = () => {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!email || !password) throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required')
  return { email, password }
}

/** Opens the row menu and picks an action. The page re-renders on its own and can close the menu under the cursor. */
const pickRowAction = async (page: Page, ticketId: string, action: string) => {
  const item = page.getByRole('menuitem', { name: action })
  await expect(async () => {
    if (!(await item.isVisible())) {
      await page.getByRole('button', { name: `Actions pour ${ticketId}` }).filter({ visible: true }).first().click({ timeout: 3_000 })
    }
    await item.click({ timeout: 3_000 })
  }).toPass({ timeout: 30_000 })
}

const openEditor = async (page: Page, ticketId: string) => {
  await pickRowAction(page, ticketId, 'Modifier')
  await page.getByRole('dialog', { name: 'Modifier le ticket' }).waitFor()
}

const save = async (page: Page) => {
  await page.getByRole('button', { name: 'Mettre à jour' }).click()
  await expect(page.getByRole('dialog', { name: 'Modifier le ticket' })).toBeHidden()
}

/** The option as persisted, read through the admin API with the browser session. */
const storedOption = async (page: Page) => {
  const response = await page.request.get(`/api/admin/tickets?event_id=${RECIPE_EVENT_ID}`)
  expect(response.ok()).toBe(true)
  const { tickets } = (await response.json()) as { tickets: { id: string; operations_config: Record<string, unknown> | null }[] }
  return tickets.find((ticket) => ticket.id === RANKED_TICKET_ID)?.operations_config?.open_companion ?? null
}

const FIXTURE_OPTION = {
  ticket_id: OPEN_TICKET_ID,
  price_cents: 2900,
  ranked_max_duration_minutes: 230,
  min_gap_minutes: 20,
}

test.describe('Admin: Option OPEN on a ticket', () => {
  test.skip(!adminEnabled(), 'opt-in: writes to the dev database (E2E_ADMIN_RECIPE=1)')
  test.describe.configure({ mode: 'serial', timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBrowser(page)
    await signIn(page, adminUser())
    await page.goto(`/dashboard/tickets?event=${RECIPE_EVENT_ID}`)
    // The page rewrites its own URL once (sort and direction) and re-renders; act only after that settles.
    await page.waitForURL(/sort=created_at/, { timeout: 30_000 })
    await expect(page.getByRole('button', { name: `Actions pour ${RANKED_TICKET_ID}` }).filter({ visible: true }).first()).toBeVisible({
      timeout: 30_000,
    })
  })

  test('the list shows the option under the RANKED ticket price', async ({ page }) => {
    await expect(page.getByText('Option OPEN 29,00 € : OPEN - E2E').filter({ visible: true }).first()).toBeVisible()
  })

  test('the form shows the stored option', async ({ page }) => {
    await openEditor(page, RANKED_TICKET_ID)
    const dialog = page.getByRole('dialog', { name: 'Modifier le ticket' })
    await expect(dialog.locator('#ticket-companion')).toBeChecked()
    await expect(dialog.locator('#ticket-companion-price')).toHaveValue('2900')
    await expect(dialog.locator('#ticket-companion-duration')).toHaveValue('230')
    await expect(dialog.locator('#ticket-companion-gap')).toHaveValue('20')
    await expect(dialog.getByRole('combobox').filter({ hasText: 'OPEN - E2E' })).toBeVisible()
  })

  test('saving an unrelated field keeps the option (it used to be wiped)', async ({ page }) => {
    await openEditor(page, RANKED_TICKET_ID)
    const dialog = page.getByRole('dialog', { name: 'Modifier le ticket' })
    await dialog.locator('#ticket-description').fill('Description e2e')
    await save(page)
    expect(await storedOption(page)).toEqual(FIXTURE_OPTION)

    await openEditor(page, RANKED_TICKET_ID)
    await page.getByRole('dialog', { name: 'Modifier le ticket' }).locator('#ticket-description').fill('')
    await save(page)
    expect(await storedOption(page)).toEqual(FIXTURE_OPTION)
  })

  test('the price is editable and persisted, then restored', async ({ page }) => {
    await openEditor(page, RANKED_TICKET_ID)
    await page.locator('#ticket-companion-price').fill('3100')
    await save(page)
    expect(await storedOption(page)).toEqual({ ...FIXTURE_OPTION, price_cents: 3100 })
    await expect(page.getByText('Option OPEN 31,00 € : OPEN - E2E').filter({ visible: true }).first()).toBeVisible()

    await openEditor(page, RANKED_TICKET_ID)
    await expect(page.locator('#ticket-companion-price')).toHaveValue('3100')
    await page.locator('#ticket-companion-price').fill('2900')
    await save(page)
    expect(await storedOption(page)).toEqual(FIXTURE_OPTION)
  })

  test('an incomplete option is refused and nothing is written', async ({ page }) => {
    await openEditor(page, RANKED_TICKET_ID)
    await page.locator('#ticket-companion-price').fill('0')
    await page.getByRole('button', { name: 'Mettre à jour' }).click()
    await expect(page.getByRole('dialog', { name: 'Modifier le ticket' }).getByRole('alert')).toContainText('Option OPEN : le prix doit être')
    expect(await storedOption(page)).toEqual(FIXTURE_OPTION)
  })

  test('the option can be switched off then back on', async ({ page }) => {
    await openEditor(page, RANKED_TICKET_ID)
    await page.locator('#ticket-companion').click()
    await save(page)
    expect(await storedOption(page)).toBeNull()
    await expect(page.getByText(/Option OPEN \d/)).toHaveCount(0)

    await openEditor(page, RANKED_TICKET_ID)
    await expect(page.locator('#ticket-companion')).not.toBeChecked()
    await page.locator('#ticket-companion').click()
    await page.getByRole('dialog', { name: 'Modifier le ticket' }).getByRole('combobox').filter({ hasText: 'Choisis le billet OPEN' }).click()
    await page.getByRole('option', { name: 'OPEN - E2E' }).click()
    await save(page)
    expect(await storedOption(page)).toEqual(FIXTURE_OPTION)
  })

  test('the OPEN ticket of an option cannot be deleted', async ({ page }) => {
    await pickRowAction(page, OPEN_TICKET_ID, 'Supprimer')
    await page.getByLabel(/Pour confirmer/).fill('OPEN - E2E')
    await page.getByRole('button', { name: 'Supprimer définitivement' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'RANKED - E2E' })).toBeVisible()

    const response = await page.request.get(`/api/admin/tickets?event_id=${RECIPE_EVENT_ID}`)
    const { tickets } = (await response.json()) as { tickets: { id: string }[] }
    expect(tickets.map((ticket) => ticket.id)).toContain(OPEN_TICKET_ID)
  })
})
