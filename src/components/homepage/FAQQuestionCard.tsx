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