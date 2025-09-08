import { useQuery } from '@tanstack/react-query';
import axiosClient from '../axiosClient';
import { Obstacle } from '@/types/Obstacle';

const fetchObstacles = async (): Promise<Obstacle[]> => {
  const res = await axiosClient.get('/obstacles');
  if (!res.status || res.status !== 200) {
    throw new Error('Failed to fetch obstacles');
  }
  return res.data;
};

export const useGetObstacles = () => {
  return useQuery<Obstacle[], Error>({
    queryKey: ['obstacles'],
    queryFn: fetchObstacles
  });
};