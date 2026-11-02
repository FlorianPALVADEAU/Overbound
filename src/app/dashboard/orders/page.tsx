'use client'

import { Suspense } from 'react'
import { OrdersSection } from '@/components/admin/orders/OrdersSection'

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersSection />
    </Suspense>
  )
}
