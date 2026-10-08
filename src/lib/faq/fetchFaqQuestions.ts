import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import type { QuestionType } from '@/types/Question'

interface RawQuestion {
  _id?: string
  id?: string
  title?: string
  category?: string
  shortAnswer?: string
  answer?: QuestionType['answer']
  relatedLinks?: QuestionType['relatedLinks']
}

const mapQuestion = (item: RawQuestion): QuestionType => ({
  id: item._id ?? item.id ?? '',
  title: item.title ?? '',
  category: item.category ?? 'general',
  shortAnswer: item.shortAnswer ?? '',
  answer: Array.isArray(item.answer) ? item.answer : [],
  relatedLinks: Array.isArray(item.relatedLinks) ? item.relatedLinks : [],
})

const toQuestions = (res: unknown): QuestionType[] =>
  (Array.isArray(res) ? (res as RawQuestion[]) : []).map(mapQuestion)

export const fetchFaqQuestions = async (): Promise<QuestionType[]> => {
  try {
    return toQuestions(await client.fetch(FAQsQuery))
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('project user not found')) {
      const publicClient = client.withConfig({ token: undefined, useCdn: true })
      return toQuestions(await publicClient.fetch(FAQsQuery))
    }
    throw error
  }
}
