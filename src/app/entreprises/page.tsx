import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { PageHero } from '@/components/hero/PageHero'
import { EnterpriseFaq } from '@/components/b2b/EnterpriseFaq'
import { QuoteRequestForm } from '@/components/b2b/QuoteRequestForm'
import { StickyQuoteCta } from '@/components/b2b/StickyQuoteCta'
import SocialProof from '@/components/homepage/SocialProof'
import { Container, DISPLAY_TITLE, Section, SectionHeader, StatRow } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { COVER } from '@/constants/coverImages'
import {
  buildEnterpriseFaq,
  buildGoodToKnow,
  buildEnterpriseJsonLd,
  ENTERPRISE_PATH,
  ENTERPRISE_TITLE,
  enterpriseAnswer,
  enterpriseDescription,
} from '@/lib/b2b/enterpriseContent'
import {
  B2B_ADD_ONS,
  B2B_REFERENCE_PRICES_CENTS,
  buildDiscountLadder,
  describeTicketRange,
  formatEuros,
  quoteTeam,
} from '@/lib/b2b/offer'
import { safeJsonStringify } from '@/lib/safeJson'
import { loadNextEdition } from '@/lib/seo/loadNextEdition'
import { ogImageUrl } from '@/lib/seo/ogImage'
import { RANKED_FORMAT_RULES } from '@/constants/raceFormatRules'
import { FORMAT_FACTS, PILLAR_LINKS } from '@/lib/seo/siteFacts'
import { cn } from '@/lib/utils'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const description = enterpriseDescription()
  return {
    title: { absolute: ENTERPRISE_TITLE },
    description,
    alternates: { canonical: ENTERPRISE_PATH },
    openGraph: {
      title: ENTERPRISE_TITLE,
      description,
      url: ENTERPRISE_PATH,
      type: 'website',
      locale: 'fr_FR',
      images: [ogImageUrl({ title: 'Une course à obstacles pour vos équipes', kicker: 'Entreprises & CSE', photo: 'crowd' })],
    },
  }
}

const COHESION = [
  {
    title: "On s'entraide",
    text: "Porter un tronc, passer un mur, tirer un pneu : plusieurs obstacles se franchissent mieux à deux. Collègues d'un même service ou de services qui ne se croisent jamais, on avance ensemble.",
    image: COVER.enterprises.teamwork,
    alt: 'Deux participants portent un tronc ensemble',
  },
  {
    title: 'Un départ et une arrivée en équipe',
    text: `En RANKED, tout le monde part ensemble à ${RANKED_FORMAT_RULES.departure}. En OPEN, vous choisissez le même créneau de départ pour toute l'équipe, dans la limite des places. Chacun fait ses tours à son rythme.`,
    image: COVER.enterprises.together,
    alt: "Un groupe de participants réuni sous l'arche d'arrivée",
  },
  {
    title: "On en reparle le lundi",
    text: "Une médaille finisher pour chacun, des photos officielles après la course, et de quoi raconter la journée au bureau.",
    image: COVER.enterprises.memory,
    alt: 'Deux participantes qui courent en souriant',
  },
]

const STEPS = [
  { title: 'Vous nous écrivez', text: "Taille de l'équipe, format, options : quelques lignes suffisent." },
  { title: 'Nous vous répondons', text: "Vous recevez une offre chiffrée par e-mail, avec la facture à l'entreprise si vous la souhaitez." },
  { title: "L'équipe s'inscrit", text: 'Les billets sont émis au nom de chaque participant et envoyés par e-mail. Un responsable peut réserver pour tous en une seule commande.' },
]

function QuoteCta({ children = 'Demander un devis' }: { children?: string }) {
  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button asChild size="cta" className="w-full sm:w-auto">
        <a href="#devis">{children}</a>
      </Button>
    </div>
  )
}

export default async function EnterprisesPage() {
  const next = await loadNextEdition()
  const ladder = buildDiscountLadder()
  const faq = buildEnterpriseFaq(next)
  const team = quoteTeam(10)
  const goodToKnow = buildGoodToKnow(next)

  return (
    <main>
      {buildEnterpriseJsonLd(next).map((node, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(node) }} />
      ))}

      <PageHero
        image={{
          src: COVER.enterprises.hero,
          position: COVER.enterprises.heroPosition,
          alt: "Un groupe de participants Overbound qui fête l'arrivée",
        }}
        eyebrow="Team building sportif · Entreprises & CSE"
        eyebrowVariant="pill-soft"
        title="Une course à obstacles pour souder vos équipes"
        description={<p>{enterpriseAnswer(next)}</p>}
        actions={
          <>
            <Button asChild size="hero">
              <a href="#devis">Demander un devis</a>
            </Button>
            <Button asChild size="cta" variant="outline-on-photo">
              <a href="#tarifs">Voir les tarifs</a>
            </Button>
          </>
        }
        aside={
          <Card variant="photo" className="p-5">
            <p className={cn(DISPLAY_TITLE, 'text-title')}>Votre devis en 1 minute</p>
            <div className="mt-3">
              <QuoteRequestForm variant="compact" />
            </div>
          </Card>
        }
      />

      <Section spacing="compact">
        <Container>
          <StatRow
            stats={[
              { label: 'Participants en 2026', value: '300+' },
              { label: 'Longueur de la boucle', value: `${FORMAT_FACTS.loopKm} km` },
              { label: 'Obstacles par boucle', value: '10+' },
              { label: 'Formats au choix', value: '2' },
            ]}
          />
        </Container>
      </Section>

      <Section tone="deep">
        <Container>
          <SectionHeader
            eyebrow="Cohésion d'équipe"
            title="Des obstacles qui se franchissent à plusieurs"
            lead="Porter, tirer, enjamber, grimper : une journée dehors, et aucun niveau requis en format OPEN."
          />
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {COHESION.map((item) => (
              <Card key={item.title} variant="feature" className="overflow-hidden">
                <div className="relative aspect-4/3 w-full">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className={cn(DISPLAY_TITLE, 'text-title')}>{item.title}</h3>
                  <p className="mt-3 text-muted-foreground">{item.text}</p>
                </div>
              </Card>
            ))}
          </div>
          <QuoteCta>Je veux un devis pour mon équipe</QuoteCta>
        </Container>
      </Section>

      <SocialProof
        title="Ils l'ont vécu, ils en parlent"
        lead="Les participants de l'édition 2026 racontent leur journée."
      />

      <Section id="tarifs" className="scroll-mt-16">
        <Container size="prose">
          <SectionHeader
            eyebrow="Tarifs groupe"
            title="Plus vous êtes nombreux, moins le billet coûte"
            lead="La remise s'applique à tous les billets d'une même commande, sans code à saisir. Les billets OPEN et RANKED comptent ensemble."
          />
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs min-[360px]:text-sm sm:text-base">
              <caption className="sr-only">Remise de groupe par nombre de billets, prix d'un billet OPEN et d'un billet RANKED</caption>
              <thead className="bg-card text-label font-semibold uppercase text-subtle">
                <tr>
                  <th scope="col" className="p-2 min-[360px]:p-3 sm:px-6 sm:py-4">Billets</th>
                  <th scope="col" className="p-2 min-[360px]:p-3 sm:px-6 sm:py-4">Remise</th>
                  <th scope="col" className="p-2 text-right min-[360px]:p-3 sm:px-6 sm:py-4">OPEN</th>
                  <th scope="col" className="p-2 text-right min-[360px]:p-3 sm:px-6 sm:py-4">RANKED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="text-muted-foreground">
                  <th scope="row" className="p-2 font-semibold min-[360px]:p-3 sm:px-6 sm:py-4">1</th>
                  <td className="p-2 min-[360px]:p-3 sm:px-6 sm:py-4">-</td>
                  <td className="p-2 text-right min-[360px]:p-3 sm:px-6 sm:py-4">{formatEuros(B2B_REFERENCE_PRICES_CENTS.open)}</td>
                  <td className="p-2 text-right min-[360px]:p-3 sm:px-6 sm:py-4">{formatEuros(B2B_REFERENCE_PRICES_CENTS.ranked)}</td>
                </tr>
                {ladder.map((row) => (
                  <tr key={row.minTickets}>
                    <th scope="row" className="p-2 font-semibold min-[360px]:p-3 sm:px-6 sm:py-4">{describeTicketRange(row)}</th>
                    <td className="p-2 min-[360px]:p-3 sm:px-6 sm:py-4">-{row.percent} %</td>
                    <td className="p-2 text-right font-semibold text-primary min-[360px]:p-3 sm:px-6 sm:py-4">{formatEuros(row.openUnitCents)}</td>
                    <td className="p-2 text-right font-semibold text-primary min-[360px]:p-3 sm:px-6 sm:py-4">{formatEuros(row.rankedUnitCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>
              Exemple : {team.tickets} collaborateurs en OPEN, {formatEuros(team.totalCents)} au lieu de {formatEuros(team.fullPriceCents)}.
            </li>
            <li>Prix par billet, toutes taxes comprises (TTC).</li>
            <li>Pas de cumul avec un code promo : la réduction la plus avantageuse s'applique.</li>
          </ul>
          <QuoteCta />
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="À savoir avant de réserver"
            title="Ce que votre équipe doit savoir"
            lead="Les points que les RH et les CSE nous demandent le plus souvent."
          />
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {goodToKnow.map((item) => (
              <Card key={item.title} variant="info" className="p-4 sm:p-6">
                <h3 className={cn(DISPLAY_TITLE, 'text-title')}>{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.text}</p>
              </Card>
            ))}
          </div>
          <nav aria-label="Pour aller plus loin" className="mt-8">
            <p className="text-sm text-muted-foreground">Pour aller plus loin</p>
            <ul className="mt-1 flex flex-wrap gap-x-6">
              {[
                { href: '/events/formats', label: 'Comparer OPEN et RANKED' },
                { href: '/obstacles', label: 'Voir les obstacles' },
                PILLAR_LINKS.paris,
                PILLAR_LINKS.facts,
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </Section>

      <Section tone="deep">
        <Container>
          <SectionHeader
            eyebrow="En option"
            title="Options et projets sur mesure"
            lead="Ces options ne sont pas comprises dans le billet : vous les ajoutez à la commande, pour tout ou partie de l'équipe."
          />
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="info" className="p-4 sm:p-6">
              <h3 className={cn(DISPLAY_TITLE, 'text-title')}>T-shirt finisher</h3>
              <p className="mt-2 font-display text-2xl font-bold text-primary">+ {formatEuros(B2B_ADD_ONS.tshirtCents)}</p>
              <p className="mt-3 text-muted-foreground">Par personne, en plus du billet. Non inclus dans le prix du billet.</p>
            </Card>
            <Card variant="info" className="p-4 sm:p-6">
              <h3 className={cn(DISPLAY_TITLE, 'text-title')}>Pack photo</h3>
              <p className="mt-2 font-display text-2xl font-bold text-primary">+ {formatEuros(B2B_ADD_ONS.photoPackPresaleCents)}</p>
              <p className="mt-3 text-muted-foreground">
                Par personne, en plus du billet, si commandé avant l'événement. {formatEuros(B2B_ADD_ONS.photoPackAfterEventCents)} ensuite.
              </p>
            </Card>
            <Card variant="info" className="p-4 sm:p-6">
              <h3 className={cn(DISPLAY_TITLE, 'text-title')}>Sur mesure</h3>
              <p className="mt-3 text-muted-foreground">
                Challenge inter-services, séminaire, journée d'équipe : décrivez votre projet, nous étudions ce qui est possible.
              </p>
            </Card>
            <Card variant="info" className="p-4 sm:p-6">
              <h3 className={cn(DISPLAY_TITLE, 'text-title')}>Partenariat</h3>
              <p className="mt-3 text-muted-foreground">Logo, stand au village, mentions sur nos réseaux.</p>
              <Link href="/about/partners" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                Voir les partenaires →
              </Link>
            </Card>
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="prose">
          <SectionHeader eyebrow="Comment ça se passe" title="De la demande au départ" />
          <ol className="grid gap-4 sm:gap-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className={cn(DISPLAY_TITLE, 'text-title')}>{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <QuoteCta />
        </Container>
      </Section>

      <EnterpriseFaq items={faq} />

      <Section
        id="devis"
        tone="deep"
        spacing="compact"
        className="scroll-mt-16 border-t border-primary/40 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center"
      >
        <Container className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
          <div>
            <SectionHeader
              eyebrow="Devis"
              title="Parlez-nous de votre équipe"
              lead="Quelques informations suffisent. Vous recevez une confirmation par e-mail, puis une offre."
              flush
            />
            <p className="mt-3 text-sm text-muted-foreground sm:hidden">Remise automatique · Facture entreprise · Sans engagement</p>
            <ul className="mt-6 hidden grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid sm:grid-cols-2 sm:text-base lg:grid-cols-1">
              {['Remise de groupe automatique', "Facture au nom de l'entreprise", 'Même créneau de départ pour l\'équipe', 'Aucun engagement à ce stade'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 hidden text-sm text-muted-foreground lg:block">
              Vous préférez écrire ?{' '}
              <a href="mailto:contact@overbound-race.com" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
                contact@overbound-race.com
              </a>
            </p>
          </div>
          <Card variant="info" className="p-4 sm:p-6">
            <QuoteRequestForm />
          </Card>
        </Container>
      </Section>

      <StickyQuoteCta />
    </main>
  )
}
