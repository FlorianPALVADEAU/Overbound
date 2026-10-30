import { expect, test, type Page } from '@playwright/test'
import { assertNoElementOverflowsParent, assertNoHorizontalScroll, assertTapTargetsAreLargeEnough } from './support/layout'
import { disableAutomaticPopups, freezeHeroVideo } from './support/popups'

// FDR-0015 §10: the responsive contract, checked by machine on every key
// route across the viewport matrix (playwright.config.ts), rather than
// relied upon as a one-time manual pass. Four assertions per route:
//   1. no horizontal scroll
//   2. no element overflowing its direct parent's box
//   3. every interactive element is >= 44px in its smallest dimension
//   4. a screenshot, for visual diffing across runs
//
// Routes intentionally cover the funnel entry points touched by FDR-0015
// §4/§5 (accueil, event landing, register) plus the three pages un-gated
// in §6 (obstacles, formats) -- not the whole site, which is out of scope
// for this harness's first pass.
const ROUTES = ['/', '/events/ultra-arena-2026', '/events/ultra-arena-2026/register', '/obstacles', '/events/formats', '/volunteers', '/contact', '/about/our-story', '/about/partners', '/about/faq', '/about/credits', '/entreprises']

// Popups depend on live campaigns and timers, and the hero video on an idle
// delay: left alone, they change the page from run to run and make the
// assertions and snapshots flaky.
test.beforeEach(async ({ page }) => {
  await disableAutomaticPopups(page)
  await freezeHeroVideo(page)
})


for (const route of ROUTES) {
  test(`${route} has no horizontal scroll`, async ({ page }) => {
    await page.goto(route)
    await assertNoHorizontalScroll(page)
  })

  test(`${route} has no element overflowing its parent`, async ({ page }) => {
    await page.goto(route)
    await assertNoElementOverflowsParent(page)
  })

  test(`${route} has no undersized tap target`, async ({ page }) => {
    await page.goto(route)
    await assertTapTargetsAreLargeEnough(page)
  })

  test(`${route} visual snapshot`, async ({ page }) => {
    await page.goto(route)
    // Deferred homepage sections (next/dynamic, HomeDeferredSections.tsx)
    // and the AnimatedBanner marquee settle after paint -- capturing
    // before that gives an unstable, wildly-varying page height between
    // consecutive screenshots. networkidle plus a short settle delay
    // avoids that without hand-waiting on any one component.
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot(`${route.replace(/\//g, '_') || '_home'}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      timeout: 15_000,
    })
  })
}

// Every hero banner shares one height (HeroFrame, variant "standard"); only the
// event page is deliberately taller. Measured on the rendered page, per viewport.
const STANDARD_HERO_ROUTES = [
  '/events/formats',
  '/obstacles',
  '/volunteers',
  '/bootcamps',
  '/blog',
  '/about/our-story',
  '/about/partners',
  '/contact',
  '/about/credits',
  '/about/faq',
]

const measureHero = (page: Page, kind: 'standard' | 'tall') =>
  page.evaluate((k) => {
    const el = document.querySelector<HTMLElement>(`[data-hero="${k}"]`)
    if (!el) return null
    return { height: el.getBoundingClientRect().height, clipped: el.scrollHeight - el.clientHeight }
  }, kind)

test('standard heroes share the same height on every page', async ({ page }) => {
  test.setTimeout(180_000)
  const heights: Record<string, number> = {}
  const missing: string[] = []
  const clippedContent: string[] = []
  for (const route of STANDARD_HERO_ROUTES) {
    await page.goto(route)
    const hero = await measureHero(page, 'standard')
    if (!hero) {
      missing.push(route)
      continue
    }
    heights[route] = hero.height
    if (hero.clipped > 1) clippedContent.push(`${route} (+${hero.clipped}px)`)
  }
  expect(missing, `no [data-hero="standard"] on: ${missing.join(', ')}`).toEqual([])
  expect(clippedContent, 'hero content taller than the hero').toEqual([])
  const values = Object.values(heights)
  expect(Math.max(...values) - Math.min(...values), `hero heights differ: ${JSON.stringify(heights)}`).toBeLessThanOrEqual(1)
})

test('the event page hero is the one taller exception', async ({ page }) => {
  await page.goto('/events/ultra-arena-2026')
  const tall = await measureHero(page, 'tall')
  test.skip(tall === null, 'no event data in this environment')
  await page.goto('/events/formats')
  const standard = await measureHero(page, 'standard')
  expect(tall!.height).toBeGreaterThan(standard!.height)
})

// /contact is account-only: an anonymous visitor gets a login prompt and a
// mailto fallback, never the form itself.
test('/contact shows a login prompt instead of the form when signed out', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.getByRole('heading', { name: 'Connecte-toi pour nous écrire' })).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', /\/auth\/login\?next=/)
  await expect(page.locator('form')).toHaveCount(0)
})
