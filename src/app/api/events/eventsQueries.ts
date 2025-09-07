import { useQuery } from '@tanstack/react-query';
import axiosClient from '../axiosClient';
import { Event } from '@/types/Event';

const fetchEvents = async (): Promise<Event[]> => {
  const res = await axiosClient.get('/events');
  if (!res.status || res.status !== 200) {
    throw new Error('Failed to fetch events');
  }
  return res.data;
};

export const useGetEvents = () => {
  return useQuery<Event[], Error>({
    queryKey: ['events'],
    queryFn: fetchEvents
  });
};