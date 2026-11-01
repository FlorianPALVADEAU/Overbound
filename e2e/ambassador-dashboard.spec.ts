import { expect, test } from '@playwright/test'
import { assertNoElementOverflowsParent, assertNoHorizontalScroll, assertTapTargetsAreLargeEnough } from './support/layout'
import { disableAutomaticPopups } from './support/popups'

// Responsive contract (FDR-0015 §10) for the ambassador dashboard, on its fixed-data reference render.
const ROUTE = '/design/ambassadeur'

test.beforeEach(async ({ page }) => {
  await disableAutomaticPopups(page)
  await page.goto(ROUTE)
  await expect(page.getByRole('heading', { name: /salut ada/i })).toBeVisible()
})

test('has no horizontal scroll', async ({ page }) => {
  await assertNoHorizontalScroll(page)
})

test('has no element overflowing its parent', async ({ page }) => {
  await assertNoElementOverflowsParent(page)
})

test('has no undersized tap target', async ({ page }) => {
  await assertTapTargetsAreLargeEnough(page)
})

test('puts the claim button and the share button on screen', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Réclamer' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Partager' })).toBeVisible()
})
