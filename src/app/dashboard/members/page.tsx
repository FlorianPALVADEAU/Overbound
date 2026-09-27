'use client'

import { useSearchParams } from 'next/navigation'
import { RegistrationsSection } from '@/components/admin/registrations/RegistrationsSection'

export default function MembersPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? undefined

  return <RegistrationsSection eventId={eventId} lockEventFilter={Boolean(eventId)} />
}
