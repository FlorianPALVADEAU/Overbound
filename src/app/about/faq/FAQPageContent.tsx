'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Mail,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import RichText from '@/components/RichText'
import type { PortableTextBlock } from '@portabletext/types'

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

type CategoryMeta = {
  value: string
  title: string
  description: string
  icon: LucideIcon
  anchor: string
}

const CATEGORY_META: CategoryMeta[] = [
  {
    value: 'inscriptions',
    title: 'Inscriptions & billetterie',
    description: 'Tout ce qu’il faut savoir avant de réserver ta place.',
    icon: Ticket,
    anchor: 'inscriptions',
  },
  {
    value: 'documents',
    title: 'Documents & validation',
    description: 'Certificat médical, contrôle des pièces et sécurité.',
    icon: FileText,
    anchor: 'documents',
  },
  {
    value: 'preparation',
    title: 'Préparation & entraînement',
    description: 'Comment arriver prêt le jour J et progresser.',
    icon: Sparkles,
    anchor: 'preparation',
  },
  {
    value: 'logistique',
    title: 'Logistique & jour J',
    description: 'Accès, horaires, consignes et expérience sur site.',
    icon: MapPin,
    anchor: 'logistique',
  },
  {
    value: 'apres-course',
    title: 'Après la course & communauté',
    description: 'Prolonge l’expérience Overbound une fois la ligne franchie.',
    icon: Users,
    anchor: 'apres-course',
  },
  {
    value: 'presse',
    title: 'Partenariats & presse',
    description: 'Coordination médias, sponsors et projets spéciaux.',
    icon: ShieldCheck,
    anchor: 'presse',
  },
]

const highlightTopics = [
  {
    title: 'Modifier mon inscription',
    description: 'Changer de format, transférer un billet, mise à jour du profil.',
    href: '#inscriptions',
    icon: Ticket,
  },
  {
    title: 'Envoyer mes documents',
    description: 'Certificats médicaux, autorisations parentales, validations.',
    href: '#documents',
    icon: FileText,
  },
  {
    title: 'Préparer mon équipement',
    description: 'Plans d’entraînement, checklist, conseils de coachs.',
    href: '#preparation',
    icon: Sparkles,
  },
]

const SupportCard = () => (
  <div className="flex flex-col gap-6 rounded-3xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#26AA26]">Toujours là pour toi</p>
      <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">Besoin d’une réponse personnalisée ?</h3>
      <p className="text-sm text-gray-600 sm:text-base">
        Notre équipe support te répond du lundi au vendredi en moins de 24&nbsp;heures (48&nbsp;h en période de course).
      </p>
      <div className="flex flex-col gap-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#26AA26]" />
          <span>contact@overbound-race.com</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#26AA26]" />
          <span>Formulaire de contact (réponse sous 24&nbsp;h)</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-3 sm:w-48">
      <Button asChild className="h-11 bg-[#26AA26] text-white hover:bg-[#1e8a1e]">
        <Link href="/contact">Contacter le support</Link>
      </Button>
      <Button asChild variant="outline" className="h-11 border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10">
        <Link href="/trainings/what-race-for-me">Trouver mon format</Link>
      </Button>
    </div>
  </div>
)

interface FAQPageContentProps {
  faqs: FAQDocument[]
}

function groupByCategory(faqs: FAQDocument[]) {
  return faqs.reduce<Record<string, FAQDocument[]>>((acc, faq) => {
    const key = faq.category || 'autres'
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key]?.push(faq)
    return acc
  }, {})
}

const DEFAULT_CATEGORY_META: CategoryMeta = {
  value: 'autres',
  title: 'Autres questions',
  description: 'Toutes les autres réponses utiles.',
  icon: LifeBuoy,
  anchor: 'autres',
}

const categoryMetaMap = CATEGORY_META.reduce<Record<string, CategoryMeta>>((acc, meta) => {
  acc[meta.value] = meta
  return acc
}, { [DEFAULT_CATEGORY_META.value]: DEFAULT_CATEGORY_META })

const FAQPageContent = ({ faqs }: FAQPageContentProps) => {
  const [searchTerm, setSearchTerm] = useState('')

  const grouped = useMemo(() => {
    const grouping = groupByCategory(faqs)
    Object.values(grouping).forEach((list) => {
      list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title))
    })
    return grouping
  }, [faqs])

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return []
    }
    return faqs.filter((faq) => {
      const content = [faq.title, faq.shortAnswer, faq.subCategory, ...(faq.keywords || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesMeta = content.includes(term)
      if (matchesMeta) return true
      if (faq.answer && faq.answer.length > 0) {
        return JSON.stringify(faq.answer).toLowerCase().includes(term)
      }
      return false
    })
  }, [faqs, searchTerm])

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#f7f9f6] to-white">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {searchTerm.trim() ? <SearchResults searchTerm={searchTerm} results={searchResults} /> : null}

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-12 sm:px-6 sm:pb-16">
        {CATEGORY_META.map((meta) => {
          const items = grouped[meta.value]
          if (!items || items.length === 0) {
            return null
          }
          return (
            <CategorySection key={meta.value} meta={meta} faqs={items} />
          )
        })}

        {grouped[DEFAULT_CATEGORY_META.value]?.length ? (
          <CategorySection meta={DEFAULT_CATEGORY_META} faqs={grouped[DEFAULT_CATEGORY_META.value] as FAQDocument[]} />
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        <SupportCard />
      </section>

      <Footer />
    </main>
  )
}

const Header = ({
  searchTerm,
  setSearchTerm,
}: {
  searchTerm: string
  setSearchTerm: (value: string) => void
}) => (
  <section className="relative overflow-hidden bg-white">
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#26AA26]/10 via-transparent to-transparent" />
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:gap-16 lg:py-24">
      <div className="flex-1 space-y-6 text-center lg:text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#26AA26]/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-[#26AA26]">
          <ShieldCheck className="h-4 w-4" />
          FAQ officielle Overbound
        </span>
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
          Toutes les réponses pour vivre l’expérience Overbound sereinement
        </h1>
        <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
          Inscriptions, documents, préparation, logistique ou vie de la tribu : nous avons rassemblé les questions qui reviennent le plus souvent.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              type="search"
              placeholder="Rechercher une question (ex. certificat médical, transfert de billet…)"
              className="w-full rounded-full border border-gray-200 bg-white px-12 py-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#26AA26] focus:ring-2 focus:ring-[#26AA26]/40"
            />
          </div>
          <Button asChild variant="outline" className="h-12 rounded-full border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10">
            <Link href="#inscriptions">Explorer les thèmes</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900">Sommaire express</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {highlightTopics.map((topic) => (
            <Link
              key={topic.title}
              href={topic.href}
              className="group flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left transition hover:border-[#26AA26]/50 hover:bg-[#26AA26]/5"
            >
              <topic.icon className="mt-1 h-5 w-5 text-[#26AA26]" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{topic.title}</p>
                <p className="text-xs text-gray-500">{topic.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#26AA26]/20 bg-[#26AA26]/10 p-4 text-sm text-[#145814]">
          <LifeBuoy className="h-5 w-5" />
          <span>
            Tu préfères échanger avec un humain ? Notre tribu support est joignable à{' '}
            <Link href="mailto:contact@overbound-race.com" className="underline">
              contact@overbound-race.com
            </Link>{' '}
            ou via le chat en direct.
          </span>
        </div>
      </div>
    </div>
  </section>
)

const SearchResults = ({
  searchTerm,
  results,
}: {
  searchTerm: string
  results: FAQDocument[]
}) => (
  <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6 sm:pb-16">
    <div className="mb-4 flex items-center gap-3 text-sm text-gray-600">
      <MessageCircle className="h-4 w-4 text-[#26AA26]" />
      <span>
        {results.length > 0
          ? `${results.length} réponse${results.length > 1 ? 's' : ''} correspondant à "${searchTerm}"`
          : `Aucun résultat correspondant à "${searchTerm}". Contacte-nous pour une réponse personnalisée.`}
      </span>
    </div>
    <div className="space-y-4">
      {results.length > 0 ? (
        results.map((faq) => (
          <article
            key={faq._id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#26AA26]/40 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#26AA26]">
              {categoryMetaMap[faq.category]?.title || 'FAQ Overbound'}
            </p>
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">{faq.title}</h3>
            <div className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
              {faq.answer && faq.answer.length ? <RichText value={faq.answer} /> : faq.shortAnswer}
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 text-center text-sm text-gray-600 shadow-sm">
          <p className="mb-2 font-semibold text-gray-800">Toujours pas trouvé ?</p>
          <p className="mb-4">
            Nous sommes à un message de toi. Clique sur “Contacter le support” pour échanger directement avec la tribu.
          </p>
          <Button asChild className="bg-[#26AA26] text-white hover:bg-[#1e8a1e]">
            <Link href="/contact">Écrire au support</Link>
          </Button>
        </div>
      )}
    </div>
  </section>
)

const CategorySection = ({ meta, faqs }: { meta: CategoryMeta; faqs: FAQDocument[] }) => (
  <section
    id={meta.anchor}
    className="scroll-mt-24 rounded-3xl border border-[#26AA26]/10 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8"
  >
    <header className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#26AA26]/10 text-[#26AA26]">
          <meta.icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{meta.title}</h2>
          <p className="text-sm text-gray-600 sm:text-base">{meta.description}</p>
        </div>
      </div>
      <Link
        href={`/contact?subject=${encodeURIComponent(`Question ${meta.title}`)}`}
        className="text-sm font-semibold text-[#26AA26] hover:underline"
      >
        Besoin d’aide supplémentaire ?
      </Link>
    </header>
    <div className="space-y-4">
      {faqs.map((faq) => (
        <FAQEntry key={faq._id} faq={faq} />
      ))}
    </div>
  </section>
)

const FAQEntry = ({ faq }: { faq: FAQDocument }) => {
  const [open, setOpen] = useState(false)

  return (
    <article
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition',
        open ? 'border-[#26AA26]/40 shadow-md' : 'hover:border-[#26AA26]/30 hover:shadow-md',
      )}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <span className="text-base font-semibold text-gray-900 sm:text-lg">{faq.title}</span>
          {!open && faq.shortAnswer ? (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500 sm:text-base">{faq.shortAnswer}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition',
            open ? 'rotate-180 bg-[#26AA26]/10 text-[#26AA26]' : 'bg-white',
          )}
        >
          <ChevronIcon />
        </span>
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          open ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden text-sm leading-relaxed text-gray-600 sm:text-base">
          {faq.answer && faq.answer.length ? <RichText value={faq.answer} /> : <p>{faq.shortAnswer}</p>}
          {faq.relatedLinks && faq.relatedLinks.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#26AA26] sm:text-sm">
              {faq.relatedLinks.map((link) => (
                <Link
                  key={`${faq._id}-${link.href}`}
                  href={link.href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-[#26AA26]/40 px-3 py-1 hover:bg-[#26AA26]/10"
                >
                  ↗ {link.label || 'Lien utile'}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

const Footer = () => (
  <footer className="bg-[#0f1b12] py-12 text-white">
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#26AA26]">Overbound FAQ</p>
        <h3 className="text-2xl font-bold">Tu veux aller plus loin ?</h3>
        <p className="text-sm text-white/70 sm:text-base">
          Abonne-toi à notre newsletter pour recevoir des plans d’entraînement exclusifs, des avant-premières et les ouvertures de billetterie.
        </p>
      </div>
      <Button asChild variant="outline" className="h-12 rounded-full border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10">
        <Link href="/newsletter">Je rejoins la tribu</Link>
      </Button>
    </div>
  </footer>
)

const ChevronIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.586l3.71-3.354a.75.75 0 111.02 1.096l-4.25 3.845a.75.75 0 01-1.02 0l-4.25-3.845a.75.75 0 01.02-1.118z"
      clipRule="evenodd"
    />
  </svg>
)

export default FAQPageContent
