import { SHIFTS, SHIFT_SHEET_TITLES, type Shift } from '../../shared/Shift'
import type { Assignment } from './Assignment'
import type { ZoneCatalog } from './Zone'

export interface ShiftBlock {
  shift: Shift
  title: string
  // Une colonne par zone, dans l’ordre du catalogue.
  header: string[]
  // Une ligne par RESP, puis une par AIDE, puis les bénévoles.
  rows: string[][]
  leadRowCount: number
}

// Le planning tel qu’envoyé aux bénévoles : un bloc par créneau, une colonne par zone.
export class PlanningSheet {
  constructor(private readonly zones: ZoneCatalog) {}

  blocks(assignments: readonly Assignment[]): ShiftBlock[] {
    return SHIFTS.map((shift) => this.blockFor(shift, assignments))
  }

  private blockFor(shift: Shift, assignments: readonly Assignment[]): ShiftBlock {
    const columns = this.zones.all().map((zone) => {
      const people = assignments
        .filter((a) => a.shift === shift && a.zoneKey === zone.key)
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'))
      return {
        resp: people.filter((a) => a.role === 'resp').map((a) => `RESP - ${a.displayName}`),
        aide: people.filter((a) => a.role === 'aide').map((a) => `AIDE - ${a.displayName}`),
        members: people.filter((a) => a.role === 'member').map((a) => a.displayName),
      }
    })

    const longest = (key: 'resp' | 'aide' | 'members') => Math.max(0, ...columns.map((column) => column[key].length))
    const rowsOf = (key: 'resp' | 'aide' | 'members') =>
      Array.from({ length: longest(key) }, (_, index) => columns.map((column) => column[key][index] ?? ''))

    const resp = rowsOf('resp')
    const aide = rowsOf('aide')

    return {
      shift,
      title: SHIFT_SHEET_TITLES[shift],
      header: this.zones.all().map((zone) => zone.label),
      rows: [...resp, ...aide, ...rowsOf('members')],
      leadRowCount: resp.length + aide.length,
    }
  }
}
