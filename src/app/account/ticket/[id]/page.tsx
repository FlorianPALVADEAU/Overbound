'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '@/app/api/session/sessionQueries'
import { useTicketDetail } from '@/app/api/account/tickets/ticketQueries'
import { Skeleton } from '@/components/ui/skeleton'

interface TicketPageProps {
  params: { id: string }
}
  
export default function TicketPage({ params }: TicketPageProps) {
  const router = useRouter()
  const { id } = params
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data, isLoading, error, refetch } = useTicketDetail(id, Boolean(id))

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace('/account')
    }
  }, [session?.user, sessionLoading, router])

  if (isLoading || sessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex w-full max-w-sm flex-col items-center space-y-4 p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-48 w-48 rounded-xl" />
          <Skeleton className="h-4 w-44" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center space-y-3">
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => refetch()}
        >
          Réessayer
        </button>
      </main>
    )
  }

  if (!data?.registration) {
    return null
  }

  const registration = data.registration
  const event = registration.tickets?.[0]?.events?.[0]
  const ticket = registration.tickets?.[0]

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">
        {event?.title} — {ticket?.name}
      </h1>
      {data.qr_code_data_url ? (
        <img src={data.qr_code_data_url} alt="QR Code" className="h-48 w-48" />
      ) : (
        <p className="text-sm text-muted-foreground">QR code indisponible.</p>
      )}
      <p className="text-sm text-muted-foreground">Présente ce QR au check‑in.</p>
    </main>
  )
}
