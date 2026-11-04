'use client'

import { useParams } from 'next/navigation'
import { AmbassadorSheetPage } from '@/components/admin/ambassadors/AmbassadorSheetPage'

export default function AmbassadorSheetRoute() {
  const { id } = useParams<{ id: string }>()
  return <AmbassadorSheetPage ambassadorId={id} />
}
