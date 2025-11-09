import { useState } from 'react'
import type {
  DistributionList,
  DistributionListWithStats,
  CreateDistributionListData,
  UpdateDistributionListData,
} from '@/types/DistributionList'

/**
 * Hook pour gérer les distribution lists (admin)
 */
export function useDistributionLists() {
  const [lists, setLists] = useState<DistributionListWithStats[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all lists
   */
  const fetchLists = async (options?: {
    includeStats?: boolean
    type?: string
    activeOnly?: boolean
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options?.includeStats) params.append('includeStats', 'true')
      if (options?.type) params.append('type', options.type)
      if (options?.activeOnly) params.append('activeOnly', 'true')

      const response = await fetch(
        `/api/admin/distribution-lists?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch lists')
      }

      const { data } = await response.json()
      setLists(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Create a new list
   */
  const createList = async (data: CreateDistributionListData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/distribution-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create list')
      }

      const { data: newList } = await response.json()
      await fetchLists({ includeStats: true })
      return newList
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update a list
   */
  const updateList = async (
    id: string,
    data: UpdateDistributionListData
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/distribution-lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update list')
      }

      const { data: updatedList } = await response.json()
      await fetchLists({ includeStats: true })
      return updatedList
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete a list
   */
  const deleteList = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/distribution-lists/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete list')
      }

      await fetchLists({ includeStats: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Toggle list active status
   */
  const toggleActive = async (id: string, active: boolean) => {
    return updateList(id, { active })
  }

  return {
    lists,
    isLoading,
    error,
    fetchLists,
    createList,
    updateList,
    deleteList,
    toggleActive,
  }
}

/**
 * Hook pour gérer les abonnés d'une liste (admin)
 */
export function useListSubscribers(listId: string) {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch subscribers
   */
  const fetchSubscribers = async (options?: {
    subscribedOnly?: boolean
    limit?: number
    offset?: number
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options?.subscribedOnly !== undefined)
        params.append('subscribedOnly', String(options.subscribedOnly))
      if (options?.limit) params.append('limit', String(options.limit))
      if (options?.offset) params.append('offset', String(options.offset))

      const response = await fetch(
        `/api/admin/distribution-lists/${listId}/subscribers?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch subscribers')
      }

      const { data, total: totalCount } = await response.json()
      setSubscribers(data)
      setTotal(totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    subscribers,
    total,
    isLoading,
    error,
    fetchSubscribers,
  }
}
