import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Music2 } from 'lucide-react'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'
import { SectionHeader, containerClass } from '@/components/ds'
import { cn } from '@/lib/utils'

const LINK_GROUPS = [
  {
    title: 'Événements',
    links: [
      { label: 'Ultra Arena 2026', href: '/events/ultra-arena-2026' },
      { label: 'Les formats', href: '/events/formats' },
      { label: 'Les obstacles', href: '/obstacles' },
      { label: 'Devenir bénévole', href: '/volunteers' },
    ],
  },
  {
    title: 'Partenaires',
    links: [
      { label: 'Partenaires & presse', href: '/about/partners' },
      { label: 'Devenir partenaire', href: '/about/partners#contacts' },
    ],
  },
  {
    title: 'La tribu',
    links: [
      { label: 'Notre histoire', href: '/about/our-story' },
      // { label: "L'équipe", href: '/about/team' },
      { label: 'FAQ', href: '/about/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'CGU', href: '/cgu' },
      { label: 'CGV', href: '/cgv' },
      { label: 'Confidentialité', href: '/privacy-policies' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Règlement officiel', href: OFFICIAL_RULEBOOK_PDF_PATH },
      { label: 'Crédits', href: '/about/credits' },
    ],
  },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/overbound.race/', icon: Instagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@overbound.race', icon: Music2 },
]

export function Footer() {
  return (
    <footer className='relative overflow-hidden border-t border-border bg-surface-deep text-foreground'>
      <div className='relative flex w-full flex-col gap-12 pt-16 sm:gap-16 sm:pt-24'>
        <span
          aria-hidden
          className='pointer-events-none absolute right-[-5%] top-0 hidden font-display text-[18vw] font-bold uppercase leading-none text-foreground/2 lg:block'
        >
          Overbound
        </span>

        <div className={cn(containerClass(), 'relative z-10 text-center sm:text-left')}>
          <Link href="/" className="flex min-h-11 items-center justify-center sm:justify-start">
            <Image
              src="/images/brand/totem_logo_white.png"
              alt="OverBound Logo"
              width={64}
              height={64}
              className="w-8 md:w-10 lg:w-12 h-auto"
            />
          </Link>
          <SectionHeader
            className='mx-auto mt-4 sm:mx-0'
            eyebrow='Tribu Overbound'
            title='Plus qu’une course, une famille.'
            lead='Accède à ton compte, ouvre tes inscriptions Paris 2026, découvre les formats, la FAQ, notre histoire ou deviens bénévole. L’essentiel pour vivre l’expérience Overbound.'
            flush
          />
        </div>

        <div className='relative z-10 border-y border-border'>
          <div
            className={cn(
              containerClass(),
              'grid grid-cols-2 gap-8 py-12 text-sm text-muted-foreground lg:grid-cols-4 lg:gap-12',
            )}
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.title} className='space-y-4'>
                <h3 className='text-eyebrow font-semibold uppercase text-subtle'>{group.title}</h3>
                <ul className='space-y-2'>
                  {group.links.map((link) => (
                    // -my-3 pulls the <li>'s own extra height back out of the
                    // list's flow, so space-y-2 between items reads the same
                    // as before -- only the link's own tap target (below)
                    // grows, never the visible list rhythm (FDR-0015 §10).
                    <li key={link.href} className='-my-3'>
                      <Link
                        href={link.href}
                        className='inline-flex min-h-11 min-w-11 items-center py-3 font-medium transition duration-200 ease-standard hover:text-primary'
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            containerClass(),
            'relative z-10 -mt-4 flex flex-col gap-6 pb-12 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left',
          )}
        >
          <div className='flex flex-wrap items-center justify-center gap-4 sm:justify-start'>
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className='-my-3 flex min-h-11 min-w-11 items-center justify-center gap-2 py-3 transition duration-200 ease-standard hover:text-primary'
              >
                <Icon className='h-4 w-4' />
                <span className='hidden font-medium sm:inline'>{label}</span>
              </Link>
            ))}
          </div>
          <p>&copy; {new Date().getFullYear()} Overbound. Tous droits réservés.</p>
          <p className='text-subtle'>Fait avec la sueur et le cœur, par des passionnés.</p>
        </div>
      </div>
    </footer>
  )
}
