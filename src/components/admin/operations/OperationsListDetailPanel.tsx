'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OperationsListDetailPanelProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onOpenChange: (open: boolean) => void
}

/** A compact side panel intended for row details, not destructive confirmation. */
export function OperationsListDetailPanel({ open, title, description, children, onOpenChange }: OperationsListDetailPanelProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fermer le panneau" className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div><h2 className="font-semibold">{title}</h2>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Fermer" onClick={() => onOpenChange(false)}><X /></Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  )
}
