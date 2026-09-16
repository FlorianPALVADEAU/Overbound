import type { VariantProps } from 'class-variance-authority'
import type { badgeVariants } from '@/components/ui/badge'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

export const getEventStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'on_sale':
      return 'default'
    case 'sold_out':
      return 'destructive'
    case 'closed':
      return 'secondary'
    case 'draft':
      return 'outline'
    case 'announced':
      return 'secondary'
    default:
      return 'outline'
  }
}

export const getEventStatusLabel = (status: string): string => {
  switch (status) {
    case 'on_sale':
      return 'Inscriptions ouvertes'
    case 'sold_out':
      return 'Complet'
    case 'closed':
      return 'Inscriptions fermées'
    case 'draft':
      return 'Bientôt disponible'
    case 'announced':
      return 'Inscriptions à venir'
    default:
      return status
  }
}
