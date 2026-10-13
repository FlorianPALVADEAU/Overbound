'use client'

import type { ReactNode } from 'react'
import { useSeedQueryData } from '@/hooks/useSeedQueryData'
import { FAQ_QUERY_KEY } from '@/hooks/faq/useFaqQuestions'
import type { QuestionType } from '@/types/Question'

/** Seeds the server-read FAQ so the homepage section renders without a browser call to Sanity. */
export function FaqSeed({ data, children }: { data: QuestionType[]; children: ReactNode }) {
  useSeedQueryData(FAQ_QUERY_KEY, data)
  return children
}
