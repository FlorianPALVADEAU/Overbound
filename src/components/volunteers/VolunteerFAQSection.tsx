"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { byCategory, useFaqQuestions } from '@/hooks/faq/useFaqQuestions'
import { Container, Section, SectionHeader } from '@/components/ds'
import { Button } from '../ui/button'
import { FAQQuestionCard } from '../homepage/FAQQuestionCard'

export const VolunteerFAQSection = () => {
  const { data, isLoading, isError, error } = useFaqQuestions(byCategory('volunteers'))

  const volunteerQuestions = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const showEmptyState = !isLoading && !isError && volunteerQuestions.length === 0

  return (
    <Section>
      <Container className='flex flex-col gap-12'>
      <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
        <SectionHeader
          flush
          eyebrow='FAQ'
          title='Questions des bénévoles'
          lead='Toutes les réponses pour savoir comment se vit l’expérience côté tribu organisatrice.'
        />
        <Button asChild variant='outline' size='cta' className='w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground lg:w-auto'>
          <Link href='/about/faq'>Voir tout</Link>
        </Button>
      </div>

      <div className='grid w-full grid-cols-1 gap-6 md:grid-cols-2'>
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
        <p className='relative z-10 text-sm text-muted-foreground sm:text-base'>
          Aucune question volontaire n’est disponible pour le moment. Reviens bientôt, la tribu met à jour son centre
          d’aide.
        </p>
      ) : null}

      {isError ? (
        <p className='relative z-10 text-sm text-destructive sm:text-base'>
          Impossible de charger les questions volontaires pour le moment&nbsp;: {error instanceof Error ? error.message : 'Réessaie dans quelques minutes.'}
        </p>
      ) : null}
      </Container>
    </Section>
  )
}
