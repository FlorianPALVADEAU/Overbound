"use client";
import { QuestionType } from "@/types/Question";
import { ArrowDown } from "lucide-react";
import { useState } from "react";
import RichText from "../RichText";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";

export const FAQQuestionCard = ({ question, loading, error }: { question: QuestionType; loading?: boolean; error?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => {
    if (!loading && !error) {
      setIsOpen((prev) => !prev)
    }
  }

  return (
    <div
      className={`w-full rounded-2xl border p-6 transition-colors duration-300 ease-standard hover:border-foreground/40 ${
        isOpen ? 'border-primary/70 bg-card/60 shadow-lg shadow-primary/10 hover:border-primary' : 'border-border bg-transparent'
      }`}
    >
      {loading || error ? (
        <Skeleton className='h-6 w-full rounded-md bg-muted' />
      ) : (
        <>
          <button
            type='button'
            onClick={toggle}
            aria-expanded={isOpen}
            className='flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 text-left'
          >
            <h3 className='text-lg font-semibold text-foreground sm:text-xl'>{question.title}</h3>
            <ArrowDown
              className={`h-6 w-6 shrink-0 text-muted-foreground transition-transform duration-300 hover:text-primary ${
                isOpen ? 'rotate-180 text-primary' : 'rotate-0'
              }`}
              aria-hidden='true'
            />
          </button>
          {isOpen ? (
            <div className='mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base'>
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
                      className='inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-primary underline-offset-4 hover:bg-primary/10 hover:underline'
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