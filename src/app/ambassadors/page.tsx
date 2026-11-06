import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/hero/PageHero'
import { PublicAmbassadorCard } from '@/components/ambassadors/PublicAmbassadorCard'
import { Container, DISPLAY_TITLE, Section, SectionHeader } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { COVER } from '@/constants/coverImages'
import { loadPublicAmbassadors } from '@/lib/ambassadors/loadPublicAmbassadors'
import { ogImageUrl } from '@/lib/seo/ogImage'
import { loadOpenEventSlug } from '@/lib/events/loadOpenEventSlug'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const revalidate = 3600

const TITLE = 'Les ambassadeurs | Overbound Race'
const DESCRIPTION = 'Les coureurs qui font vivre Overbound autour d’eux. Rejoins la tribu avec leur code.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: 'https://overbound-race.com/ambassadors' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://overbound-race.com/ambassadors',
    siteName: 'Overbound Race',
    images: [ogImageUrl({ title: 'Les ambassadeurs', kicker: 'Overbound', photo: 'crowd' })],
    locale: 'fr_FR',
    type: 'website',
  },
}

const STEPS = [
  { num: '01', title: 'Choisis ton ambassadeur', text: 'Prends le lien ou le code d’un coureur dont tu veux suivre la tribu.' },
  { num: '02', title: 'Inscris-toi avec son code', text: 'Le lien l’applique seul : une réduction sur ton inscription.' },
  { num: '03', title: 'Cours avec sa tribu', text: 'Rejoins directement son équipe, ou cours à côté de lui.' },
] as const

/** Three steps on one track: a rule, a dot per step, big numerals. No icons, no cards. */
function HowItWorks() {
  return (
    <Section>
      <Container>
        <SectionHeader title="Comment ça marche" />
        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map(({ num, title, text }) => (
            <li key={num} className="relative border-t border-primary/40 pt-6">
              <span aria-hidden className="absolute -top-1.5 left-0 size-3 rounded-full bg-primary" />
              <span className={cn(DISPLAY_TITLE, 'block text-display-md text-primary')}>{num}</span>
              <h3 className={cn(DISPLAY_TITLE, 'mt-2 text-title')}>{title}</h3>
              <p className="mt-3 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}

/** Closing call to become an ambassador. Same wording for the empty state and the bottom of the page. */
function BecomeAmbassador() {
  return (
    <Section tone="deep" spacing="spacious" className="border-t border-primary/40">
      <Container className="text-center">
        <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>Tu veux faire courir ta tribu ?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lead text-muted-foreground">
          Les ambassadeurs reçoivent un code, un espace pour suivre leurs amis et des récompenses. Écris-nous pour rejoindre le programme.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="hero">
            <Link href="/contact">Devenir ambassadeur</Link>
          </Button>
        </div>
      </Container>
    </Section>
  )
}

export default async function AmbassadorsPage() {
  const admin = supabaseAdmin()
  const [ambassadors, eventSlug] = await Promise.all([loadPublicAmbassadors(admin), loadOpenEventSlug(admin)])

  // One card centers alone, two stay centered side by side, three or more fill the page grid.
  const gridClass =
    ambassadors.length === 1
      ? 'mx-auto grid max-w-sm gap-4 sm:gap-6'
      : ambassadors.length === 2
        ? 'mx-auto grid max-w-3xl gap-4 sm:grid-cols-2 sm:gap-6'
        : 'grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'

  return (
    <main className="w-full bg-background text-foreground">
      <PageHero
        image={{ src: COVER.pages.ambassadors, alt: 'Des coureurs Overbound portent un tronc ensemble sur le parcours' }}
        eyebrow="Les ambassadeurs"
        title="Ils font vivre la tribu"
        description="Des coureurs qui parlent d’Overbound autour d’eux. Leur code te fait gagner une réduction sur ton inscription, et tu peux rejoindre leur équipe."
      />
      <HowItWorks />
      <Section>
        <Container>
          {ambassadors.length > 0 ? (
            <ul className={gridClass}>
              {ambassadors.map((ambassador) => (
                <li key={ambassador.id}>
                  <PublicAmbassadorCard ambassador={ambassador} eventSlug={eventSlug} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <p className="text-lead text-muted-foreground">Pas encore d’ambassadeur affiché. Tu veux être le premier ?</p>
              <Button asChild variant="outline" size="cta">
                <Link href="/contact">Devenir ambassadeur</Link>
              </Button>
            </div>
          )}
        </Container>
      </Section>
      <BecomeAmbassador />
    </main>
  )
}
