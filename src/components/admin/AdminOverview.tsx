import Link from 'next/link'
import { BarChart3, CreditCard, Database, Mail, NotebookPen } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { AdminStats } from '@/components/admin/AdminStats'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const externalLinks = [
  {
    label: 'Google Analytics',
    href: 'https://analytics.google.com/',
    icon: BarChart3,
    description: 'Trafic, conversions et événements GTM.',
  },
  {
    label: 'Stripe',
    href: 'https://dashboard.stripe.com/',
    icon: CreditCard,
    description: 'Paiements, remboursements et abonnements.',
  },
  {
    label: 'Resend',
    href: 'https://resend.com/dashboard',
    icon: Mail,
    description: 'Logs emailing et délivrabilité.',
  },
  {
    label: 'Supabase',
    href: 'https://supabase.com/dashboard',
    icon: Database,
    description: 'Base de données, stockages et logs API.',
  },
  {
    label: 'Sanity Studio',
    href: 'https://www.sanity.io/manage',
    icon: NotebookPen,
    description: 'CMS, contenus éditoriaux et médias.',
  },
]

/** Landing page of the back-office: key figures, charts and shortcuts to the external tools. */
export function AdminOverview({ stats }: { stats?: Record<string, unknown> | null }) {
  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow="Administration" title="Tableau de bord" description="Événements, inscrits et opérations terrain." />
      <AdminStats stats={stats} />
      <Card variant="info">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Accès rapide aux outils</CardTitle>
            <CardDescription>Analyse, paiement, emailing et back-office data en un clic.</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit">Raccourcis</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {externalLinks.map(({ label, href, icon: Icon, description }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-border bg-muted/40 p-4 transition duration-200 ease-standard hover:border-primary/60 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <span aria-hidden className="text-xs text-muted-foreground group-hover:text-primary">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
