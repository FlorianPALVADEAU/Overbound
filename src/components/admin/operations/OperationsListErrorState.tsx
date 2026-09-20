import { Button } from '@/components/ui/button'

interface OperationsListErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function OperationsListErrorState({
  message = 'Impossible de charger cette liste.',
  onRetry,
}: OperationsListErrorStateProps) {
  return (
    <div role="alert" className="flex min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? <Button variant="outline" size="sm" onClick={onRetry}>Réessayer</Button> : null}
    </div>
  )
}
