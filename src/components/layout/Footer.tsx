import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Youtube, Music2 } from 'lucide-react'

const LINK_GROUPS = [
  {
    title: 'Explorer',
    links: [
      { label: 'Accueil', href: '/' },
      { label: 'Les courses', href: '/events' },
      { label: 'Les obstacles', href: '/obstacles' },
      { label: 'Blog', href: '/blog' },
      { label: 'Catégories', href: '/blog/categories' },
      { label: 'Auteurs', href: '/blog/auteurs' },
    ],
  },
  {
    title: 'S’entraîner',
    links: [
      { label: 'Entraînements', href: '/trainings' },
      { label: 'Plans d’entraînement', href: '/trainings/plans' },
      { label: 'Test de fitness', href: '/trainings/fitness-test' },
      { label: 'Nutrition', href: '/trainings/nutrition' },
      { label: 'Quel format pour moi ?', href: '/trainings/what-race-for-me' },
    ],
  },
  {
    title: 'La tribu',
    links: [
      { label: 'Volontaires', href: '/volunteers' },
      { label: 'Concept', href: '/about/concept' },
      { label: 'Notre histoire', href: '/about/our-story' },
      { label: 'Équipe', href: '/about/team' },
      { label: 'FAQ', href: '/about/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Conditions générales', href: '/cgu' },
      { label: 'Politique de confidentialité', href: '/privacy-policies' },
    ],
  },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/overbound', icon: Instagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@overbound', icon: Music2 },
  { label: 'YouTube', href: 'https://youtube.com/@overbound', icon: Youtube },
]

export function Footer() {
  return (
    <footer className='relative overflow-hidden border-t bg-background text-foreground'>
      <div className='relative flex w-full flex-col gap-12 pt-16 sm:gap-16 sm:pt-24 lg:pt-28'>
        <span className='pointer-events-none absolute right-[-5%] top-0 hidden text-[18vw] font-black uppercase leading-none text-foreground/2 lg:block'>
          Overbound
        </span>

        <div className='relative z-10 space-y-4 px-6 text-center sm:text-left sm:px-6 xl:px-32'>
          <Link href="/" className="flex items-center justify-center sm:justify-start">
            <Image
              src="/images/totem_logo_white.png"
              alt="OverBound Logo"
              width={64}
              height={64}
              className="w-8 md:w-10 lg:w-12 h-auto"
            />
          </Link>
          <p className='text-xs uppercase tracking-[0.6em] text-muted-foreground'>Tribu Overbound</p>
          <h2 className='text-3xl font-semibold sm:text-4xl md:text-5xl'>Plus qu’une course, une famille.</h2>
          <p className='text-base text-muted-foreground sm:max-w-2xl'>
            Explore toutes nos pages pour vivre l’expérience Overbound, t’entraîner, rejoindre les volontaires ou
            simplement nous poser tes questions. Tout est là, prêt pour toi.
          </p>
        </div>

        <div className='relative z-10 grid gap-8 border-y border-border/60 px-6 py-12 text-sm text-muted-foreground sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-12 xl:px-32'>
          {LINK_GROUPS.map((group) => (
            <div key={group.title} className='space-y-4'>
              <h3 className='text-sm font-semibold uppercase tracking-[0.35em] text-foreground/70'>{group.title}</h3>
              <ul className='space-y-2'>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className='inline-flex font-medium transition hover:text-primary'>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='-mt-4 relative z-10 flex flex-col gap-6 px-6 pb-12 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left xl:px-32'>
          <div className='flex flex-wrap items-center justify-center gap-4 sm:justify-start'>
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href} className='flex items-center gap-2 transition hover:text-primary'>
                <Icon className='h-4 w-4' />
                <span className='hidden text-sm font-medium sm:inline'>{label}</span>
              </Link>
            ))}
          </div>
          <p className='text-sm'>&copy; {new Date().getFullYear()} Overbound. Tous droits réservés.</p>
          <p className='text-sm text-muted-foreground/80'>
            Fait avec la sueur et le cœur par des passionnés.
          </p>
        </div>
      </div>
    </footer>
  )
}
