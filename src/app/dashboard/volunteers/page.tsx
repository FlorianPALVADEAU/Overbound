'use client'

import { useSearchParams } from 'next/navigation'
import { VolunteerPlanningSection } from '@/components/admin/volunteers/VolunteerPlanningSection'

export default function VolunteersPage() {
  const searchParams = useSearchParams()
  return <VolunteerPlanningSection eventId={searchParams.get('event') ?? undefined} />
}
