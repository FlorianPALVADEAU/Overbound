'use client'

import type { Upsell } from '@/types/Upsell'
import { UpsellCard } from './UpsellCard'

interface UpsellListProps {
  upsells: Upsell[]
  onEdit: (upsell: Upsell) => void
  onDelete: (upsell: Upsell) => void
  deleteLoadingId?: string | null
}

export function UpsellList({ upsells, onEdit, onDelete, deleteLoadingId }: UpsellListProps) {
  return (
    <div className="space-y-4">
      {upsells.map((upsell) => (
        <UpsellCard
          key={upsell.id}
          upsell={upsell}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deleteLoadingId === upsell.id}
        />
      ))}
    </div>
  )
}
