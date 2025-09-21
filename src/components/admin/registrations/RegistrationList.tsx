'use client'

import type { AdminRegistration } from '@/types/Registration'
import { RegistrationCard } from './RegistrationCard'

interface RegistrationListProps {
  registrations: AdminRegistration[]
  loadingId?: string | null
  onViewDocument: (registration: AdminRegistration) => void
  onOpenApproval: (registration: AdminRegistration) => void
}

export function RegistrationList({ registrations, loadingId, onViewDocument, onOpenApproval }: RegistrationListProps) {
  return (
    <div className="space-y-4">
      {registrations.map((registration) => (
        <RegistrationCard
          key={registration.id}
          registration={registration}
          loadingId={loadingId}
          onViewDocument={onViewDocument}
          onOpenApproval={onOpenApproval}
        />
      ))}
    </div>
  )
}
