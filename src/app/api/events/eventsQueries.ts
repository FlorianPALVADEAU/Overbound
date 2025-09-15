import { useQuery } from '@tanstack/react-query'
import axiosClient from '../axiosClient'
import { Event, EventWithTickets } from '@/types/Event'

const fetchEvents = async (): Promise<Event[]> => {
  const res = await axiosClient.get('/events')
  if (!res.status || res.status !== 200) {
    throw new Error('Failed to fetch events')
  }
  return res.data
}

export const useGetEvents = () => {
  return useQuery<Event[], Error>({
    queryKey: ['events'],
    queryFn: fetchEvents
  })
}

const fetchEventsWithTickets = async (): Promise<EventWithTickets[]> => {
  const res = await axiosClient.get('/events/with-tickets')
  if (!res.status || res.status !== 200) {
    throw new Error('Failed to fetch events with tickets')
  }
  return res.data
}

export const useGetEventsWithTickets = () => {
  return useQuery<EventWithTickets[], Error>({
    queryKey: ['events', 'with-tickets'],
    queryFn: fetchEventsWithTickets
  })
}
