import { useQuery } from '@tanstack/react-query'
import { fetchFaqQuestions } from '@/lib/faq/fetchFaqQuestions'
import type { QuestionType } from '@/types/Question'

export const FAQ_QUERY_KEY = ['faq', 'all'] as const

/** One cached Sanity fetch shared by every FAQ section; each caller filters with `select`. */
export const useFaqQuestions = (select: (questions: QuestionType[]) => QuestionType[]) =>
  useQuery<QuestionType[], Error, QuestionType[]>({
    queryKey: FAQ_QUERY_KEY,
    queryFn: fetchFaqQuestions,
    // Editorial content: a server-seeded list stays fresh instead of being refetched on mount.
    staleTime: 5 * 60 * 1000,
    select,
    retry: 1,
  })

export const byCategory = (category: string) => (questions: QuestionType[]) =>
  questions.filter((q) => q.category === category)
