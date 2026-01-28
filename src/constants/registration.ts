import type { StepKey } from '@/components/registration/types'

export const REGISTRATION_STORAGE_KEY = 'overbound-registration-cart'
export const REGULATION_VERSION = '2024-01'
export const DEFAULT_TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export const REGISTRATION_STEPS: Array<{ id: StepKey; title: string; description: string }> = [
  { id: 'tickets', title: 'Billets', description: 'Choisissez les formats et quantités souhaités.' },
  { id: 'participants', title: 'Participants', description: 'Renseignez les informations pour chaque coureur.' },
  { id: 'options', title: 'Options', description: 'Ajoutez des extras et des codes promotionnels.' },
  { id: 'confirmation', title: 'Confirmation', description: 'Validez la décharge et procédez au paiement.' },
]
