'use client'

import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  entityName: string
  entityType: string
  warningMessage?: string
  consequences?: string[]
  onConfirm: () => void
  loading?: boolean
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  entityName,
  entityType,
  warningMessage,
  consequences,
  onConfirm,
  loading = false,
}: DeleteConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const isConfirmValid = confirmText === entityName

  useEffect(() => {
    if (!open) {
      setConfirmText('')
    }
  }, [open])

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {warningMessage && (
                <p className="text-destructive font-medium">{warningMessage}</p>
              )}

              <p>
                Cette action est <strong>irréversible</strong>. Cela supprimera définitivement{' '}
                {entityType} <strong>&quot;{entityName}&quot;</strong>
                {consequences && consequences.length > 0 && ' ainsi que :'}
              </p>

              {consequences && consequences.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {consequences.map((consequence, index) => (
                    <li key={index}>{consequence}</li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-name" className="text-foreground">
                  Pour confirmer, tapez <strong className="font-mono bg-muted px-1 rounded">{entityName}</strong> ci-dessous :
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={entityName}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || loading}
          >
            {loading ? 'Suppression…' : 'Supprimer définitivement'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
