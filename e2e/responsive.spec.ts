import { expect, test, type Page } from '@playwright/test'

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
const ROUTES = ['/', '/events/ultra-arena-2026', '/events/ultra-arena-2026/register', '/obstacles', '/events/formats', '/volunteers']

const MIN_TAP_TARGET_PX = 44

const assertNoHorizontalScroll = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - doc.clientWidth
  })
  // A 1px slack absorbs sub-pixel rounding from scrollbars/zoom, not a
  // real layout defect.
  expect(overflow, 'document.scrollWidth must not exceed clientWidth (horizontal scroll)').toBeLessThanOrEqual(1)
}

const assertNoElementOverflowsParent = async (page: Page) => {
  const offenders = await page.evaluate(() => {
    const results: string[] = []
    const elements = document.querySelectorAll<HTMLElement>('body *')

    elements.forEach((el) => {
      const parent = el.parentElement
      if (!parent) return
      const style = window.getComputedStyle(el)
      // Elements taken out of normal flow are expected to be sized/placed
      // independently of their DOM parent (sticky CTAs, fixed popups,
      // absolutely-positioned decorations) -- checking their box against
      // the parent's box would produce false positives by design.
      if (style.position === 'fixed' || style.position === 'absolute' || style.position === 'sticky') return
      if (style.display === 'none' || style.visibility === 'hidden') return

      // A parent that manages its own overflow -- clipping it (an infinite
      // marquee track wider than its visible window, like
      // AnimatedBanner.tsx) or scrolling it (a wide comparison table in an
      // overflow-x-auto wrapper) -- is deliberately wider than what's
      // shown. The parent's own overflow handling, not the child's size
      // against that parent, is the real layout contract there.
      const parentStyle = window.getComputedStyle(parent)
      const CONTAINED_OVERFLOW = new Set(['hidden', 'auto', 'scroll'])
      if (CONTAINED_OVERFLOW.has(parentStyle.overflow) || CONTAINED_OVERFLOW.has(parentStyle.overflowX)) return

      const elRect = el.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()
      if (elRect.width === 0 || elRect.height === 0) return

      // 1px tolerance for sub-pixel rounding.
      const overflowsRight = elRect.right > parentRect.right + 1
      const overflowsLeft = elRect.left < parentRect.left - 1

      if (overflowsRight || overflowsLeft) {
        const identity = el.id
          ? `#${el.id}`
          : el.className && typeof el.className === 'string'
            ? `${el.tagName.toLowerCase()}.${el.className.split(' ').slice(0, 2).join('.')}`
            : el.tagName.toLowerCase()
        results.push(identity)
      }
    })

    return Array.from(new Set(results)).slice(0, 10)
  })

  expect(offenders, `elements overflowing their parent's box: ${offenders.join(', ')}`).toEqual([])
}

const assertTapTargetsAreLargeEnough = async (page: Page) => {
  const tooSmall = await page.evaluate((minPx) => {
    const results: string[] = []
    const interactive = document.querySelectorAll<HTMLElement>(
      'a[href], button, [role="button"], input, select, textarea',
    )

    interactive.forEach((el) => {
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') return
      if ((el as HTMLInputElement).disabled) return

      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const smallestDimension = Math.min(rect.width, rect.height)
      // 1px tolerance for sub-pixel rounding.
      if (smallestDimension < minPx - 1) {
        const identity = el.id
          ? `#${el.id}`
          : el.textContent?.trim().slice(0, 30) || el.tagName.toLowerCase()
        results.push(`${identity} (${Math.round(smallestDimension)}px)`)
      }
    })

    return Array.from(new Set(results)).slice(0, 10)
  }, MIN_TAP_TARGET_PX)

  expect(tooSmall, `interactive elements below the ${MIN_TAP_TARGET_PX}px tap target minimum: ${tooSmall.join(', ')}`).toEqual([])
}

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
  '/about/press',
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
