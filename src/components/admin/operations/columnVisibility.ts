import { useCallback, useEffect, useState } from 'react'
import type { OperationsListColumn } from './types'

const STORAGE_PREFIX = 'overbound:admin:columns:'

type ColumnRef = Pick<OperationsListColumn<unknown>, 'id' | 'hiddenByDefault'>

export const defaultVisibleColumnIds = (columns: readonly ColumnRef[]): string[] =>
  columns.filter((column) => !column.hiddenByDefault).map((column) => column.id)

/**
 * Keeps the stored choice usable when a column was added or removed since it was saved.
 * Unknown ids are dropped; an empty result falls back to the defaults so a table is never blank.
 */
export const reconcileVisibleColumnIds = (columns: readonly ColumnRef[], stored: readonly string[] | null): string[] => {
  if (!stored) return defaultVisibleColumnIds(columns)
  const known = new Set(columns.map((column) => column.id))
  const kept = stored.filter((id) => known.has(id))
  return kept.length > 0 ? kept : defaultVisibleColumnIds(columns)
}

const readStored = (storageKey: string): string[] | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + storageKey)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string') ? parsed : null
  } catch {
    return null
  }
}

const writeStored = (storageKey: string, ids: readonly string[]) => {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(ids))
  } catch {
    // Private mode or full quota: the choice simply does not persist.
  }
}

/** Column choice owned by the list itself and remembered per list; a parent may still control it. */
export function useColumnVisibility(
  storageKey: string,
  columns: readonly ColumnRef[],
  controlled?: { value?: readonly string[]; onChange?: (ids: string[]) => void },
) {
  const [stored, setStored] = useState<string[] | null>(null)

  // Read after mount so the server render and the first client render agree.
  useEffect(() => {
    setStored(readStored(storageKey))
  }, [storageKey])

  const visibleColumnIds = controlled?.value ? [...controlled.value] : reconcileVisibleColumnIds(columns, stored)

  const setVisibleColumnIds = useCallback(
    (ids: string[]) => {
      if (controlled?.onChange) controlled.onChange(ids)
      if (!controlled?.value) setStored(ids)
      writeStored(storageKey, ids)
    },
    [controlled, storageKey],
  )

  return { visibleColumnIds, setVisibleColumnIds }
}
