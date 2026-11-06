import { z } from 'zod'
import { participantSexSchema } from './participantSex'

/**
 * Contract of POST /api/registrations/create, shared by the route that
 * validates it and the checkout that builds it: one definition, no drift.
 */
export const registrationParticipantSchema = z.object({
  ticketId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  birthDate: z.string().optional(),
  /** Required for the rankings; a missing value is refused by admission rules, an invalid one by this schema. */
  sex: participantSexSchema.optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  referentName: z.string().optional(),
  referentPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
  healthDataConsent: z.boolean().optional(),
  selectedWaveIndex: z.number().int().positive().nullable().optional(),
  tshirtSize: z.string().optional(),
})

export const createRegistrationRequestSchema = z.object({
  paymentIntentId: z.string(),
  eventId: z.string(),
  userId: z.string(),
  ticketSelections: z.array(z.object({ ticketId: z.string(), quantity: z.number() })).default([]),
  participants: z.array(registrationParticipantSchema).default([]),
  upsells: z
    .array(z.object({ upsellId: z.string(), quantity: z.number(), meta: z.record(z.string(), z.any()).optional() }))
    .default([]),
  promoCode: z.string().nullable().default(null),
  promoCodes: z.array(z.string()).default([]),
  ambassadorReferralCode: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  signatureImage: z.string().nullable().default(null),
  signatureMetadata: z.record(z.string(), z.any()).default({}),
  disclaimer: z
    .object({
      read: z.boolean(),
      accepted: z.boolean(),
      rulebookAccepted: z.boolean().optional(),
      groupAttestation: z.boolean().optional(),
      minorAttestation: z.boolean().optional(),
    })
    .default({ read: false, accepted: false, rulebookAccepted: false }),
  freeOrderMetadata: z.record(z.string(), z.string()).nullable().optional(),
})

export type CreateRegistrationRequest = z.input<typeof createRegistrationRequestSchema>
