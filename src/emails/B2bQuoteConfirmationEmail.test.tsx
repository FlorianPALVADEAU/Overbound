import { describe, expect, it } from 'vitest'
import { renderEmail } from '@/lib/email/render'
import { B2bQuoteConfirmationEmail } from './B2bQuoteConfirmationEmail'

const render = (props: Partial<Parameters<typeof B2bQuoteConfirmationEmail>[0]> = {}) =>
  renderEmail(
    B2bQuoteConfirmationEmail({
      contactName: 'Claire Martin',
      companyName: 'Acme',
      teamSizeLabel: '10-19',
      projectTypeLabel: 'Billets pour mon équipe',
      ...props,
    }),
  )

describe('B2bQuoteConfirmationEmail', () => {
  it('greets by first name and recaps the request', async () => {
    const html = await render()
    expect(html).toContain('Merci Claire')
    expect(html).toContain('Acme')
    expect(html).toContain('10-19 personnes')
    expect(html).toContain('Billets pour mon équipe')
  })

  it('shows the group discount grid read from the checkout engine', async () => {
    const html = await render()
    expect(html).toMatch(/-10 %/)
    expect(html).toMatch(/-20 %/)
    expect(html).toContain('toutes taxes comprises')
  })

  it('states what the team must prepare, without promising a free refund or transfer', async () => {
    const html = await render()
    expect(html).toContain('Pass Prévention Santé')
    expect(html).toContain('8h00')
    expect(html).toMatch(/n’est pas remboursable/)
    expect(html).toMatch(/6,99/)
    expect(html).not.toMatch(/gratuit/i)
  })

  it('keeps the edition window passed in and never prints a date nobody announced', async () => {
    expect(await render()).toContain('entre avril et juin 2027')
    expect(await render({ editionWindow: 'le 7 février 2027', editionStatus: 'Lieu : Parc.' })).toContain('le 7 février 2027')
    expect(await render()).not.toContain('24 avril')
  })

  it('links to the enterprise page with tracking and an alt text on the photo', async () => {
    const html = await render()
    expect(html).toContain('/entreprises?utm_source=email')
    expect(html).toMatch(/<img[^>]+alt="Des participants portent des troncs/)
  })
})
