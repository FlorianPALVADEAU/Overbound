import { z } from 'zod'

export const adminUserSortSchema = z.enum(['created_at', 'last_sign_in_at', 'full_name', 'email', 'role'])
export const adminUserDirectionSchema = z.enum(['asc', 'desc'])
export type AdminUserSort = z.infer<typeof adminUserSortSchema>
export type AdminUserDirection = z.infer<typeof adminUserDirectionSchema>

const cursorSchema = z.object({
  sort: adminUserSortSchema,
  direction: adminUserDirectionSchema,
  id: z.string().uuid(),
})

export function encodeAdminUsersCursor(value: z.infer<typeof cursorSchema>) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

export function decodeAdminUsersCursor(value: string, sort: AdminUserSort, direction: AdminUserDirection) {
  let decoded: unknown
  try {
    decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
  } catch {
    throw new Error('Cursor de pagination invalide')
  }
  const parsed = cursorSchema.safeParse(decoded)
  if (!parsed.success || parsed.data.sort !== sort || parsed.data.direction !== direction) {
    throw new Error('Cursor de pagination incompatible')
  }
  return parsed.data
}

export const sanitizeAdminUserSearch = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
