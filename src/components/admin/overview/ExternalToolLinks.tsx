import { BarChart3, CreditCard, Database, ExternalLink, Mail, NotebookPen } from 'lucide-react'
import { Disclosure } from '@/components/ds'

const TOOLS = [
  { label: 'Google Analytics', href: 'https://analytics.google.com/', icon: BarChart3, description: 'Trafic, conversions et événements GTM.' },
  { label: 'Stripe', href: 'https://dashboard.stripe.com/', icon: CreditCard, description: 'Paiements, litiges, virements.' },
  { label: 'Resend', href: 'https://resend.com/dashboard', icon: Mail, description: 'Emails transactionnels et délivrabilité.' },
  { label: 'Supabase', href: 'https://supabase.com/dashboard', icon: Database, description: 'Base de données, stockage et logs API.' },
  { label: 'Sanity Studio', href: 'https://www.sanity.io/manage', icon: NotebookPen, description: 'Contenus éditoriaux et médias.' },
]

/** Tools outside the back-office. Folded: they are a last resort, not the landing page. */
export function ExternalToolLinks() {
  return (
    <Disclosure title="Outils externes" summary="Analytics, Stripe, Resend, Supabase, Sanity">
      <ul className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map(({ label, href, icon: Icon, description }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors duration-200 ease-standard hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </Disclosure>
  )
}
