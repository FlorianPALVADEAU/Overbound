import { Suspense } from 'react'
import { RatePageClient } from './RatePageClient'

export default function RatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Enregistrement de votre avis...
          </h1>
        </div>
      </div>
    }>
      <RatePageClient />
    </Suspense>
  )
}