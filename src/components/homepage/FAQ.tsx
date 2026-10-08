'use client'

import { useMemo } from 'react'
import Headings from '../globals/Headings'
import { byCategory, useFaqQuestions } from '@/hooks/faq/useFaqQuestions'
import { Button } from '../ui/button'
import Link from 'next/link'
import { FAQQuestionCard } from './FAQQuestionCard'

const FAQ = () => {
  const { data: questions, isLoading, isError, error } = useFaqQuestions(byCategory('general'))

  const generalFAQs = useMemo(() => (Array.isArray(questions) ? questions : []), [questions])
  const showEmptyState = !isLoading && !isError && generalFAQs.length === 0

  return (
    <section className='relative flex h-auto w-full flex-col items-start justify-start gap-12 overflow-hidden bg-[#141414] px-4 py-12 sm:px-6 sm:py-16 xl:px-32 xl:py-40'>
      <div className='relative z-10 w-full'>
        <Headings
          title='FAQ'
          cta={
            <Button
              asChild
              variant='outline'
              className='h-11 cursor-pointer w-full border-2 border-primary text-sm font-semibold text-[#26AA26] transition-all duration-300 hover:bg-[#26AA26] hover:text-white hover:shadow-lg hover:shadow-[#26AA26]/30 sm:w-44 sm:text-base md:h-12 md:w-48'
            >
              <Link href='/about/faq'>Voir tout</Link>
            </Button>
          }
          sx='flex-row! justify-between!'
        />
      </div>

      <div className='relative z-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2'>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <FAQQuestionCard
                key={`faq-skeleton-${index}`}
                question={{ id: '', title: '', category: 'general', answer: [] }}
                loading
              />
            ))
          : generalFAQs.map((faq) => <FAQQuestionCard key={faq.id} question={faq} />)}
      </div>

      {showEmptyState ? (
        <p className='relative z-10 text-sm text-gray-300 sm:text-base'>
          Aucune question générale n’est disponible pour le moment. Consulte notre centre d’aide complet pour plus
          d’informations.
        </p>
      ) : null}

      {isError ? (
        <p className='relative z-10 text-sm text-red-300 sm:text-base'>
          Impossible de charger les questions pour le moment&nbsp;:{' '}
          {error instanceof Error ? error.message : 'Réessaie dans quelques minutes.'}
        </p>
      ) : null}
    </section>
  )
}

export default FAQ
