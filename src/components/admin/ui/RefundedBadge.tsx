import { Badge } from '@/components/ui/badge'

/** Shown wherever an admin lists a bib that was cancelled and refunded. Renders nothing otherwise. */
export function RefundedBadge({ cancelledAt }: { cancelledAt: string | null | undefined }) {
  if (!cancelledAt) return null
  return (
    <Badge variant="destructive" title={`Billet annulé et remboursé le ${new Date(cancelledAt).toLocaleDateString('fr-FR')}`}>
      Remboursé
    </Badge>
  )
}
