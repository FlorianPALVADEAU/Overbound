import { z } from 'zod'
import { isOpenFormatTicket, isRankedFormatTicket } from '@/lib/openSas'

export const participantSortSchema = z.enum(['created_at', 'email'])
export type ParticipantSort = z.infer<typeof participantSortSchema>

const cursorSchema = z.object({
  sort: participantSortSchema,
  id: z.string().uuid(),
})

export type ParticipantsCursor = z.infer<typeof cursorSchema>

export function encodeParticipantsCursor(cursor: ParticipantsCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

export function decodeParticipantsCursor(
  cursor: string,
  expectedSort: ParticipantSort,
): ParticipantsCursor {
  try {
    const parsed = cursorSchema.parse(
      JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
    )

    if (parsed.sort !== expectedSort) {
      throw new Error('Cursor incompatible avec le tri demandé')
    }

    return parsed
  } catch (error) {
    if (error instanceof Error && error.message === 'Cursor incompatible avec le tri demandé') {
      throw error
    }
    throw new Error('Cursor de pagination invalide')
  }
}

export function getParticipantFormat(
  ticketName: string | null | undefined,
  raceName: string | null | undefined,
): 'OPEN' | 'RANKED' | '—' {
  if (isOpenFormatTicket(ticketName, raceName)) return 'OPEN'
  if (isRankedFormatTicket(ticketName, raceName)) return 'RANKED'
  return '—'
}
