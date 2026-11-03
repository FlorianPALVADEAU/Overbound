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
