import { describe, expect, it } from 'vitest'
import { renderEmail } from '@/lib/email/render'
import TicketEmail, { type TicketEmailProps } from './TicketEmail'

const base: TicketEmailProps = {
  participantName: 'Alex Runner',
  eventTitle: 'Overbound Race 2027',
  eventDate: 'samedi 24 avril 2027',
  eventLocation: 'Île de loisirs de Saint-Quentin-en-Yvelines',
  ticketName: 'Primal OPEN',
  startTime: '10h30',
  waveIndex: 15,
  bibNumber: 128,
  qrUrl: 'https://cdn.example/qr-abc.png',
  manageUrl: 'https://overbound-race.com/account/tickets?ticket=1',
}

describe('TicketEmail', () => {
  it('shows the QR code image, the holder name and the nominative warning', async () => {
    const html = await renderEmail(TicketEmail(base))

    expect(html).toContain('src="https://cdn.example/qr-abc.png"')
    expect(html).toContain('ALEX RUNNER')
    expect(html).toMatch(/Ce billet est au nom de Alex Runner/)
    expect(html).toMatch(/pièce d’identité doit porter le même nom/)
  })

  it('asks for the PPS and warns that departure is refused without it', async () => {
    const html = await renderEmail(TicketEmail(base))

    expect(html).toMatch(/Pass Prévention Santé/)
    expect(html).toMatch(/le départ est refusé/)
  })

  it('tells a participant aged 16 or 17 which papers to bring instead of the PPS', async () => {
    const html = await renderEmail(TicketEmail({ ...base, isMinor: true }))

    expect(html).toMatch(/autorisation parentale/)
    expect(html).toMatch(/questionnaire de santé pour mineurs/)
    expect(html).toMatch(/adulte référent/)
    expect(html).toMatch(/Sans ces papiers, tu ne pars pas/)
    expect(html).not.toMatch(/Sans PPS ou licence/)
    expect(html).toMatch(/le départ est refusé/)
  })

  it('keeps the adult wording when the participant is not a minor', async () => {
    const html = await renderEmail(TicketEmail({ ...base, isMinor: false }))

    expect(html).not.toMatch(/autorisation parentale/)
    expect(html).toMatch(/Sans PPS ou licence/)
  })

  it('omits departure, SAS and bib rows when they are not assigned yet', async () => {
    const html = await renderEmail(TicketEmail({ ...base, startTime: null, waveIndex: null, bibNumber: null }))

    expect(html).not.toContain('Heure de départ')
    expect(html).not.toContain('SAS de départ</td>')
    expect(html).not.toContain('Dossard')
  })

  it('does not greet an email address as a first name', async () => {
    const html = await renderEmail(TicketEmail({ ...base, participantName: 'alex@example.com' }))

    expect(html).not.toMatch(/alex@example\.com, tu es/)
    expect(html).toContain('Tu es inscrit·e')
  })
})
