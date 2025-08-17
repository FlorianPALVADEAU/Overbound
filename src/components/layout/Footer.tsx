import Link from 'next/link'
import { CalendarIcon, YoutubeIcon, InstagramIcon } from 'lucide-react'

export function Footer() {
  const footerNavigation = {
    main: [
        { name: 'Les courses', href: '/races'},
        { name: 'Les obstacles', href: '/obstacles'},
        { name: 'Entrainements', href: '/trainings'},
        { name: 'Shop', href: '/shop'},
        { name: 'Blog', href: '/blog'},
        { name: 'À propos', href: '/about'},
    ],
    legal: [
      { name: 'Conditions générales', href: '/cgu' },
      { name: 'Politique de confidentialité', href: '/privacy' },
      { name: 'Mentions légales', href: '/legal' },
    ],
    social: [
      {
        name: 'Tiktok',
        href: '#',
        icon: CalendarIcon,
      },
      {
        name: 'Instagram',
        href: '#',
        icon: InstagramIcon,
      },
      {
        name: 'Youtube',
        href: '#',
        icon: YoutubeIcon,
      },
    ],
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <span className="font-bold">OverBound</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              La plateforme de référence pour découvrir et participer aux événements sportifs et de bien-être.
            </p>
            <div className="flex space-x-4">
              {footerNavigation.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div>
              <h3 className="text-sm font-semibold leading-6">Navigation</h3>
              <ul role="list" className="mt-6 space-y-4">
                {footerNavigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold leading-6">Légal</h3>
              <ul role="list" className="mt-6 space-y-4">
                {footerNavigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} OverBound. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}