import { test } from '@playwright/test'
import { EVENT_ID, stubAdminApis } from './support/admin'

// Writes one screenshot per page and window to ADMIN_SHOTS_DIR, for a visual review. Skipped otherwise.
const OUT = process.env.ADMIN_SHOTS_DIR
const PAGES = [
  ['overview', '/dashboard'],
  ['participants', `/dashboard/events/${EVENT_ID}/participants`],
  ['orders', '/dashboard/orders'],
  ['logs', '/dashboard/logs'],
  ['ambassadors', '/dashboard/ambassadors'],
] as const
const WINDOWS = [
  ['desktop', { width: 1280, height: 800 }],
  ['phone', { width: 375, height: 812 }],
] as const

for (const [windowName, viewport] of WINDOWS) {
  test.describe(`admin screenshots ${windowName}`, () => {
    test.skip(!OUT, 'set ADMIN_SHOTS_DIR to write screenshots')
    test.use({ viewport })
    for (const [name, path] of PAGES) {
      test(name, async ({ page }) => {
        await stubAdminApis(page)
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await page.screenshot({ path: `${OUT}/${name}-${windowName}.png`, fullPage: true, clip: { x: 0, y: 0, width: viewport.width, height: 1500 } })
      })
    }
  })
}
