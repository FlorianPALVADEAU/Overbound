import { useQuery } from '@tanstack/react-query';
import axiosClient from '../axiosClient';
import { client } from '@/sanity/lib/client';
import { postBySlugQuery, postsQuery } from '@/sanity/lib/queries';

export const fetchPosts = async (): Promise<any[]> => {
  const res = await client.fetch(postsQuery);

  if (!res) {
    throw new Error('Failed to fetch posts');
  }

  return res;
};

export const fetchSinglePost = async (slug: string): Promise<any> => {
  const res = await client.fetch(postBySlugQuery, { slug });

  if (!res) {
    throw new Error('Failed to fetch post');
  }
  return res;
};

export const useGetPosts = () => {
  return useQuery<any[], Error>({
    queryKey: ['posts'],
    queryFn: fetchPosts
  });
};

export const useGetPost = (slug: string) => {
  return useQuery<any, Error>({
    queryKey: ['post', slug],
    queryFn: () => fetchSinglePost(slug)
  });
};