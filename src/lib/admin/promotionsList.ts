import { z } from 'zod'
export const promotionSortSchema = z.enum(['starts_at', 'ends_at', 'created_at', 'title'])
export const promotionDirectionSchema = z.enum(['asc', 'desc'])
const cursorSchema = z.object({ sort: promotionSortSchema, direction: promotionDirectionSchema, id: z.string().uuid() })
export type PromotionSort = z.infer<typeof promotionSortSchema>; export type PromotionDirection = z.infer<typeof promotionDirectionSchema>
export const encodePromotionCursor = (value: z.infer<typeof cursorSchema>) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
export function decodePromotionCursor(value: string, sort: PromotionSort, direction: PromotionDirection) { let decoded: unknown; try { decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) } catch { throw new Error('Cursor de pagination invalide') }; const parsed = cursorSchema.safeParse(decoded); if (!parsed.success || parsed.data.sort !== sort || parsed.data.direction !== direction) throw new Error('Cursor de pagination incompatible'); return parsed.data }
export const sanitizePromotionSearch = (value: string) => value.replace(/[%,()._]/g, ' ').replace(/\s+/g, ' ').trim()
