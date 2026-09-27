'use client'

import { VolunteerAccessControl } from '@/components/admin/VolunteerAccessControl'
import { useSearchParams } from 'next/navigation'

export default function CheckinPage() {
  const searchParams = useSearchParams()
  return <VolunteerAccessControl eventId={searchParams.get('event') ?? undefined} />
}
