import { createHash } from 'node:crypto'
import { REGULATION_VERSION } from '@/constants/registration'
import { WAIVER_PLAIN_TEXT } from '@/constants/waiver'

export interface SignedDocumentReference {
  version: string
  sha256: string
}

/**
 * Identifies the exact waiver wording a participant signed. The version alone is
 * not proof: the hash changes as soon as one word of the text changes.
 */
export const fingerprintWaiver = (
  text: string = WAIVER_PLAIN_TEXT,
  version: string = REGULATION_VERSION,
): SignedDocumentReference => ({
  version,
  sha256: createHash('sha256').update(`${version}\n${text}`, 'utf8').digest('hex'),
})
