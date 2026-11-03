import { z } from 'zod'

/**
 * What a volunteer confirms at the bib desk for a minor, one tick per paper. Each is the literal `true`:
 * a partial check is not a check, so the schema refuses anything else.
 */
export const minorPapersChecksSchema = z.object({
  authorizationSigned: z.literal(true),
  identityChecked: z.literal(true),
  referentIdentified: z.literal(true),
  healthAttestationSeen: z.literal(true),
})

export type MinorPapersChecks = z.infer<typeof minorPapersChecksSchema>

export const MINOR_PAPERS_REQUIRED_MESSAGE =
  "Mineur : contrôle des papiers requis avant le départ (autorisation parentale signée, pièce d'identité, adulte référent, attestation de santé)."

export type MinorPapersDecision = 'not_a_minor' | 'already_verified' | 'verify_now' | 'papers_required'

/** Whether a check-in may go ahead: adults always, a minor only once their papers were controlled. */
export const decideMinorPapers = (input: {
  isMinor: boolean
  verifiedAt: string | null | undefined
  checks: MinorPapersChecks | undefined
}): MinorPapersDecision => {
  if (!input.isMinor) return 'not_a_minor'
  if (input.verifiedAt) return 'already_verified'
  return input.checks ? 'verify_now' : 'papers_required'
}
