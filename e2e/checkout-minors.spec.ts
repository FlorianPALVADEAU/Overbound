import { expect, test, type Page } from '@playwright/test'
import { EVENT_SLUG, fillParticipant, signWaiver, stubCheckoutApis, type StubParticipant } from './support/checkout'

const REGISTER_URL = `/events/${EVENT_SLUG}/register`

// Event on 2030-09-12: born 2013-03-02 is 17, born 2014-05-01 is 16, born 2016-01-01 is 13.
const GUARDIAN = { name: 'Anne Martin', phone: '0612345678', email: 'anne.martin@example.com' }
const ADULT: StubParticipant = { firstName: 'Anne', lastName: 'Martin', email: 'anne@example.com', birthDate: '1985-02-10', sex: 'femme' }
const LEA: StubParticipant = { firstName: 'Léa', lastName: 'Martin', email: 'lea@example.com', birthDate: '2013-03-02', sex: 'femme', guardian: GUARDIAN }
const NOE: StubParticipant = { firstName: 'Noé', lastName: 'Martin', email: 'noe@example.com', birthDate: '2014-05-01', sex: 'homme', guardian: GUARDIAN }

const payButton = (page: Page) => page.getByRole('button', { name: 'Payer en sécurité' }).filter({ visible: true }).first()

const chooseQuantity = async (page: Page, label: RegExp) => {
  await page.getByRole('combobox', { name: 'Quantité pour Primal OPEN' }).click()
  await page.getByRole('option', { name: label }).click()
}

/** Opens the checkout of an event that admits 16 and 17 year olds, for the given number of tickets. */
const openCheckout = async (page: Page, tickets = 1, minimumAge = 16) => {
  const capture = await stubCheckoutApis(page, { signedIn: true, minimumAge })
  await page.goto(REGISTER_URL)
  await page.locator('#participant-1-firstName').waitFor()
  if (tickets > 1) await chooseQuantity(page, new RegExp(`^${tickets} billets`))
  return capture
}

/** Ticks the attestations the order asks for, after the waiver. */
const attest = async (page: Page, ids: readonly string[]) => {
  for (const id of ids) await page.locator(`#${id}`).click()
}

test.describe('Checkout — participants aged 16 and 17', () => {
  test.describe.configure({ timeout: 90_000 })

  test('a 17 year old alone: contacts asked, legal representative attestation required, then registered as a minor', async ({ page }) => {
    const capture = await openCheckout(page)

    await fillParticipant(page, 1, LEA)
    await expect(page.locator('#participant-1-guardian')).toHaveValue('Anne Martin')
    await signWaiver(page)

    // Without the attestation nothing is charged and the box is shown with its error.
    await payButton(page).click()
    await expect(page.locator('#minor-attestation')).toBeVisible()
    await expect(page.getByText('Ce champ est obligatoire.').first()).toBeVisible()
    expect(capture.paymentIntentBody()).toBeNull()

    await attest(page, ['minor-attestation'])
    await payButton(page).click()

    await expect.poll(capture.registrationBody).not.toBeNull()
    expect(capture.registrationBody()).toMatchObject({
      disclaimer: { minorAttestation: true },
      participants: [{ firstName: 'Léa', birthDate: '2013-03-02', sex: 'femme', guardianName: 'Anne Martin', guardianEmail: 'anne.martin@example.com', referentPhone: '0612345678' }],
    })
    await page.waitForURL(`**/events/${EVENT_SLUG}/success?registration_id=reg-e2e`)
  })

  test('the attestation names the minor', async ({ page }) => {
    await openCheckout(page)
    await fillParticipant(page, 1, LEA)

    await expect(page.getByText('J’atteste être le représentant légal de Léa, ou agir avec l’accord de son représentant légal.')).toBeVisible()
  })

  test('two minors and nobody else: one attestation for both, named together, one waiver for the order', async ({ page }) => {
    const capture = await openCheckout(page, 2)

    await fillParticipant(page, 1, LEA)
    await fillParticipant(page, 2, NOE)
    await signWaiver(page)

    await expect(page.getByText('représentant légal de Léa et Noé, ou agir avec l’accord de leurs représentants légaux')).toBeVisible()
    await expect(page.locator('#minor-attestation')).toHaveCount(1)

    // The order is refused until both the group and the minor attestations are given.
    await attest(page, ['group-attestation'])
    await payButton(page).click()
    expect(capture.paymentIntentBody()).toBeNull()

    await attest(page, ['minor-attestation'])
    await payButton(page).click()

    await expect.poll(capture.registrationBody).not.toBeNull()
    expect(capture.registrationBody()).toMatchObject({
      disclaimer: { groupAttestation: true, minorAttestation: true },
      participants: [
        { firstName: 'Léa', guardianName: 'Anne Martin' },
        { firstName: 'Noé', guardianName: 'Anne Martin' },
      ],
    })
  })

  test('a parent and a child: the child alone is named and asked for the contacts', async ({ page }) => {
    const capture = await openCheckout(page, 2)

    await fillParticipant(page, 1, ADULT)
    await fillParticipant(page, 2, LEA)
    await signWaiver(page)

    await expect(page.locator('#participant-1-guardian')).toHaveCount(0)
    await expect(page.locator('#participant-2-guardian')).toBeVisible()
    await expect(page.getByText('représentant légal de Léa, ou agir avec')).toBeVisible()

    await attest(page, ['group-attestation', 'minor-attestation'])
    await payButton(page).click()

    await expect.poll(capture.registrationBody).not.toBeNull()
    const [parent, child] = (capture.registrationBody() as { participants: Array<Record<string, unknown>> }).participants
    expect(parent).not.toHaveProperty('guardianName')
    expect(child).toMatchObject({ firstName: 'Léa', guardianName: 'Anne Martin' })
  })

  test('adults only on an event open to minors: no minor attestation is asked', async ({ page }) => {
    const capture = await openCheckout(page, 2)

    await fillParticipant(page, 1, ADULT)
    await fillParticipant(page, 2, { ...ADULT, firstName: 'Paul', email: 'paul@example.com' })
    await signWaiver(page)

    await expect(page.locator('#minor-attestation')).toHaveCount(0)
    await attest(page, ['group-attestation'])
    await payButton(page).click()

    await expect.poll(capture.registrationBody).not.toBeNull()
    expect(capture.registrationBody()?.disclaimer).not.toHaveProperty('minorAttestation')
  })

  test('a minor without a legal representative is stopped on that field before any payment', async ({ page }) => {
    const capture = await openCheckout(page)

    await fillParticipant(page, 1, { ...LEA, guardian: undefined })
    await signWaiver(page)
    await attest(page, ['minor-attestation'])
    await payButton(page).click()

    await expect(page.locator('#participant-1-guardian')).toBeFocused()
    expect(capture.paymentIntentBody()).toBeNull()
  })

  test('a minor whose representative gives no valid email is stopped on that field before any payment', async ({ page }) => {
    const capture = await openCheckout(page)

    await fillParticipant(page, 1, { ...LEA, guardian: { ...GUARDIAN, email: 'anne.martin@' } })
    await signWaiver(page)
    await attest(page, ['minor-attestation'])
    await payButton(page).click()

    await expect(page.locator('#participant-1-guardianEmail')).toBeFocused()
    await expect(page.getByText('Adresse email invalide.')).toBeVisible()
    expect(capture.paymentIntentBody()).toBeNull()
  })

  test('a 15 year old is refused even when the event admits minors', async ({ page }) => {
    const capture = await openCheckout(page)

    await fillParticipant(page, 1, { ...LEA, birthDate: '2015-01-01', guardian: undefined })
    await signWaiver(page)
    await payButton(page).click()

    await expect(page.getByText("Il faut avoir 16 ans le jour de l'événement.")).toBeVisible()
    expect(capture.paymentIntentBody()).toBeNull()
  })

  test('the second of two minors under 16 stops the whole order', async ({ page }) => {
    const capture = await openCheckout(page, 2)

    await fillParticipant(page, 1, LEA)
    await fillParticipant(page, 2, { ...NOE, birthDate: '2016-01-01', guardian: undefined })
    await signWaiver(page)
    await attest(page, ['group-attestation', 'minor-attestation'])
    await payButton(page).click()

    await expect(page.getByText("Il faut avoir 16 ans le jour de l'événement.")).toBeVisible()
    expect(capture.paymentIntentBody()).toBeNull()
  })

  test('an event limited to adults refuses a 17 year old', async ({ page }) => {
    const capture = await openCheckout(page, 1, 18)

    await fillParticipant(page, 1, { ...LEA, guardian: undefined })
    await signWaiver(page)
    await payButton(page).click()

    await expect(page.getByText("Il faut avoir 18 ans le jour de l'événement.")).toBeVisible()
    await expect(page.locator('#minor-attestation')).toHaveCount(0)
    expect(capture.paymentIntentBody()).toBeNull()
  })
})
