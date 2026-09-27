import { z } from 'zod'

export const ticketSortSchema = z.enum(['created_at', 'name', 'final_price_cents'])
export type TicketSort = z.infer<typeof ticketSortSchema>

export const ticketDirectionSchema = z.enum(['asc', 'desc'])
export type TicketDirection = z.infer<typeof ticketDirectionSchema>

const cursorSchema = z.object({
  organizationId: z.string().uuid(),
  eventId: z.string().uuid().nullable(),
  query: z.string(),
  sort: ticketSortSchema,
  direction: ticketDirectionSchema,
  id: z.string().uuid(),
})

export type TicketsCursor = z.infer<typeof cursorSchema>

export function encodeTicketsCursor(cursor: TicketsCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

export function decodeTicketsCursor(
  cursor: string,
  expected: Pick<TicketsCursor, 'organizationId' | 'eventId' | 'query' | 'sort' | 'direction'>,
): TicketsCursor {
  try {
    const parsed = cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
    )
    if (
      parsed.organizationId !== expected.organizationId ||
      parsed.eventId !== expected.eventId ||
      parsed.query !== expected.query ||
      parsed.sort !== expected.sort ||
      parsed.direction !== expected.direction
    ) {
      throw new Error('Cursor incompatible avec les filtres demandés')
    }
    return parsed
  } catch (error) {
    if (error instanceof Error && error.message === 'Cursor incompatible avec les filtres demandés') {
      throw error
    }
    throw new Error('Cursor de pagination invalide')
  }
}
