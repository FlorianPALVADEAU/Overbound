import { expect, test } from '@playwright/test'
import { CODE, dashboardData, stubAmbassadorApis } from './support/ambassador'
import { disableAutomaticPopups } from './support/popups'

// Behaviour of the real /ambassadors/dashboard page, with the session and dashboard APIs stubbed.
// The layout contract is in ambassador-dashboard.spec.ts.
const ROUTE = '/ambassadors/dashboard'

test.describe('Ambassador dashboard', () => {
  test('sends a visitor who is not signed in to the login page', async ({ page }) => {
    await disableAutomaticPopups(page)
    await page.route('**/api/session', (route) => route.fulfill({ status: 401, json: { error: 'Non authentifié' } }))
    await page.goto(ROUTE)

    await page.waitForURL(/\/auth\/login\?next=%2Fambassadors%2Fdashboard|\/auth\/login\?next=\/ambassadors\/dashboard/)
  })

  test('refuses an account that is not an ambassador', async ({ page }) => {
    await stubAmbassadorApis(page, { role: 'user', email: 'someone@example.com' })
    await page.goto(ROUTE)

    await expect(page.getByText('Accès refusé')).toBeVisible()
    await expect(page.getByRole('heading', { name: /salut/i })).toHaveCount(0)
  })

  test('shows the goal: points left and the reward they unlock', async ({ page }) => {
    await stubAmbassadorApis(page)
    await page.goto(ROUTE)

    await expect(page.getByRole('heading', { name: 'Salut Ada' })).toBeVisible()
    await expect(page.getByText(CODE, { exact: true })).toBeVisible()
    await expect(page.getByText('T-shirt Overbound').first()).toBeVisible()
  })

  test('claims a reward: sends the level, confirms, and the reward leaves the claim list', async ({ page }) => {
    const stub = await stubAmbassadorApis(page)
    await page.goto(ROUTE)

    const claim = page.getByRole('button', { name: 'Réclamer' })
    await expect(claim).toBeVisible()
    await expect(page.getByText(/à réclamer avant le 31 décembre 2027/i)).toBeVisible()

    // After the claim the page refetches: the API now answers without a claimable reward.
    stub.setData(dashboardData({ rewards: [] }))
    await claim.click()

    await expect(page.getByText('Récompense réclamée !')).toBeVisible()
    expect(stub.claimBodies()).toEqual([{ reward_level: 2 }])
    await expect(page.getByRole('button', { name: 'Réclamer' })).toHaveCount(0)
  })

  test('says so when a reward expired with the season', async ({ page }) => {
    await stubAmbassadorApis(page, {
      claim: { status: 409, json: { error: 'Cette récompense a expiré à la fin de la saison.' } },
    })
    await page.goto(ROUTE)

    await page.getByRole('button', { name: 'Réclamer' }).click()

    await expect(page.getByText('Cette récompense a expiré à la fin de la saison.')).toBeVisible()
    // The reward stays on screen: nothing was claimed.
    await expect(page.getByRole('button', { name: 'Réclamer' })).toBeEnabled()
  })

  test('shares the referral link with the code in it', async ({ page }) => {
    await stubAmbassadorApis(page)
    await page.addInitScript(() => {
      const shared: unknown[] = []
      ;(window as unknown as { __shared: unknown[] }).__shared = shared
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload: unknown) => void shared.push(payload),
      })
    })
    await page.goto(ROUTE)

    await page.getByRole('button', { name: 'Partager', exact: true }).click()

    const shared = await page.evaluate(() => (window as unknown as { __shared: Array<{ url: string; text: string }> }).__shared)
    expect(shared).toHaveLength(1)
    expect(new URL(shared[0].url).pathname).toBe('/events/ultra-arena-2027/register')
    expect(new URL(shared[0].url).search).toBe(`?ref=${CODE}`)
    expect(shared[0].text).toContain(CODE)
  })

  test('falls back to copying the code when the share sheet is not available', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined)
    await stubAmbassadorApis(page)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      const copied: string[] = []
      ;(window as unknown as { __copied: string[] }).__copied = copied
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (text: string) => void copied.push(text) },
      })
    })
    await page.goto(ROUTE)

    await page.getByRole('button', { name: 'Partager', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Copié' })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([CODE])
  })

  test('shows the rank to beat when the ambassador is behind someone', async ({ page }) => {
    await stubAmbassadorApis(page, {
      data: dashboardData({
        leaderboard: {
          total_ranked: 3,
          current_user_rank: 2,
          top: [
            { rank: 1, name: 'Alan T.', points: 9, is_current_user: false },
            { rank: 2, name: 'Ada L.', points: 4, is_current_user: true },
          ],
          chase: { name: 'Alan T.', points_to_pass: 6 },
        },
      }),
    })
    await page.goto(ROUTE)

    await expect(page.getByText('2e au classement')).toBeVisible()
    await expect(page.getByText(/Pour passer devant Alan T\. : encore 6 points/)).toBeVisible()
  })
})
