'use client'

import { useMemo } from 'react'
import { Container, Section, SectionHeader } from '@/components/ds'
import { byCategory, useFaqQuestions } from '@/hooks/faq/useFaqQuestions'
import { Button } from '../ui/button'
import Link from 'next/link'
import { FAQQuestionCard } from './FAQQuestionCard'

const FAQ = () => {
  const { data: questions, isLoading, isError, error } = useFaqQuestions(byCategory('general'))

  const generalFAQs = useMemo(() => (Array.isArray(questions) ? questions : []), [questions])
  const showEmptyState = !isLoading && !isError && generalFAQs.length === 0

  return (
    <Section className="border-t border-border">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader flush title="FAQ" />
          <Button asChild variant="outline" size="cta" className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground sm:w-auto">
            <Link href="/about/faq">Voir tout</Link>
          </Button>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <FAQQuestionCard
                  key={`faq-skeleton-${index}`}
                  question={{ id: "", title: "", category: "general", answer: [] }}
                  loading
                />
              ))
            : generalFAQs.map((faq) => <FAQQuestionCard key={faq.id} question={faq} />)}
        </div>

        {showEmptyState ? (
          <p className="text-sm text-muted-foreground sm:text-base">
            Aucune question générale n’est disponible pour le moment. Consulte notre centre d’aide complet pour plus
            d’informations.
          </p>
        ) : null}

        {isError ? (
          <p className="text-sm text-destructive sm:text-base">
            Impossible de charger les questions pour le moment&nbsp;:{" "}
            {error instanceof Error ? error.message : "Réessaie dans quelques minutes."}
          </p>
        ) : null}
      </Container>
    </Section>
  )
}

export default FAQ
