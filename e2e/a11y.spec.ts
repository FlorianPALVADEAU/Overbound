import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { disableAutomaticPopups, freezeHeroVideo } from './support/popups'

// Automated WCAG 2.1 A/AA audit (axe-core) of the public pages, with the cookie banner open because it is the
// first thing a new visitor meets. axe catches roughly a third of accessibility defects (contrast, names, labels,
// ARIA misuse); keyboard behaviour is asserted separately below.
const ROUTES = [
  '/',
  '/events/ultra-arena-2026',
  '/events/ultra-arena-2026/register',
  '/obstacles',
  '/events/formats',
  '/cookies',
  '/privacy-policies',
  '/cgv',
  '/cgu',
  '/contact',
  '/auth/register',
]

test.beforeEach(async ({ page }) => {
  await disableAutomaticPopups(page)
  await freezeHeroVideo(page)
})

for (const route of ROUTES) {
  test(`axe: no WCAG 2.1 A/AA violation on ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

    expect(
      violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.nodes[0]?.target.join(' ')}`),
    ).toEqual([])
  })
}

test('keyboard: the first Tab stop is the skip link and it moves focus to the main content', async ({ page }) => {
  await page.goto('/cgv')
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Aller au contenu principal' })
  await expect(skipLink).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('keyboard: the focused element always has a visible outline', async ({ page }) => {
  await page.goto('/cookies')

  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const style = window.getComputedStyle(el)
      return { tag: el.tagName, width: style.outlineWidth, style: style.outlineStyle, shadow: style.boxShadow }
    })
    if (!outline) continue
    const hasOutline = outline.style !== 'none' && parseFloat(outline.width) > 0
    const hasRing = outline.shadow !== 'none'
    expect(hasOutline || hasRing, `Tab stop ${step + 1} (<${outline.tag}>) has no visible focus indicator`).toBe(true)
  }
})

test('cookie banner: refusing and accepting are equally prominent and no tracker loads before consent', async ({ page }) => {
  const trackerRequests: string[] = []
  page.on('request', (request) => {
    if (/googletagmanager\.com|connect\.facebook\.net|google-analytics\.com/.test(request.url())) {
      trackerRequests.push(request.url())
    }
  })

  await page.goto('/')
  const refuse = page.getByRole('button', { name: 'Tout refuser' })
  const accept = page.getByRole('button', { name: 'Tout accepter' })
  await expect(refuse).toBeVisible()
  await expect(accept).toBeVisible()

  const [refuseBox, acceptBox] = await Promise.all([refuse.boundingBox(), accept.boundingBox()])
  expect(refuseBox?.height).toBe(acceptBox?.height)
  expect(refuseBox?.width).toBe(acceptBox?.width)
  expect(trackerRequests).toEqual([])

  await refuse.click()
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(trackerRequests).toEqual([])
})
