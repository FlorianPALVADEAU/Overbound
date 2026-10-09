'use client'

import Link from 'next/link'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPinIcon } from 'lucide-react'
import { useSession } from '@/app/api/session/sessionQueries'
import { useClaimDetails } from '@/app/api/account/tickets/claim/claimQueries'
import { AccountScreen, Eyebrow } from '@/components/account/AccountScreen'
import { ClaimTicketForm } from '@/components/account/ClaimTicketForm'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLongDate } from '@/lib/account/format'

function ClaimMessage({ title, message, children }: { title: string; message?: string; children?: React.ReactNode }) {
  return (
    <AccountScreen narrow>
      <div className="space-y-4 py-10">
        <h1 className="text-balance text-[2rem] font-black leading-tight tracking-tight">{title}</h1>
        {message ? <p className="text-muted-foreground">{message}</p> : null}
        {children}
      </div>
    </AccountScreen>
  )
}

function ClaimTicketPageInner() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') ?? ''
  const router = useRouter()
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data, isLoading, error, refetch } = useClaimDetails(token, Boolean(token))

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/account/tickets/claim?token=${token}`)}`)
    }
  }, [session?.user, sessionLoading, router, token])

  if (!token) {
    return <ClaimMessage title="Lien de transfert invalide" message="Demande à la personne qui t'a envoyé le billet de te renvoyer le lien." />
  }

  if (isLoading || sessionLoading) {
    return (
      <AccountScreen narrow>
        <div className="space-y-4" aria-busy="true" aria-label="Chargement du billet">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-14 w-full" />
        </div>
      </AccountScreen>
    )
  }

  if (error) {
    return (
      <ClaimMessage title="Billet introuvable" message={error.message}>
        <div className="flex gap-3">
          <Button onClick={() => refetch()} className="h-11 px-5">Réessayer</Button>
          <Button asChild variant="outline" className="h-11 px-5">
            <Link href="/account">Mes billets</Link>
          </Button>
        </div>
      </ClaimMessage>
    )
  }

  const registration = data?.registration
  if (!registration) return null

  return (
    <AccountScreen narrow>
      <header>
        <Eyebrow className="text-primary">Un billet t&apos;attend</Eyebrow>
        <h1 className="mt-2 text-balance text-[2.5rem] font-black leading-[0.95] tracking-tight">
          {registration.event?.title ?? 'Événement'}
        </h1>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {registration.ticket?.name ? <p className="font-semibold text-foreground">{registration.ticket.name}</p> : null}
          {registration.event?.date ? <p className="first-letter:uppercase">{formatLongDate(registration.event.date)}</p> : null}
          {registration.event?.location ? (
            <p className="flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" />
              {registration.event.location}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-8 space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pour récupérer ce billet, tu renseignes tes informations, tu relis la décharge et le règlement, puis tu signes.
          La signature de la personne qui te l&apos;a transmis ne couvre pas ta participation.
        </p>
        <ClaimTicketForm token={token} />
      </div>
    </AccountScreen>
  )
}

export default function ClaimTicketPage() {
  return (
    <Suspense fallback={null}>
      <ClaimTicketPageInner />
    </Suspense>
  )
}
