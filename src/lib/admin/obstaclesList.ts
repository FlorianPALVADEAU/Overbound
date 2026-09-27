import { z } from 'zod'

export const adminObstacleSortSchema = z.enum(['created_at', 'updated_at', 'name', 'difficulty'])
export const adminObstacleDirectionSchema = z.enum(['asc', 'desc'])
export type AdminObstacleSort = z.infer<typeof adminObstacleSortSchema>
export type AdminObstacleDirection = z.infer<typeof adminObstacleDirectionSchema>

const cursorSchema = z.object({ sort: adminObstacleSortSchema, direction: adminObstacleDirectionSchema, id: z.string().uuid() })
export type AdminObstacleCursor = z.infer<typeof cursorSchema>

export const encodeAdminObstaclesCursor = (cursor: AdminObstacleCursor) => Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')

export function decodeAdminObstaclesCursor(value: string, sort: AdminObstacleSort, direction: AdminObstacleDirection) {
  let decoded: unknown
  try { decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) } catch { throw new Error('Cursor de pagination invalide') }
  const parsed = cursorSchema.safeParse(decoded)
  if (!parsed.success || parsed.data.sort !== sort || parsed.data.direction !== direction) throw new Error('Cursor de pagination incompatible')
  return parsed.data
}

export const sanitizeAdminObstacleSearch = (value: string) => value.replace(/[%,()._]/g, ' ').replace(/\s+/g, ' ').trim()
