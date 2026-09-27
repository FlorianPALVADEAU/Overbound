import { z } from 'zod'

export const promoSortSchema = z.enum(['created_at', 'valid_from', 'valid_until', 'code', 'name'])
export const promoDirectionSchema = z.enum(['asc', 'desc'])
const cursorSchema = z.object({ sort: promoSortSchema, direction: promoDirectionSchema, id: z.string().uuid() })
export type PromoSort = z.infer<typeof promoSortSchema>
export type PromoDirection = z.infer<typeof promoDirectionSchema>
export const encodePromoCursor = (value: z.infer<typeof cursorSchema>) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
export function decodePromoCursor(value: string, sort: PromoSort, direction: PromoDirection) { let decoded: unknown; try { decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) } catch { throw new Error('Cursor de pagination invalide') }; const parsed = cursorSchema.safeParse(decoded); if (!parsed.success || parsed.data.sort !== sort || parsed.data.direction !== direction) throw new Error('Cursor de pagination incompatible'); return parsed.data }
export const sanitizePromoSearch = (value: string) => value.replace(/[%,()._]/g, ' ').replace(/\s+/g, ' ').trim()
