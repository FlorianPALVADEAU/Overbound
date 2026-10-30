import { COVER } from '@/constants/coverImages'
import Link from 'next/link'
import { PageHero } from '@/components/hero/PageHero'
import { ContactForm } from '@/components/contact/ContactForm'
import { containerClass } from '@/components/ds'
import { cn } from '@/lib/utils'

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/overbound.race/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@overbound.race' },
]

const SHORTCUTS = [
  { label: 'Une question sur ton billet ou la course ?', cta: 'Voir la FAQ', href: '/about/faq' },
  { label: 'Une équipe ou une entreprise ?', cta: 'Offre entreprises', href: '/entreprises' },
  { label: 'Partenaire ou journaliste ?', cta: 'Partenaires & presse', href: '/about/partners' },
  { label: 'Envie de donner un coup de main ?', cta: 'Devenir bénévole', href: '/volunteers' },
]

export default function ContactPage() {
  return (
    <main className="w-full bg-background">
      <PageHero
        image={{
          src: COVER.pages.contact,
          alt: 'Discussion en cercle lors d’un échauffement Overbound',
        }}
        eyebrow="Contact"
        title="Une question ? Écris-nous."
        description="On répond par e-mail, dans les plus brefs délais."
      />

      <section className={cn(containerClass(), 'grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16')}>
        <ContactForm />

        <aside className="min-w-0 space-y-10 lg:border-l lg:pl-10">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Par e-mail</h2>
            <a
              href="mailto:contact@overbound-race.com"
              className="block break-words py-2 text-lg font-semibold text-primary underline-offset-4 hover:underline"
            >
              contact@overbound-race.com
            </a>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Sur les réseaux</h2>
            <ul className="space-y-1">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-foreground/80 hover:text-primary hover:underline"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <ul className="space-y-5 border-t pt-8">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.href} className="space-y-1 text-sm">
                <p className="text-muted-foreground">{shortcut.label}</p>
                <Link href={shortcut.href} className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">
                  {shortcut.cta} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  )
}
