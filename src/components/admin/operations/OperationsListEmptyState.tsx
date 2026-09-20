import type { ReactNode } from 'react'

interface OperationsListEmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function OperationsListEmptyState({
  title = 'Aucun résultat',
  description = 'Modifiez votre recherche ou vos filtres, puis réessayez.',
  action,
}: OperationsListEmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
