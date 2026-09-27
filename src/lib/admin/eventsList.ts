import { z } from 'zod'

export const adminEventSortSchema = z.enum(['date', 'created_at', 'title'])
export const adminEventDirectionSchema = z.enum(['asc', 'desc'])

export type AdminEventSort = z.infer<typeof adminEventSortSchema>
export type AdminEventDirection = z.infer<typeof adminEventDirectionSchema>

export interface AdminEventsCursor {
  sort: AdminEventSort
  direction: AdminEventDirection
  id: string
}

const cursorSchema = z.object({
  sort: adminEventSortSchema,
  direction: adminEventDirectionSchema,
  id: z.string().uuid(),
})

export function encodeAdminEventsCursor(cursor: AdminEventsCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeAdminEventsCursor(
  encoded: string,
  sort: AdminEventSort,
  direction: AdminEventDirection,
): AdminEventsCursor {
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    throw new Error('Cursor de pagination invalide')
  }

  const result = cursorSchema.safeParse(parsed)
  if (!result.success || result.data.sort !== sort || result.data.direction !== direction) {
    throw new Error('Cursor de pagination incompatible')
  }
  return result.data
}

export const sanitizeAdminEventSearch = (value: string) =>
  value.replace(/[%,()._]/g, ' ').replace(/\s+/g, ' ').trim()
