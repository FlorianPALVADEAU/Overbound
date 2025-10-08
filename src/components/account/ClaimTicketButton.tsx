'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ClaimTicketButtonProps {
  token: string
}

export function ClaimTicketButton({ token }: ClaimTicketButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleClaim = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        const response = await fetch('/api/account/tickets/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Impossible de récupérer ce billet.")
        }

        setSuccess(true)
        router.prefetch('/account/tickets')
        setTimeout(() => {
          router.push('/account/tickets')
          router.refresh()
        }, 1500)
      } catch (claimError) {
        if (claimError instanceof Error) {
          setError(claimError.message)
        } else {
          setError("Une erreur inattendue s'est produite.")
        }
      }
    })
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleClaim} disabled={isPending || success} className="w-full md:w-auto">
        {isPending ? 'Transfert en cours…' : success ? 'Billet transféré !' : 'Récupérer ce billet'}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-600">
          Billet transféré avec succès. Tu vas être redirigé vers tes billets.
        </p>
      ) : null}
    </div>
  )
}
