"use client";
import { QuestionType } from "@/types/Question";
import RichText from "../RichText";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { FaqAccordionItem } from "../faq/FaqAccordionItem";

export const FAQQuestionCard = ({ question, loading, error }: { question: QuestionType; loading?: boolean; error?: boolean }) => {
  if (loading || error) {
    return (
      <div className="w-full rounded-2xl border border-border bg-transparent p-6">
        <Skeleton className="h-6 w-full rounded-md bg-muted" />
      </div>
    )
  }

  return (
    <FaqAccordionItem title={question.title}>
      {question.answer && question.answer.length > 0 ? <RichText value={question.answer} /> : null}
      {question.relatedLinks && question.relatedLinks.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs sm:text-sm">
          {question.relatedLinks.map((link) => (
            <Link
              key={`${question.id}-${link.href}`}
              href={link.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-primary underline-offset-4 hover:bg-primary/10 hover:underline"
            >
              ↗ {link.label || "Lien utile"}
            </Link>
          ))}
        </div>
      ) : null}
    </FaqAccordionItem>
  )
}
