import { describe, expect, it } from 'vitest'
import { toParticipantsCsv, type ParticipantCsvRow } from './participantsCsv'

const row = (patch: Partial<ParticipantCsvRow> = {}): ParticipantCsvRow => ({
  id: 'reg-1',
  name: 'Ana Martin',
  email: 'ana@example.com',
  ticketName: 'Ranked',
  waveIndex: 3,
  startTime: '2027-09-12T08:00:00Z',
  group: 'Acme',
  checkedIn: false,
  cancelledAt: null,
  paymentStatus: 'paid',
  amountCents: 5500,
  currency: 'eur',
  createdAt: '2027-01-02T10:00:00Z',
  ...patch,
})

describe('toParticipantsCsv', () => {
  it('writes a header and one line per registration', () => {
    const lines = toParticipantsCsv([row(), row({ id: 'reg-2' })]).split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('inscription,nom,email,billet,sas,depart,groupe,check_in,statut,paiement,montant,devise,inscrit_le')
    expect(lines[1]).toContain('"55.00","EUR"')
  })

  it('marks cancelled and checked-in bibs', () => {
    const csv = toParticipantsCsv([row({ cancelledAt: '2027-02-01T00:00:00Z', checkedIn: true })])
    expect(csv).toContain('"oui","annulée"')
  })

  it('leaves missing values empty', () => {
    const csv = toParticipantsCsv([row({ name: null, waveIndex: null, amountCents: null, currency: null })])
    expect(csv.split('\n')[1]).toContain('"","ana@example.com"')
  })

  it('neutralises a name that a spreadsheet would run as a formula', () => {
    const csv = toParticipantsCsv([row({ name: '=HYPERLINK("http://evil")' })])
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`)
  })

  it('escapes quotes and commas', () => {
    const csv = toParticipantsCsv([row({ group: 'Acme, "Team"' })])
    expect(csv).toContain('"Acme, ""Team"""')
  })
})
