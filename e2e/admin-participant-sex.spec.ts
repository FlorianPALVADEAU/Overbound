import { expect, test, type Page } from '@playwright/test'
import { EVENT_ID, stubAdminApis, type AdminStubState } from './support/admin'

// Sex of each bib in the back-office: the share on the dashboard, the filter and badge of the
// participants list, and the same filter in the CSV export. Answered from memory (support/admin.ts).

const open = async (page: Page, path: string): Promise<AdminStubState> => {
  const state = await stubAdminApis(page)
  await page.goto(path)
  return state
}

/** First visible element with this text: the lists render a table on desktop and cards on phones. */
const shown = (page: Page, text: string) => page.getByText(text).filter({ visible: true }).first()

test.describe('Back-office: sex of the bibs', () => {
  test('the dashboard shows the share of men and women, the bibs without a sex apart', async ({ page }) => {
    const state = await open(page, '/dashboard')

    await expect(shown(page, 'Hommes et femmes')).toBeVisible()
    await expect(shown(page, '60 %')).toBeVisible()
    await expect(shown(page, '40 %')).toBeVisible()
    await expect(shown(page, '12 dossards sans sexe')).toBeVisible()
    expect(state.unstubbed).toEqual([])
  })

  test('the participants list shows each bib sex, and the filter narrows the list and the URL', async ({ page }) => {
    const state = await open(page, `/dashboard/events/${EVENT_ID}/participants`)

    await expect(shown(page, 'participant1@example.com')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Sexe' })).toBeVisible()

    await page.getByRole('combobox', { name: 'Sexe' }).click()
    await page.getByRole('option', { name: 'Femme' }).click()

    await expect(page).toHaveURL(/sex=femme/)
    await expect(shown(page, 'participant2@example.com')).toBeVisible()
    await expect(page.getByText('participant1@example.com')).toHaveCount(0)
    await expect(page.getByText('participant4@example.com')).toHaveCount(0)
    expect(state.participantQueries.some((query) => query.includes('sex=femme'))).toBe(true)
    expect(state.unstubbed).toEqual([])
  })

  test('the filter for bibs without a recorded sex lists only those bibs', async ({ page }) => {
    const state = await open(page, `/dashboard/events/${EVENT_ID}/participants?sex=none`)

    await expect(shown(page, 'participant4@example.com')).toBeVisible()
    await expect(page.getByText('participant2@example.com')).toHaveCount(0)
    expect(state.participantQueries.some((query) => query.includes('sex=none'))).toBe(true)
  })

  test('the CSV export asks for the same sex filter as the list', async ({ page }) => {
    await open(page, `/dashboard/events/${EVENT_ID}/participants?sex=homme`)

    const exportLink = page.getByRole('link', { name: 'Exporter en CSV' })
    await expect(exportLink).toHaveAttribute('href', /sex=homme/)
  })
})
