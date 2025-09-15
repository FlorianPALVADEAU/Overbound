import Link from 'next/link'
import { CalendarIcon, YoutubeIcon, InstagramIcon } from 'lucide-react'

export function Footer() {
  const footerNavigation = {
    main: [
        { name: 'Les courses', href: '/races'},
        { name: 'Les obstacles', href: '/obstacles'},
        { name: 'Entrainements', href: '/trainings'},
        // { name: 'Shop', href: '/shop'},
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
      {/* Version desktop : ton design original exact */}
      <div className="hidden lg:block mx-auto px-32 py-12">
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

      {/* Version mobile/tablette : layout adapté */}
      <div className="lg:hidden mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-8">
          
          {/* Logo et description */}
          <div className="text-center sm:text-left space-y-4">
            <Link href="/" className="flex items-center justify-center sm:justify-start space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg">OverBound</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto sm:mx-0">
              La plateforme de référence pour découvrir et participer aux événements sportifs et de bien-être.
            </p>
          </div>

          {/* Réseaux sociaux */}
          <div className="flex justify-center sm:justify-start space-x-6">
            {footerNavigation.social.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" />
              </Link>
            ))}
          </div>

          {/* Navigation et Légal en colonnes sur tablette, empilés sur mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
            
            {/* Navigation */}
            <div>
              <h3 className="text-sm font-semibold leading-6 mb-4">Navigation</h3>
              <ul role="list" className="space-y-3">
                {footerNavigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Légal */}
            <div>
              <h3 className="text-sm font-semibold leading-6 mb-4">Légal</h3>
              <ul role="list" className="space-y-3">
                {footerNavigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} OverBound™. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}