'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { getClientAuthHeaders } from '@/lib/auth/getClientAuthHeaders'

const requestDeletion = async (): Promise<void> => {
  const send = async (forceRefresh: boolean) =>
    fetch('/api/account/deletion-request', {
      method: 'POST',
      headers: await getClientAuthHeaders({ forceRefresh }),
      credentials: 'include',
    })

  let response = await send(false)
  if (response.status === 401) response = await send(true)
  if (response.status === 401) throw new Error('Session expirée. Recharge la page et reconnecte-toi.')
  if (!response.ok) throw new Error('Impossible d’envoyer la demande. Réessaie ou écris-nous à contact@overbound-race.com.')
}

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const mutation = useMutation({ mutationFn: requestDeletion })

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Supprimer mon compte et mes données</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Tu peux demander l’effacement de tes données personnelles à tout moment. Nous traitons ta demande sous un mois.
          Les données liées à un paiement (factures) sont conservées par obligation comptable, puis anonymisées.{' '}
          <Link href="/privacy-policies#droits" className="underline underline-offset-4 hover:text-foreground">
            En savoir plus sur tes droits
          </Link>
          .
        </p>
      </div>

      {mutation.isSuccess ? (
        <p role="status" className="text-sm font-medium text-foreground">
          Demande enregistrée. Un email de confirmation vient de t’être envoyé.
        </p>
      ) : (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="min-h-11 border-destructive text-destructive">
              Demander la suppression
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Demander la suppression de ton compte ?</AlertDialogTitle>
              <AlertDialogDescription>
                Ton compte et tes données personnelles seront effacés après vérification, sous un mois. Tes inscriptions à
                venir seront annulées sans remboursement, sauf option billet flexible. Cette action est définitive une
                fois traitée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {mutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {mutation.error.message}
              </p>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-11">Annuler</AlertDialogCancel>
              <Button
                variant="destructive"
                className="min-h-11"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(undefined, { onSuccess: () => setOpen(false) })}
              >
                {mutation.isPending ? 'Envoi…' : 'Confirmer la demande'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
