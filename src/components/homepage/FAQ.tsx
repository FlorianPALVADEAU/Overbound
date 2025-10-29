'use client'

import { useMemo, useState } from 'react'
import Headings from '../globals/Headings'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import { Skeleton } from '../ui/skeleton'
import { QuestionType } from '@/types/Question'
import { Button } from '../ui/button'
import { ArrowDown } from 'lucide-react'
import Link from 'next/link'
import RichText from '@/components/RichText'
import { faqFallback } from '@/data/faqFallback'

const FAQQuestionCard = ({ question, loading, error }: { question: QuestionType; loading?: boolean; error?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => {
    if (!loading && !error) {
      setIsOpen((prev) => !prev)
    }
  }

  return (
    <div
      onClick={toggle}
      className={`w-full cursor-pointer rounded-2xl border p-6 transition-colors duration-300 hover:border-neutral-500 ${
        isOpen ? 'border-[#26AA26]/70 bg-neutral-800/60 shadow-lg shadow-[#26AA26]/10 hover:border-primary' : 'border-neutral-700 bg-transparent'
      }`}
    >
      {loading || error ? (
        <Skeleton className='h-6 w-full rounded-md bg-neutral-700' />
      ) : (
        <>
          <button
            type='button'
            className='flex w-full cursor-pointer items-center justify-between gap-4 text-left'
          >
            <h3 className='text-lg font-semibold text-white sm:text-xl'>{question.title}</h3>
            <ArrowDown
              className={`h-6 w-6 flex-shrink-0 text-gray-400 transition-transform duration-300 hover:text-primary ${
                isOpen ? 'rotate-180 text-primary' : 'rotate-0'
              }`}
              aria-hidden='true'
            />
          </button>
          {isOpen ? (
            <div className='mt-3 space-y-3 text-sm leading-relaxed text-gray-300 sm:text-base'>
              {question.answer && question.answer.length > 0 ? (
                <RichText value={question.answer} />
              ) : null}
              {question.relatedLinks && question.relatedLinks.length > 0 ? (
                <div className='flex flex-wrap items-center gap-2 pt-2 text-xs sm:text-sm'>
                  {question.relatedLinks.map((link) => (
                    <Link
                      key={`${question.id}-${link.href}`}
                      href={link.href || '#'}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 rounded-full border border-[#26AA26]/40 px-3 py-1 text-[#26AA26] underline-offset-4 hover:bg-[#26AA26]/10 hover:underline'
                    >
                      ↗ {link.label || 'Lien utile'}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

const FAQ = () => {
  const { data: questions, isLoading, isError } = useQuery({
    queryKey: ['faq'],
    queryFn: async (): Promise<QuestionType[]> => {
      try {
        const res = await client.fetch(FAQsQuery)
        return (res as any[]).map((item) => ({
          id: item._id ?? item.id ?? '',
          title: item.title ?? '',
          category: item.category ?? 'general',
          shortAnswer: item.shortAnswer ?? '',
          answer: Array.isArray(item.answer) ? item.answer : [],
          relatedLinks: Array.isArray(item.relatedLinks) ? item.relatedLinks : [],
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message.includes('project user not found')) {
          try {
            const publicClient = client.withConfig({ token: undefined, useCdn: true })
            const res = await publicClient.fetch(FAQsQuery)
            return (res as any[]).map((item) => ({
              id: item._id ?? item.id ?? '',
              title: item.title ?? '',
              category: item.category ?? 'general',
              shortAnswer: item.shortAnswer ?? '',
              answer: Array.isArray(item.answer) ? item.answer : [],
              relatedLinks: Array.isArray(item.relatedLinks) ? item.relatedLinks : [],
            }))
          } catch (retryError) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Retrying FAQ fetch without token failed:', retryError)
            } else {
              console.error('Retrying FAQ fetch without token failed:', retryError)
            }
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          console.info('Falling back to local FAQ data due to fetch error:', message || error)
        } else {
          console.error('Falling back to local FAQ data due to fetch error:', message || error)
        }
        return faqFallback.map((item) => ({
          id: item._id,
          title: item.title,
          category: item.category || 'general',
          shortAnswer: item.shortAnswer ?? '',
          answer: Array.isArray(item.answer) ? item.answer : [],
          relatedLinks: Array.isArray(item.relatedLinks) ? item.relatedLinks : [],
        }))
      }
    },
  })

  const generalFAQs = useMemo(
    () => (questions ?? []).filter((question) => (question.category || 'general') === 'general'),
    [questions],
  )

  return (
    <section className='relative flex h-auto w-full flex-col items-start justify-start gap-12 overflow-hidden bg-[#141414] px-4 py-12 sm:px-6 sm:py-16 xl:px-32 xl:py-40'>
      <div className='relative z-10 w-full'>
        <Headings
          title='FAQ'
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
        {!isLoading && !isError && generalFAQs.length > 0
          ? generalFAQs.map((faq) => <FAQQuestionCard key={faq.id} question={faq} />)
          : Array.from({ length: 6 }).map((_, index) => (
              <FAQQuestionCard
                key={`faq-skeleton-${index}`}
                question={{ id: '', title: '', category: 'general', answer: [] }}
                loading
                error={isError}
              />
            ))}
      </div>
    </section>
  )
}

export default FAQ
