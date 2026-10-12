'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PurchaseCelebration } from '@/components/events/success/PurchaseCelebration'

export function CelebrationPlayground() {
  const [run, setRun] = useState(0)
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Aperçu : célébration post-achat</h1>
        <Button onClick={() => setRun((value) => value + 1)}>Rejouer l'animation</Button>
      </div>
      <PurchaseCelebration
        key={run}
        registrationId="preview"
        eventSlug="ultra-arena-2026"
        eventTitle="Ultra Arena 2026"
        hasFirstName
        preview
      />
    </main>
  )
}
