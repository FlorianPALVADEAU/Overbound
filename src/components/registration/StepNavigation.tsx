import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { REGISTRATION_STEPS } from '@/constants/registration'

interface StepNavigationProps {
  stepIndex: number
  eventId: string
  isCreatingPaymentIntent: boolean
  isAuthPending?: boolean
  submissionMessage: { type: 'error' | 'success'; text: string } | null
  onNext: () => void
  onPrevious: () => void
  onPayment: () => void
}

export default function StepNavigation({
  stepIndex,
  eventId,
  isCreatingPaymentIntent,
  isAuthPending = false,
  submissionMessage,
  onNext,
  onPrevious,
  onPayment,
}: StepNavigationProps) {
  return (
    <>
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        {stepIndex === 0 ? (
          <Button asChild variant="outline">
            <Link href={`/events/${eventId}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Retour à l'événement
            </Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={onPrevious}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Précédent
          </Button>
        )}

        {stepIndex < REGISTRATION_STEPS.length - 1 ? (
          <Button onClick={onNext}>
            Suivant
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onPayment}
            disabled={isCreatingPaymentIntent || isAuthPending}
          >
            {isCreatingPaymentIntent ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Préparation du paiement...
              </>
            ) : (
              'Procéder au paiement sécurisé'
            )}
          </Button>
        )}
      </div>

      {submissionMessage ? (
        <Alert variant={submissionMessage.type === 'success' ? 'default' : 'destructive'}>
          {submissionMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{submissionMessage.text}</AlertDescription>
        </Alert>
      ) : null}
    </>
  )
}
