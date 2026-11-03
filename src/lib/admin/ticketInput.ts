import { z } from 'zod'
import type { TicketOperationsConfig } from '@/types/Ticket'

const optionalId = z
  .string()
  .nullish()
  .transform((value) => value || null)

/**
 * Body of a ticket update. Prices are cents; the form sends numbers, a numeric string is accepted too.
 * `operations_config` is an object validated deeper by the companion guard and the operations profile.
 */
export const ticketUpdateSchema = z.object({
  event_id: z.string().min(1, 'Événement obligatoire'),
  race_id: optionalId,
  name: z.string().trim().min(1, 'Le nom du billet est obligatoire'),
  description: z.string().nullish(),
  price: z.coerce.number().int('Le prix doit être un nombre entier de centimes').min(0, 'Le prix ne peut pas être négatif'),
  currency: z.string().min(1).optional(),
  max_participants: z.coerce.number().int().min(0, 'Le nombre de places ne peut pas être négatif').optional(),
  operations_config: z.record(z.string(), z.unknown()).nullish(),
})

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>

/** The config as the rest of the code reads it; its shape is checked where it is used. */
export const operationsConfigOf = (input: TicketUpdateInput): TicketOperationsConfig | null =>
  (input.operations_config ?? null) as TicketOperationsConfig | null
