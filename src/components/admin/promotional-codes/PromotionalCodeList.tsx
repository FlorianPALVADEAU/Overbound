'use client'

import type { PromotionalCode } from '@/types/PromotionalCode'
import { PromotionalCodeCard } from './PromotionalCodeCard'

interface PromotionalCodeListProps {
  promotionalCodes: PromotionalCode[]
  onEdit: (code: PromotionalCode) => void
  onDelete: (code: PromotionalCode) => void
  deleteLoadingId?: string | null
}

export function PromotionalCodeList({ promotionalCodes, onEdit, onDelete, deleteLoadingId }: PromotionalCodeListProps) {
  return (
    <div className="space-y-4">
      {promotionalCodes.map((promotionalCode) => (
        <PromotionalCodeCard
          key={promotionalCode.id}
          promotionalCode={promotionalCode}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deleteLoadingId === promotionalCode.id}
        />
      ))}
    </div>
  )
}
