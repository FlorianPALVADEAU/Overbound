import { defineConfig } from '@playwright/test'

// FDR-0015 §10: mobile-first, zero-visual-defect contract, verified by
// machine rather than by eye. One project per viewport in the matrix so a
// failure names the exact window that broke, not just "responsive.spec.ts
// failed somewhere."
const VIEWPORTS = {
  'phone-320x568': { width: 320, height: 568 },
  'phone-360x640': { width: 360, height: 640 },
  'phone-375x667': { width: 375, height: 667 },
  'phone-390x844': { width: 390, height: 844 },
  'phone-414x896': { width: 414, height: 896 },
  'phone-landscape-844x390': { width: 844, height: 390 },
  'tablet-768x1024': { width: 768, height: 1024 },
  'tablet-1024x768': { width: 1024, height: 768 },
  'desktop-1280x800': { width: 1280, height: 800 },
  'desktop-1440x900': { width: 1440, height: 900 },
  'desktop-1920x1080': { width: 1920, height: 1080 },
  'desktop-2560x1440': { width: 2560, height: 1440 },
} as const

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 3100',
        url: 'http://localhost:3100',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: Object.entries(VIEWPORTS).map(([name, viewport]) => ({
    name,
    use: { viewport },
  })),
})
