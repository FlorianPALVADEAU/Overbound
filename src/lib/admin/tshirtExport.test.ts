import { describe, expect, it } from 'vitest'
import { countBySize, toTshirtCsv } from './tshirtExport'

const rows = [
  { email: 'a@x.fr', bibNumber: 12, ticketName: 'RANKED', size: 'M' },
  { email: '=cmd@x.fr', bibNumber: null, ticketName: null, size: null },
  { email: 'c@x.fr', bibNumber: 3, ticketName: 'OPEN', size: 'M' },
]

describe('toTshirtCsv', () => {
  it('writes a header and one line per winner, empty cell for a missing size', () => {
    const lines = toTshirtCsv(rows).split('\n')
    expect(lines[0]).toBe('dossard,email,billet,taille')
    expect(lines[1]).toBe('"12","a@x.fr","RANKED","M"')
    expect(lines[2]).toBe(`"","'=cmd@x.fr","",""`)
  })
})

describe('countBySize', () => {
  it('counts chosen sizes and ignores missing ones', () => {
    expect(countBySize(rows)).toEqual({ M: 2 })
  })
})
