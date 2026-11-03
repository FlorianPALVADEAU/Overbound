import { z } from 'zod'

/** Keyset position of a list sorted by `created_at desc, id desc`. */
export const keysetCursorSchema = z.object({ createdAt: z.string().min(1), id: z.string().uuid() })
export type KeysetCursor = z.infer<typeof keysetCursorSchema>

export const encodeKeysetCursor = (cursor: KeysetCursor) => Buffer.from(JSON.stringify(cursor)).toString('base64url')

export function decodeKeysetCursor(value: string): KeysetCursor {
  try {
    const parsed = keysetCursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')))
    if (Number.isNaN(Date.parse(parsed.createdAt))) throw new Error('date')
    return parsed
  } catch {
    throw new Error('Cursor de pagination invalide')
  }
}

/** PostgREST `or()` filter selecting the rows strictly after the cursor. */
export const keysetAfterFilter = (cursor: KeysetCursor) =>
  `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt.${cursor.id})`
