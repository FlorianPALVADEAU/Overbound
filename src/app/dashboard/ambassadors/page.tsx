'use client'

import { Suspense } from 'react'
import { AmbassadorsListPage } from '@/components/admin/ambassadors/AmbassadorsListPage'

export default function AmbassadorsPage() {
  return (
    <Suspense fallback={null}>
      <AmbassadorsListPage />
    </Suspense>
  )
}
