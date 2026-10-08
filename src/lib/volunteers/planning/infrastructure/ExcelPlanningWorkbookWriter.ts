import ExcelJS from 'exceljs'
import type { PlanningWorkbookWriter } from '../application/ports'
import type { ShiftBlock } from '../domain/PlanningSheet'

const TITLE_FILL = 'FF1F7A1F'
const HEADER_FILL = 'FFE8F3E8'
const COLUMN_WIDTH = 24

export class ExcelPlanningWorkbookWriter implements PlanningWorkbookWriter {
  async write(title: string, blocks: readonly ShiftBlock[]): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Planning')

    sheet.addRow([title]).font = { bold: true, size: 16 }
    this.addBlankRows(sheet, 2)

    blocks.forEach((block, index) => {
      if (index > 0) this.addBlankRows(sheet, 3)
      this.addBlock(sheet, block)
    })

    sheet.columns.forEach((column) => {
      column.width = COLUMN_WIDTH
    })

    return new Uint8Array(await workbook.xlsx.writeBuffer())
  }

  private addBlock(sheet: ExcelJS.Worksheet, block: ShiftBlock): void {
    const titleRow = sheet.addRow([block.title])
    titleRow.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
    sheet.mergeCells(titleRow.number, 1, titleRow.number, block.header.length)
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_FILL } }

    const headerRow = sheet.addRow(block.header)
    headerRow.font = { bold: true }
    headerRow.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' }
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
      cell.border = { bottom: { style: 'thin' } }
    })

    block.rows.forEach((values, index) => {
      const row = sheet.addRow(values)
      if (index < block.leadRowCount) row.font = { bold: true }
    })
  }

  private addBlankRows(sheet: ExcelJS.Worksheet, count: number): void {
    for (let i = 0; i < count; i++) sheet.addRow([])
  }
}
