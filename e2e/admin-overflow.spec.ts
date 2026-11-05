import { expect, test } from '@playwright/test'
import { EVENT_ID, stubAdminApis } from './support/admin'

// FDR-0015 §10 contract applied to the refreshed back-office pages: no horizontal scroll from 320 px to 1920 px,
// and nothing of the data table pushed out of its card. API stubbed, see support/admin.ts.
const PAGES = [
  ['/dashboard', 'overview'],
  [`/dashboard/events/${EVENT_ID}/participants`, 'participants'],
  ['/dashboard/orders', 'orders'],
  ['/dashboard/logs', 'logs'],
  ['/dashboard/ambassadors', 'ambassadors'],
  ['/dashboard/ambassadors/dddddddd-0000-4000-8000-000000000001', 'ambassador-sheet'],
  ['/dashboard/users', 'users'],
  ['/dashboard/events', 'events'],
  ['/dashboard/distribution-lists', 'distribution-lists'],
  ['/dashboard/obstacles', 'obstacles'],
  ['/dashboard/promocodes', 'promocodes'],
  ['/dashboard/groups', 'groups'],
] as const
const WIDTHS = [320, 375, 768, 1024, 1280, 1920]

for (const [path, name] of PAGES) {
  test(`${name}: no horizontal overflow from 320 to 1920 px`, async ({ page }) => {
    await stubAdminApis(page)
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${name} at ${width}px overflows by ${overflow}px`).toBeLessThanOrEqual(0)
    }
  })
}
