export interface TshirtExportRow {
  email: string
  bibNumber: number | null
  ticketName: string | null
  /** Null when the participant has not (or not yet) chosen a size. */
  size: string | null
}

const HEADER = ['dossard', 'email', 'billet', 'taille']

// A cell opening with these characters is read as a formula by spreadsheets.
const FORMULA_START = /^[=+\-@\t\r]/

const cell = (value: string | number | null): string => {
  const text = value === null ? '' : String(value)
  return JSON.stringify(FORMULA_START.test(text) ? `'${text}` : text)
}

/** Packing list for the free T-shirts: one line per winner, missing sizes left empty to chase. */
export const toTshirtCsv = (rows: TshirtExportRow[]): string =>
  [HEADER.join(','), ...rows.map((row) => [row.bibNumber, row.email, row.ticketName, row.size].map(cell).join(','))].join('\n')

/** Sizes to order: count per size among winners who chose one. */
export const countBySize = (rows: TshirtExportRow[]): Record<string, number> =>
  rows.reduce<Record<string, number>>((counts, row) => {
    if (row.size) counts[row.size] = (counts[row.size] ?? 0) + 1
    return counts
  }, {})
