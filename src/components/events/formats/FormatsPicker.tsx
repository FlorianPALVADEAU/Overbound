'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { PICKER_QUESTIONS, pickFormat, type FormatKey } from './content'

interface Props {
  /** Event page to send the visitor to; null hides the call to action. */
  eventHref: string | null
}

export function FormatsPicker({ eventHref }: Props) {
  const [answers, setAnswers] = useState<Partial<Record<string, FormatKey>>>({})
  const [submitted, setSubmitted] = useState(false)
  const answered = Object.keys(answers).length
  const complete = answered === PICKER_QUESTIONS.length
  const result = submitted ? pickFormat(answers) : null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (complete) setSubmitted(true)
  }

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {PICKER_QUESTIONS.map((q, index) => (
        <fieldset key={q.id} className="space-y-3">
          <legend className="text-lg font-black">
            <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
              {index + 1}
            </span>
            {q.question}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['open', 'ranked'] as const).map((key) => (
              <label key={key} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name={q.id}
                  value={key}
                  required
                  checked={answers[q.id] === key}
                  onChange={() => {
                    setAnswers((a) => ({ ...a, [q.id]: key }))
                    setSubmitted(false)
                  }}
                  className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className={cn(
                    'flex min-h-12 items-center rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors',
                    'peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-bold',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-primary hover:bg-muted',
                  )}
                >
                  {q[key]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={!complete}
          className="min-h-12 cursor-pointer rounded-xl bg-primary px-6 text-base font-black text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Voir mon format
        </button>
        {answered > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="min-h-12 cursor-pointer rounded-xl px-6 text-sm font-semibold underline underline-offset-4"
          >
            Recommencer
          </button>
        ) : null}
      </div>

      <div aria-live="polite">
        {result ? (
          <div className="rounded-2xl border border-primary/30 bg-card p-5">
            <p className="text-sm text-muted-foreground">D&apos;après tes réponses, ton format est</p>
            <p className={cn('mt-1 text-4xl font-black', result === 'open' ? 'text-blue-600' : 'text-amber-600')}>
              {result.toUpperCase()}
            </p>
            {eventHref ? (
              <Link
                href={eventHref}
                className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-black text-white sm:inline-flex"
              >
                Je m&apos;inscris
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  )
}
