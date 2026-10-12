import Link from 'next/link'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { PaymentBlock } from '@/lib/checkout/paymentReadiness'

const MESSAGES: Record<PaymentBlock, string> = {
  NO_DRAFT: "Aucune inscription en cours. Reviens à la page d'inscription pour choisir tes billets.",
  NO_PAYMENT_INTENT: 'Ton paiement a expiré. Reviens à l’inscription : tes informations sont conservées.',
  NOT_SIGNED: 'La signature, la décharge et le règlement officiel doivent être acceptés avant de payer.',
}

/** Why the payment page cannot take money, with the way back to the checkout. */
export default function PaymentBlocked({ block, eventSlug }: { block: PaymentBlock; eventSlug: string }) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{MESSAGES[block]}</AlertDescription>
      </Alert>
      <Button asChild variant="outline">
        <Link href={`/events/${eventSlug}/register`}>
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
          Retour à l&apos;inscription
        </Link>
      </Button>
    </div>
  )
}
