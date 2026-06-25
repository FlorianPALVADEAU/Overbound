'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function RatePageClient() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const submitRating = async () => {
      const userId = searchParams.get('userId')
      const eventId = searchParams.get('eventId')
      const rating = searchParams.get('rating')

      if (!userId || !eventId || !rating) {
        setStatus('error')
        setErrorMessage('Paramètres manquants')
        return
      }

      try {
        const response = await fetch('/api/feedback/rating', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            eventId,
            rating: parseInt(rating, 10),
          }),
        })

        if (!response.ok) {
          throw new Error("Erreur lors de l'enregistrement de votre avis")
        }

        setStatus('success')
      } catch (error) {
        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'Une erreur est survenue'
        )
      }
    }

    submitRating()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Enregistrement de votre avis...
            </h1>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Merci pour ton avis !
            </h1>
            <p className="text-gray-600 mb-6">
              Ton retour nous aide à améliorer continuellement l&apos;expérience
              Overbound pour tous nos participants.
            </p>
            <div className="space-y-3">
              <Link
                href="/events/ultra-arena-2026"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Découvrir les prochains événements
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Oups, une erreur est survenue
            </h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <a
              href="/contact"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Nous contacter
            </a>
          </div>
        )}
      </div>
    </div>
  )
}