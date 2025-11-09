import { useState, useCallback } from 'react'
import type { NotificationPreferences, UpdateNotificationPreferencesData } from '@/types/NotificationPreferences'

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notification-preferences')

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences')
      }

      const data = await response.json()
      setPreferences(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching notification preferences:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(
    async (updates: UpdateNotificationPreferencesData) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/notification-preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          throw new Error('Failed to update notification preferences')
        }

        const data = await response.json()
        setPreferences(data)

        return { success: true, data }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        console.error('Error updating notification preferences:', err)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreferences,
  }
}
