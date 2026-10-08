import { useQuery } from '@tanstack/react-query'
import { fetchFaqQuestions } from '@/lib/faq/fetchFaqQuestions'
import type { QuestionType } from '@/types/Question'

/** One cached Sanity fetch shared by every FAQ section; each caller filters with `select`. */
export const useFaqQuestions = (select: (questions: QuestionType[]) => QuestionType[]) =>
  useQuery<QuestionType[], Error, QuestionType[]>({
    queryKey: ['faq', 'all'],
    queryFn: fetchFaqQuestions,
    select,
    retry: 1,
  })

export const byCategory = (category: string) => (questions: QuestionType[]) =>
  questions.filter((q) => q.category === category)
