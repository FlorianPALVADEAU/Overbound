"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import type { QuestionType } from '@/types/Question'
import Headings from '../globals/Headings'
import { Button } from '../ui/button'
import { FAQQuestionCard } from '../homepage/FAQQuestionCard'

const mapQuestion = (item: any): QuestionType => ({
  id: item._id ?? item.id ?? '',
  title: item.title ?? '',
  category: item.category ?? 'general',
  shortAnswer: item.shortAnswer ?? '',
  answer: Array.isArray(item.answer) ? item.answer : [],
  relatedLinks: Array.isArray(item.relatedLinks) ? item.relatedLinks : [],
})

const fetchVolunteerFAQs = async (): Promise<QuestionType[]> => {
  try {
    const res = await client.fetch(FAQsQuery)
    return (Array.isArray(res) ? res : []).map(mapQuestion).filter((item) => item.category === 'volunteers')
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (message.includes('project user not found')) {
      const publicClient = client.withConfig({ token: undefined, useCdn: true })
      const res = await publicClient.fetch(FAQsQuery)
      return (Array.isArray(res) ? res : []).map(mapQuestion).filter((item) => item.category === 'volunteers')
    }

    throw error
  }
}

export const VolunteerFAQSection = () => {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<QuestionType[]>({
    queryKey: ['faq', 'volunteers'],
    queryFn: fetchVolunteerFAQs,
    retry: 1,
  })

  const volunteerQuestions = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const showEmptyState = !isLoading && !isError && volunteerQuestions.length === 0

  return (
    <section className='relative flex h-auto w-full flex-col items-start justify-start gap-12 overflow-hidden bg-[#141414] px-4 py-12 sm:px-6 sm:py-16 xl:px-32 xl:py-40'>
      <div className='relative z-10 w-full'>
        <Headings
          title='FAQ - Bénévoles'
          description='Toutes les réponses pour savoir comment se vit l’expérience côté tribu organisatrice.'
          cta={
            <Link href='/about/faq'>
              <Button
                variant='outline'
                className='h-10 w-full border-2 border-primary text-sm font-semibold text-[#26AA26] transition-all duration-300 hover:bg-[#26AA26] hover:text-white hover:shadow-lg hover:shadow-[#26AA26]/30 sm:h-11 sm:w-44 sm:text-base md:h-12 md:w-48'
              >
                Voir tout
              </Button>
            </Link>
          }
          sx='flex-row! justify-between!'
        />
      </div>

      <div className='relative z-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2'>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <FAQQuestionCard
                key={`volunteer-faq-skeleton-${index}`}
                question={{ id: '', title: '', category: 'volunteers', answer: [] }}
                loading
              />
            ))
          : volunteerQuestions.map((question) => <FAQQuestionCard key={question.id} question={question} />)}
      </div>

      {showEmptyState ? (
        <p className='relative z-10 text-sm text-white/70 sm:text-base'>
          Aucune question volontaire n’est disponible pour le moment. Reviens bientôt, la tribu met à jour son centre
          d’aide.
        </p>
      ) : null}

      {isError ? (
        <p className='relative z-10 text-sm text-red-300 sm:text-base'>
          Impossible de charger les questions volontaires pour le moment&nbsp;: {error instanceof Error ? error.message : 'Réessaie dans quelques minutes.'}
        </p>
      ) : null}
    </section>
  )
}
