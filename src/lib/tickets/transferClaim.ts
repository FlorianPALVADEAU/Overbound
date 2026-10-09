import { z } from 'zod'
import { computeAge } from '@/lib/account/participant'
import { keepHealthDataWithConsent } from '@/lib/legal/healthData'
import type { SignedDocumentReference } from '@/lib/legal/waiverDocument'

export const MINIMUM_PARTICIPANT_AGE = 18

const requiredText = (max: number) => z.string().trim().min(1).max(max)

/**
 * What the new holder of a transferred bib must provide: the same identity,
 * medical-contact data and signed waiver the original buyer gave at checkout.
 */
export const claimSubmissionSchema = z.object({
  token: z.string().min(1),
  participant: z.object({
    firstName: requiredText(100),
    lastName: requiredText(100),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    emergencyContactName: requiredText(150),
    emergencyContactPhone: requiredText(40),
    medicalInfo: z.string().trim().max(1000).default(''),
    healthDataConsent: z.boolean().default(false),
  }),
  signatureImage: z.string().min(1).max(2_000_000),
  signatureMetadata: z.object({ regulationVersion: z.string().optional(), signedAt: z.string().optional() }).default({}),
  disclaimer: z.object({
    read: z.literal(true),
    accepted: z.literal(true),
    rulebookAccepted: z.literal(true),
  }),
})

export type ClaimSubmission = z.infer<typeof claimSubmissionSchema>

export const isAdultAt = (birthDate: string, now: Date) => {
  const age = computeAge(birthDate, now)
  return age !== null && age >= MINIMUM_PARTICIPANT_AGE
}

interface HandOverContext {
  newHolderId: string
  newHolderEmail: string | null | undefined
  previousHolderId: string | null
  newQrToken: string
}

/**
 * Registration fields rewritten when the bib changes hands. The QR token is
 * replaced so a screenshot kept by the previous holder no longer checks in.
 */
export const buildHandOverUpdate = (context: HandOverContext) => ({
  user_id: context.newHolderId,
  email: context.newHolderEmail,
  qr_code_token: context.newQrToken,
  transfer_token: null,
  claim_status: 'claimed' as const,
  is_affiliated: true,
  guarantor_user_id: context.previousHolderId,
})

interface SignatureContext {
  registrationId: string
  signerUserId: string
  signerEmail: string | null | undefined
  previousHolderId: string | null
  ipAddress: string | null
  userAgent: string | null
  now: Date
  document: SignedDocumentReference
}

/** Row stored next to the buyer's original waiver; the shape of `signature_data` matches the checkout one. */
export const buildTransferSignatureRecord = (submission: ClaimSubmission, context: SignatureContext) => ({
  registration_id: context.registrationId,
  context: 'transfer' as const,
  signer_user_id: context.signerUserId,
  regulation_version: context.document.version,
  signed_at: context.now.toISOString(),
  ip_address: context.ipAddress,
  user_agent: context.userAgent,
  signature_data: JSON.stringify({
    imageDataUrl: submission.signatureImage,
    participant: {
      ...submission.participant,
      medicalInfo: keepHealthDataWithConsent(submission.participant.medicalInfo, submission.participant.healthDataConsent),
      email: context.signerEmail ?? '',
      licenseNumber: '',
    },
    disclaimer: submission.disclaimer,
    document: context.document,
    transfer: { previousHolderId: context.previousHolderId },
  }),
})
