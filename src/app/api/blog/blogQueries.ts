import { useQuery } from '@tanstack/react-query';
import axiosClient from '../axiosClient';
import { client } from '@/sanity/lib/client';
import { postBySlugQuery, postsQuery, categoriesWithCountsQuery } from '@/sanity/lib/queries';
import { groq } from 'next-sanity';

const postsByCategoryAndSearchQuery = groq`
  {
    "items": *[_type == "post" && defined(slug.current)
      && (!defined($category) || $category == "" || $category in categories[]->slug.current)
      && (!defined($q) || $q == "" || title match $q || excerpt match $q || pt::text(body) match $q)
    ] | order(publishedAt desc)[$offset...$end]{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      mainImage,
      "author": author->{name, "slug": slug.current},
      "categories": categories[]->{title, "slug": slug.current},
      "readingTime": round(length(pt::text(body)) / 5 / 200)
    },
    "total": count(*[_type == "post" && defined(slug.current)
      && (!defined($category) || $category == "" || $category in categories[]->slug.current)
      && (!defined($q) || $q == "" || title match $q || excerpt match $q || pt::text(body) match $q)
    ])
  }
`;

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  mainImage: any;
  author: {
    name: string;
    slug: string;
  };
  categories: Array<{
    title: string;
    slug: string;
  }>;
  readingTime: number;
}

export interface Category {
  slug: string;
  title: string;
  count: number;
}

interface PostsQueryParams {
  offset: number;
  end: number;
  q: string;
  category: string;
}

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

export const fetchBlogPosts = async (params: PostsQueryParams) => {
  const result = await client.fetch<{ items: BlogPost[]; total: number }>(
    postsByCategoryAndSearchQuery,
    params
  );
  return result;
};

export const fetchBlogCategories = async () => {
  const categories = await client.fetch<Category[]>(categoriesWithCountsQuery);
  return categories;
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

export const useBlogPosts = (params: PostsQueryParams) => {
  return useQuery({
    queryKey: ['blog-posts', params],
    queryFn: () => fetchBlogPosts(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useBlogCategories = () => {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: fetchBlogCategories,
    staleTime: 60 * 1000, // 1 minute
  });
};