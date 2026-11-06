export interface ParticipantCsvRow {
  id: string
  name: string | null
  email: string
  ticketName: string | null
  /** Null when the sex was never recorded. */
  sex: string | null
  waveIndex: number | null
  startTime: string | null
  group: string | null
  checkedIn: boolean
  cancelledAt: string | null
  paymentStatus: string | null
  amountCents: number | null
  currency: string | null
  createdAt: string
}

const HEADER = [
  'inscription',
  'nom',
  'email',
  'billet',
  'sexe',
  'sas',
  'depart',
  'groupe',
  'check_in',
  'statut',
  'paiement',
  'montant',
  'devise',
  'inscrit_le',
]

// A cell opening with these characters is read as a formula by spreadsheets.
const FORMULA_START = /^[=+\-@\t\r]/

const cell = (value: string | number | null): string => {
  const text = value === null ? '' : String(value)
  const safe = FORMULA_START.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

const amount = (cents: number | null) => (cents === null ? null : (cents / 100).toFixed(2))

/** One line per registration, in the filters' order. Cancelled bibs stay listed with their status. */
export const toParticipantsCsv = (rows: ParticipantCsvRow[]): string =>
  [
    HEADER.join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.name,
        row.email,
        row.ticketName,
        row.sex,
        row.waveIndex,
        row.startTime,
        row.group,
        row.checkedIn ? 'oui' : 'non',
        row.cancelledAt ? 'annulée' : 'active',
        row.paymentStatus,
        amount(row.amountCents),
        row.currency?.toUpperCase() ?? null,
        row.createdAt,
      ]
        .map(cell)
        .join(','),
    ),
  ].join('\n')
