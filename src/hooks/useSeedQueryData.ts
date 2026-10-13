'use client'

import { useState } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'

/**
 * Puts server-read data into the React Query cache during the first render,
 * so every hook reading `queryKey` below has data on the server render and
 * on hydration.
 *
 * Not HydrationBoundary: a component rendered earlier (the Header) may have
 * already created the query in a pending state, and HydrationBoundary only
 * applies data to an existing query in an effect, which never runs on the
 * server. A state initializer runs once, during render, on both sides.
 * Observers are notified asynchronously by query-core, so components that
 * rendered earlier simply re-render with the data after hydration.
 */
export function useSeedQueryData<T>(queryKey: QueryKey, data: T) {
  const queryClient = useQueryClient()
  useState(() => {
    if (queryClient.getQueryData(queryKey) === undefined) {
      queryClient.setQueryData(queryKey, data)
    }
    return null
  })
}
