import { describe, expect, it } from 'vitest'
import { defaultVisibleColumnIds, reconcileVisibleColumnIds } from './columnVisibility'

const columns = [
  { id: 'name' },
  { id: 'email' },
  { id: 'payment', hiddenByDefault: true },
]

describe('column visibility', () => {
  it('shows every column that is not hidden by default', () => {
    expect(defaultVisibleColumnIds(columns)).toEqual(['name', 'email'])
  })

  it('uses the defaults when nothing was stored', () => {
    expect(reconcileVisibleColumnIds(columns, null)).toEqual(['name', 'email'])
  })

  it('keeps a stored choice, including a column hidden by default', () => {
    expect(reconcileVisibleColumnIds(columns, ['name', 'payment'])).toEqual(['name', 'payment'])
  })

  it('drops ids of columns that no longer exist', () => {
    expect(reconcileVisibleColumnIds(columns, ['name', 'gone'])).toEqual(['name'])
  })

  it('falls back to the defaults rather than render a table without columns', () => {
    expect(reconcileVisibleColumnIds(columns, ['gone'])).toEqual(['name', 'email'])
  })
})
