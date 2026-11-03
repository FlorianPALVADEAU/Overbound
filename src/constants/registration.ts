import type { StepKey } from '@/components/registration/types'

export const REGISTRATION_STORAGE_KEY = 'overbound-registration-cart'
/** Version of the waiver in `./waiver.ts`; bump it whenever that wording changes. */
export const REGULATION_VERSION = '2026-11-a'
export const OFFICIAL_RULEBOOK_PDF_PATH = '/documents/reglementation-officielle-overbound-2027.pdf'
/** Paper form for participants aged 16 or 17, signed at bib pickup. Served as a static file. */
export const PARENTAL_AUTHORIZATION_PDF_PATH = '/documents/autorisation-parentale.pdf'
export const DEFAULT_TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const REGISTRATION_STEPS: Array<{ id: StepKey; title: string; description: string }> = [
  { id: 'tickets', title: 'Billets', description: 'Choisissez les formats et quantités souhaités.' },
  { id: 'participants', title: 'Participants', description: 'Renseignez les informations pour chaque coureur.' },
  { id: 'options', title: 'Options', description: 'Ajoutez des extras et des codes promotionnels.' },
  { id: 'confirmation', title: 'Confirmation', description: 'Validez la décharge et procédez au paiement.' },
]
