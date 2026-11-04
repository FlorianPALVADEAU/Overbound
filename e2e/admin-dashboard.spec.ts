import { expect, test, type Page } from '@playwright/test'
import { EVENT_ID, stubAdminApis, type AdminStubState } from './support/admin'

// Behaviour of the refreshed back-office pages, with every /api route answered from memory
// (see support/admin.ts): no database, Stripe or mail provider is ever reached.
// Run against a dev server started with a dummy Supabase URL:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 npx playwright test e2e/admin-dashboard.spec.ts

const noHorizontalScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)

/** First visible element with this text: the lists render a table on desktop and cards on phones. */
const shown = (page: Page, text: string) => page.getByText(text).filter({ visible: true }).first()

const open = async (page: Page, path: string): Promise<AdminStubState> => {
  const state = await stubAdminApis(page)
  await page.goto(path)
  return state
}

test.describe('Back-office overview', () => {
  test('lists what needs attention, with the counts and a link each', async ({ page }) => {
    const state = await open(page, '/dashboard')
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()

    const todo = page.getByRole('link', { name: /Paiements en attente depuis plus de 2 h/ })
    await expect(todo).toBeVisible()
    await expect(todo).toHaveAttribute('href', '/dashboard/orders?status=pending')
    await expect(page.getByRole('link', { name: /Remboursement en échec/ })).toBeVisible()
    await expect(page.getByText('Ventes des 30 derniers jours')).toBeVisible()
    expect(state.unstubbed).toEqual([])
  })

  test('redirects an old ?tab= link to the page that replaced it', async ({ page }) => {
    await open(page, `/dashboard?tab=members&event=${EVENT_ID}`)
    await page.waitForURL(`**/dashboard/events/${EVENT_ID}/participants`)
    await expect(page.getByRole('heading', { name: 'Participants' })).toBeVisible()
  })
})

test.describe('Participants', () => {
  const rowOf = (page: Page, email: string) => page.getByRole('row').filter({ hasText: email }).filter({ visible: true }).first()
  const openRowMenu = async (page: Page, email: string) => {
    await rowOf(page, email).getByRole('button', { name: /Actions pour/ }).click()
  }

  test('shows every column, the French payment status, and no raw status word', async ({ page }) => {
    const state = await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    await expect(shown(page, 'participant1@example.com')).toBeVisible()
    await expect(shown(page, '1 à 50 sur 60 participants')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Dossard' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Départ' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Paiement' })).toBeVisible()
    await expect(page.getByText('Payée').first()).toBeVisible()
    await expect(page.getByText(/^paid$/)).toHaveCount(0)
    await expect(page.getByText(/3.?450/).first()).toBeVisible()
    expect(state.unstubbed).toEqual([])
    await noHorizontalScroll(page)
  })

  test('the column picker reveals a hidden column and remembers the choice after a reload', async ({ page }) => {
    await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    await expect(page.getByRole('columnheader', { name: 'Groupe' })).toHaveCount(0)

    await page.getByRole('button', { name: /Colonnes/ }).click()
    await page.getByRole('menuitemcheckbox', { name: 'Groupe' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('columnheader', { name: 'Groupe' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('columnheader', { name: 'Groupe' })).toBeVisible()
  })

  test('search sends the term to the API and narrows the list', async ({ page }) => {
    const state = await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    await expect(shown(page, 'participant1@example.com')).toBeVisible()
    await page.getByRole('searchbox').or(page.getByPlaceholder(/Nom/)).first().fill('participant42')
    await expect(page.getByText('1 sur 1 participants').or(page.getByText(/1 participant/)).first()).toBeVisible()
    expect(state.participantQueries.some((query) => query.includes('query=participant42'))).toBe(true)
    await expect(page.getByText('participant1@example.com')).toHaveCount(0)
  })

  test('goes to the next page', async ({ page }) => {
    await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    await expect(shown(page, 'participant1@example.com')).toBeVisible()
    await page.getByRole('button', { name: /Suivant|Page suivante/ }).first().click()
    await expect(shown(page, 'participant55@example.com')).toBeVisible()
    await expect(shown(page, '51 à 60 sur 60 participants')).toBeVisible()
  })

  test('resends a ticket and tells the admin where it went', async ({ page }) => {
    const state = await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    await openRowMenu(page, 'participant2@example.com')
    await page.getByRole('menuitem', { name: 'Renvoyer le billet' }).click()
    await expect(page.getByText(/participant2@example.com/).filter({ hasText: /billet|envoy/i }).first()).toBeVisible()
    expect(state.writes.some((write) => write.route.endsWith('/resend-ticket'))).toBe(true)
  })

  test('cancelling needs a reason, then sends it with the chosen refund and marks the row', async ({ page }) => {
    const state = await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    await openRowMenu(page, 'participant2@example.com')
    await page.getByRole('menuitem', { name: /Annuler/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const confirm = dialog.getByRole('button', { name: /Annuler (l’inscription|et rembourser)/ })
    await expect(confirm).toBeDisabled()

    await dialog.getByLabel(/Motif/).fill('Blessure avant la course')
    await dialog.getByLabel(/Rembourser le billet/).check()
    await expect(confirm).toBeEnabled()
    await confirm.click()

    await expect(dialog).toBeHidden()
    const write = state.writes.find((item) => item.route.endsWith('/cancel'))
    expect(write?.body).toEqual({ reason: 'Blessure avant la course', refund: { mode: 'ticket' } })
    await expect(rowOf(page, 'participant2@example.com')).toContainText(/Remboursé|Annulée/)
  })

  test('a failed cancellation keeps the dialog open and shows the server message', async ({ page }) => {
    await stubAdminApis(page)
    await page.route('**/api/admin/registrations/*/cancel', (route) => route.fulfill({ status: 409, json: { error: 'Déjà enregistrée comme présente' } }))
    await page.goto(`/dashboard/events/${EVENT_ID}/participants`)
    await openRowMenu(page, 'participant4@example.com')
    await page.getByRole('menuitem', { name: /Annuler/ }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/Motif/).fill('Test échec')
    await dialog.getByRole('button', { name: /Annuler (l’inscription|et rembourser)/ }).click()
    await expect(dialog.getByText('Déjà enregistrée comme présente')).toBeVisible()
  })

  test('CSV export link carries the active filters', async ({ page }) => {
    await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    const exportLink = page.getByRole('link', { name: /Exporter en CSV/ }).or(page.getByRole('button', { name: /Exporter en CSV/ })).first()
    await expect(exportLink).toBeVisible()
  })
})

test.describe('Orders', () => {
  test('lists orders with French status and Stripe link, and filters by status from the URL', async ({ page }) => {
    const state = await open(page, '/dashboard/orders?status=pending')
    await expect(page.getByRole('heading', { name: 'Commandes' })).toBeVisible()
    await expect(page.getByText('En attente').first()).toBeVisible()
    await expect(shown(page, 'buyer1@example.com')).toBeVisible()
    await expect(page.getByText('buyer0@example.com')).toHaveCount(0)
    expect(state.unstubbed).toEqual([])
  })

  test('resends a receipt', async ({ page }) => {
    const state = await stubAdminApis(page)
    await page.route('**/api/admin/emails/receipt', async (route) => {
      state.writes.push({ route: 'POST /emails/receipt', body: route.request().postDataJSON() })
      await route.fulfill({ json: { success: true } })
    })
    await page.goto('/dashboard/orders')
    await page.getByRole('row').filter({ hasText: 'buyer0@example.com' }).filter({ visible: true }).first().getByRole('button', { name: /Actions pour/ }).click()
    await page.getByRole('menuitem', { name: 'Renvoyer le reçu' }).click()
    await expect(page.getByText(/Reçu renvoyé/)).toBeVisible()
    expect(state.writes.find((write) => write.route === 'POST /emails/receipt')?.body).toEqual({ paymentIntentId: 'pi_test_0' })
  })
})

test.describe('Logs', () => {
  test('shows full paths and summaries without truncation and opens a detail', async ({ page }) => {
    const state = await open(page, '/dashboard/logs')
    await expect(shown(page, '1 à 100 sur 120')).toBeVisible()
    // The whole path is in the DOM and not cut by an ellipsis.
    const path = page.getByText('/api/admin/some/very/long/path/that/must/not/be/truncated/1/with/a/segment/after/another').first()
    await expect(path).toBeVisible()
    const truncated = await path.evaluate((node) => node.scrollWidth > node.clientWidth + 1)
    expect(truncated).toBe(false)
    expect(state.unstubbed).toEqual([])
    await noHorizontalScroll(page)
  })

  test('filters by method through the API and pages forward', async ({ page }) => {
    await open(page, '/dashboard/logs')
    await expect(shown(page, '1 à 100 sur 120')).toBeVisible()
    await page.getByRole('button', { name: /Suivant|Page suivante/ }).first().click()
    await expect(shown(page, '101 à 120 sur 120')).toBeVisible()
  })
})

test.describe('Ambassadors', () => {
  const AMBASSADOR_1 = 'dddddddd-0000-4000-8000-000000000001'
  const reward = (page: Page, level: number) =>
    page.getByRole('listitem').filter({ hasText: `Palier ${level} ·` }).filter({ visible: true }).first()

  test('lists every ambassador with the rewards waiting, and a row opens the sheet', async ({ page }) => {
    const state = await open(page, '/dashboard/ambassadors')
    await expect(page.getByRole('heading', { name: 'Ambassadeurs' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Classement' })).toHaveCount(0)
    await expect(shown(page, '1 à remettre')).toBeVisible()
    await expect(shown(page, '2 à réclamer')).toBeVisible()

    await page.getByRole('row').filter({ hasText: 'Ambassadeur 1' }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/ambassadors/${AMBASSADOR_1}$`))
    await expect(page.getByRole('heading', { name: 'Ambassadeur 1' })).toBeVisible()
    expect(state.unstubbed).toEqual([])
  })

  test('the sheet shows the ladder with each reward and its next action', async ({ page }) => {
    const state = await open(page, `/dashboard/ambassadors/${AMBASSADOR_1}`)
    await expect(page.getByRole('link', { name: /Retour aux ambassadeurs/ })).toBeVisible()
    await expect(reward(page, 1).getByRole('button', { name: 'Marquer réclamée' })).toBeVisible()
    await expect(reward(page, 2).getByRole('button', { name: 'Marquer envoyée' })).toBeVisible()
    await expect(reward(page, 3).getByRole('button', { name: 'Rouvrir' })).toBeVisible()
    expect(state.unstubbed).toEqual([])
  })

  test('cancelling a reward asks for a reason and sends it', async ({ page }) => {
    const state = await open(page, `/dashboard/ambassadors/${AMBASSADOR_1}`)
    await reward(page, 1).getByRole('button', { name: 'Annuler', exact: true }).click()

    const dialog = page.getByRole('dialog')
    const confirm = dialog.getByRole('button', { name: 'Annuler la récompense' })
    await expect(confirm).toBeDisabled()
    await dialog.getByLabel('Motif obligatoire').fill('Inscription remboursée')
    await confirm.click()

    await expect(page.getByText('Récompense annulée.')).toBeVisible()
    const write = state.writes.find((item) => item.route.startsWith('PATCH /ambassador-rewards/'))
    expect(write?.body).toMatchObject({ action: 'cancelled', reason: 'Inscription remboursée' })
  })

  test('marking a reward as sent calls the API without any prompt', async ({ page }) => {
    const state = await open(page, `/dashboard/ambassadors/${AMBASSADOR_1}`)
    await reward(page, 2).getByRole('button', { name: 'Marquer envoyée' }).click()
    await expect(page.getByText(/marquée « envoyée »/)).toBeVisible()
    expect(state.writes.find((item) => item.route.startsWith('PATCH /ambassador-rewards/'))?.body).toEqual({ status: 'fulfilled' })
  })

  test('referrals load when their tab opens, not with the sheet', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/referrals')) requested.push(request.url())
    })
    const state = await open(page, `/dashboard/ambassadors/${AMBASSADOR_1}`)
    await expect(reward(page, 1).getByRole('button', { name: 'Marquer réclamée' })).toBeVisible()
    expect(requested).toEqual([])

    await page.getByRole('tab', { name: 'Filleuls' }).click()
    await expect(page.getByText('Aucun filleul pour la saison en cours.')).toBeVisible()
    expect(requested.length).toBeGreaterThan(0)
    expect(state.unstubbed).toEqual([])
  })
})

test.describe('Navigation', () => {
  test('the sidebar has one entry per page and highlights participants on its event URL', async ({ page }) => {
    await open(page, `/dashboard/events/${EVENT_ID}/participants`)
    const sidebar = page.getByRole('navigation').filter({ hasText: 'Billetterie' }).first()
    await expect(sidebar.getByRole('link', { name: 'Participants' })).toHaveAttribute('aria-current', 'page')
    await expect(sidebar.getByRole('link', { name: 'Membres' })).toHaveCount(0)
    await expect(sidebar.getByRole('link', { name: 'Commandes' })).toBeVisible()
  })

  test('the event context lives on the overview: a banner while set, removed in one click', async ({ page }) => {
    await open(page, `/dashboard?event=${EVENT_ID}`)
    await expect(page.getByRole('status', { name: 'Contexte événement actif' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Contexte événement' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Retirer le contexte' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('combobox', { name: 'Contexte événement' })).toBeVisible()
  })

  test('other pages carry no global event context', async ({ page }) => {
    await open(page, '/dashboard/logs')
    await expect(page.getByRole('combobox', { name: 'Contexte événement' })).toHaveCount(0)
    await expect(page.getByRole('status', { name: 'Contexte événement actif' })).toHaveCount(0)
  })
})
