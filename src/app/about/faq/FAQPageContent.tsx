'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { PortableTextBlock } from '@portabletext/types'
import { PageHero } from '@/components/hero/PageHero'
import RichText from '@/components/RichText'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'

export type FAQDocument = {
  _id: string
  title: string
  shortAnswer?: string
  answer?: PortableTextBlock[]
  category: string
  subCategory?: string
  order?: number
  audiences?: string[]
  keywords?: string[]
  relatedLinks?: { label?: string; href?: string }[]
}

const CATEGORIES = [
  { value: 'general', title: 'Les bases' },
  { value: 'inscriptions', title: 'Inscriptions & billets' },
  { value: 'preparation', title: 'Préparation' },
  { value: 'logistique', title: 'Jour J' },
  { value: 'apres-course', title: 'Après la course' },
  { value: 'presse', title: 'Partenaires & presse' },
] as const

const OTHER = { value: 'autres', title: 'Autres questions' }
const HIDDEN_CATEGORIES = new Set(['documents'])

const categoryTitle = (value: string) => CATEGORIES.find((c) => c.value === value)?.title ?? OTHER.title

const matches = (faq: FAQDocument, term: string) => {
  const haystack = [faq.title, faq.shortAnswer, faq.subCategory, ...(faq.keywords ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(term) || JSON.stringify(faq.answer ?? []).toLowerCase().includes(term)
}

const byOrder = (a: FAQDocument, b: FAQDocument) =>
  (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title)

function Answers({ faqs }: { faqs: FAQDocument[] }) {
  return (
    <Accordion type="multiple" className="border-t">
      {faqs.map((faq) => (
        <AccordionItem key={faq._id} value={faq._id}>
          <AccordionTrigger className="min-h-11 py-5 text-left text-base font-semibold sm:text-lg">
            {faq.title}
          </AccordionTrigger>
          <AccordionContent className="space-y-4 text-base leading-relaxed text-foreground/80">
            {faq.answer?.length ? <RichText value={faq.answer} /> : <p>{faq.shortAnswer}</p>}
            {faq.relatedLinks?.length ? (
              <ul className="flex flex-wrap gap-x-5 gap-y-1">
                {faq.relatedLinks.map((link) => (
                  <li key={`${faq._id}-${link.href}`}>
                    <Link
                      href={link.href || '#'}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
                    >
                      {link.label || 'En savoir plus'} →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default function FAQPageContent({ faqs }: { faqs: FAQDocument[] }) {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()

  const visible = useMemo(() => faqs.filter((faq) => !HIDDEN_CATEGORIES.has(faq.category)), [faqs])

  const sections = useMemo(() => {
    const known = new Set<string>(CATEGORIES.map((c) => c.value))
    const grouped = new Map<string, FAQDocument[]>()
    for (const faq of visible) {
      const key = known.has(faq.category) ? faq.category : OTHER.value
      grouped.set(key, [...(grouped.get(key) ?? []), faq])
    }
    return [...CATEGORIES, OTHER]
      .map((c) => ({ ...c, items: (grouped.get(c.value) ?? []).sort(byOrder) }))
      .filter((c) => c.items.length > 0)
  }, [visible])

  const results = useMemo(() => (term ? visible.filter((faq) => matches(faq, term)).sort(byOrder) : []), [visible, term])

  return (
    <main className="w-full bg-background text-foreground">
      <PageHero
        image={{
          src: '/images/images/a-group-of-friend-celebrating-after-a-race.avif',
          alt: 'Groupe d’amis qui célèbrent après la course',
        }}
        eyebrow="FAQ"
        title="Les réponses, sans détour"
        actions={
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher (ex. transfert de billet)"
              aria-label="Rechercher dans la FAQ"
              className="h-11 bg-background/80 pl-9"
            />
          </div>
        }
      />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:px-8">
        {term ? null : (
          <nav aria-label="Thèmes" className="hidden lg:block">
            <ul className="sticky top-28 space-y-1 text-sm">
              {sections.map((section) => (
                <li key={section.value}>
                  <a
                    href={`#${section.value}`}
                    className="flex min-h-11 items-center text-foreground/70 transition-colors hover:text-primary"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className={term ? 'min-w-0 lg:col-span-2' : 'min-w-0'}>
          {term ? (
            <section aria-live="polite" className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {results.length > 0
                  ? `${results.length} résultat${results.length > 1 ? 's' : ''} pour « ${search.trim()} »`
                  : `Aucun résultat pour « ${search.trim()} ».`}
              </p>
              {results.length > 0 ? (
                <Answers faqs={results} />
              ) : (
                <p>
                  Pas trouvé ? <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Écris-nous</Link>.
                </p>
              )}
            </section>
          ) : (
            <div className="space-y-14">
              {sections.map((section) => (
                <section key={section.value} id={section.value} className="scroll-mt-28 space-y-4">
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{categoryTitle(section.value)}</h2>
                  <Answers faqs={section.items} />
                </section>
              ))}
              <p className="border-t pt-8 text-foreground/80">
                Ta question n’est pas là ?{' '}
                <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                  Écris-nous
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
