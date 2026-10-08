'use client'

import { useMemo } from 'react'
import { FAQQuestionCard } from '@/components/homepage/FAQQuestionCard'
import { useFaqQuestions } from '@/hooks/faq/useFaqQuestions'
import { block } from '@/datas/faqFallback'
import type { QuestionType } from '@/types/Question'
import { FORMAT_FAQS } from './content'

const FORMAT_TOPIC = /\b(open|ranked)\b|format|burpee|pénalit|élimin/i
const MAX_SANITY_EXTRAS = 4

const onFormatTopic = (questions: QuestionType[]) =>
  questions.filter((q) => FORMAT_TOPIC.test(q.title)).slice(0, MAX_SANITY_EXTRAS)

const FALLBACK: QuestionType[] = FORMAT_FAQS.map((faq) => ({
  id: faq.id,
  title: faq.question,
  category: 'general',
  answer: [block(faq.answer)],
}))

/** Curated format questions, plus any matching question added in Sanity. */
export function FormatsFaq() {
  const { data } = useFaqQuestions(onFormatTopic)
  const questions = useMemo(() => {
    const known = new Set(FALLBACK.map((q) => q.title.toLowerCase()))
    const extras = (data ?? []).filter((q) => !known.has(q.title.toLowerCase()))
    return [...FALLBACK, ...extras]
  }, [data])

  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {questions.map((q) => (
        <FAQQuestionCard key={q.id} question={q} />
      ))}
    </div>
  )
}
