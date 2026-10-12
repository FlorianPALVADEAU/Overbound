import { useCallback, useState } from 'react'

export interface CheckoutConsents {
  disclaimerRead: boolean
  disclaimerAccepted: boolean
  rulebookAccepted: boolean
  /** A buyer registering other people vouches for their acceptance (porte-fort, art. 1204 C. civ.). */
  groupAttestation: boolean
  signatureImage: string | null
  /** When the current signature was drawn. */
  signedAt: string | null
}

const UNSIGNED: CheckoutConsents = {
  disclaimerRead: false,
  disclaimerAccepted: false,
  rulebookAccepted: false,
  groupAttestation: false,
  signatureImage: null,
  signedAt: null,
}

/** Waiver, rulebook and signature of the checkout. Never restored from a draft: signed again each session. */
export function useCheckoutConsents() {
  const [consents, setConsents] = useState<CheckoutConsents>(UNSIGNED)

  const setConsent = useCallback(
    (field: 'disclaimerRead' | 'disclaimerAccepted' | 'rulebookAccepted' | 'groupAttestation') => (checked: boolean) =>
      setConsents((previous) => ({ ...previous, [field]: checked })),
    [],
  )

  const setSignature = useCallback((image: string | null) => {
    setConsents((previous) => ({ ...previous, signatureImage: image, signedAt: image ? new Date().toISOString() : null }))
  }, [])

  return { consents, setConsent, setSignature }
}
