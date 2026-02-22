'use client'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminStats } from '@/components/admin/AdminStats'
import { VolunteerAccessControl } from '@/components/admin/VolunteerAccessControl'
import { EventsSection } from '@/components/admin/events'
import { RegistrationsSection } from '@/components/admin/registrations'
import { TicketsSection } from '@/components/admin/tickets'
import { RacesSection } from '@/components/admin/races'
import { ObstaclesSection } from '@/components/admin/obstacles'
import { PromotionalCodesSection } from '@/components/admin/promotional-codes'
import { PromotionsSection } from '@/components/admin/promotions'
import { UpsellsSection } from '@/components/admin/upsells'
import { AdminLogsSection } from '@/components/admin/logs/AdminLogsSection'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ADMIN_NAV_ITEMS, ADMIN_NAV_GROUPS } from '@/components/admin/adminNavItems'
import { AdminEmailPlayground } from '@/components/admin/emails/AdminEmailPlayground'
import { DistributionListsSection } from '@/components/admin/distribution-lists/DistributionListsSection'
import { UsersSection } from '@/components/admin/users/UsersSection'
import { AmbassadorsSection } from '@/components/admin/ambassadors/AmbassadorsSection'
import { ADMIN_TAB_VALUES, useAdminDashboardStore, type AdminTabValue } from '@/store/useAdminDashboardStore'
import { BarChart3, CreditCard, Database, Mail, NotebookPen, Sparkles } from 'lucide-react'

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

interface Profile {
  role: 'admin' | 'volunteer'
  full_name?: string
}

interface DashboardUser {
  id: string
  email?: string | null
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

interface AdminDashboardProps {
  user: DashboardUser
  profile: Profile
  stats?: Record<string, unknown> | null
}

export function AdminDashboard({ user, profile, stats }: AdminDashboardProps) {
  const { activeTab, setActiveTab } = useAdminDashboardStore()
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const isAdmin = profile.role === 'admin'
  const isVolunteer = profile.role === 'volunteer'

  const activeTabLabel = useMemo(
    () => ADMIN_NAV_ITEMS.find((item) => item.value === activeTab)?.label ?? 'Tableau de bord',
    [activeTab]
  )

  useEffect(() => {
    if (!tabParam) return
    if (ADMIN_TAB_VALUES.includes(tabParam as AdminTabValue)) {
      setActiveTab(tabParam as AdminTabValue)
    }
  }, [tabParam, setActiveTab])

  if (isVolunteer && !isAdmin) {
    return (
      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Bénévole - Check-in</h1>
              <p className="text-muted-foreground">
                Bienvenue {profile.full_name || user.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">Bénévole</Badge>
              <Link href="/account">
                <Button variant="outline" size="sm">
                  Mon compte
                </Button>
              </Link>
            </div>
          </header>
          <VolunteerAccessControl />
          <Card>
            <CardHeader>
              <CardTitle>Contact responsable</CardTitle>
              <CardDescription>Besoin d&apos;aide ? Voici les coordonnées du responsable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Florian PALVADEAU</p>
              <p>
                <a className="hover:underline" href="tel:0652266054">
                  06 52 26 60 54
                </a>
              </p>
              <p>
                <a className="hover:underline" href="mailto:florian.plvd@gmail.com">
                  florian.plvd@gmail.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen w-full flex-col md:flex-row md:gap-6 lg:gap-10 px-0 md:px-6 lg:px-10 py-6">
        <AdminSidebar profileRole={profile.role} fullName={profile.full_name || user.email} />
        <div className="flex-1 overflow-hidden rounded-t-3xl bg-background shadow md:rounded-3xl">
          <div className="flex flex-col gap-4 border-b border-border bg-background/80 px-4 py-4 backdrop-blur md:px-6 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-4 w-4" />
                  Command Center
                </div>
                <div>
                  <h1 className="text-2xl font-semibold lg:text-3xl">
                    {profile.full_name || user.email}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Pilote tes opérations et saute vers tes outils clés en un clic.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Administrateur</Badge>
                <Link href="/account">
                  <Button variant="outline" size="sm">
                    Mon compte
                  </Button>
                </Link>
              </div>
            </div>

            <QuickLinksStrip />

            <div className="md:hidden">
              <Select
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as AdminTabValue)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Tableau de bord</SelectItem>
                  <SelectSeparator />
                  {ADMIN_NAV_GROUPS.map((group, i) => (
                    <React.Fragment key={group.id}>
                      <SelectGroup>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.items.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {i < ADMIN_NAV_GROUPS.length - 1 && <SelectSeparator />}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="hidden text-sm font-medium text-muted-foreground md:block">
              Section actuelle : {activeTabLabel}
            </p>
          </div>

          <div className="space-y-6 px-4 py-6 md:px-6 lg:px-10">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as AdminTabValue)}
              className="space-y-6"
            >
              <TabsContent value="overview" className="space-y-6">
                <OverviewPanels stats={stats} />
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <EventsSection />
              </TabsContent>

              <TabsContent value="races" className="space-y-6">
                <RacesSection />
              </TabsContent>

              <TabsContent value="obstacles" className="space-y-6">
                <ObstaclesSection />
              </TabsContent>

              <TabsContent value="tickets" className="space-y-6">
                <TicketsSection />
              </TabsContent>

              <TabsContent value="promocodes" className="space-y-6">
                <PromotionalCodesSection />
              </TabsContent>

              <TabsContent value="promotions" className="space-y-6">
                <PromotionsSection />
              </TabsContent>

              <TabsContent value="upsells" className="space-y-6">
                <UpsellsSection />
              </TabsContent>

              <TabsContent value="ambassadors" className="space-y-6">
                <AmbassadorsSection />
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <UsersSection />
              </TabsContent>

              <TabsContent value="members" className="space-y-6">
                <RegistrationsSection eventId={selectedEventId} />
              </TabsContent>

              <TabsContent value="checkin" className="space-y-6">
                <VolunteerAccessControl onEventSelect={setSelectedEventId} />
              </TabsContent>

              <TabsContent value="logs" className="space-y-6">
                <AdminLogsSection />
              </TabsContent>

              <TabsContent value="emails" className="space-y-6">
                <AdminEmailPlayground />
              </TabsContent>

              <TabsContent value="distribution-lists" className="space-y-6">
                <DistributionListsSection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLinksStrip() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {externalLinks.map(({ label, href, icon: Icon }) => (
        <Button
          key={label}
          asChild
          variant="outline"
          className="justify-start gap-2 bg-card/60 hover:bg-primary hover:text-primary-foreground"
        >
          <Link href={href} target="_blank" rel="noreferrer">
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  )
}

function OverviewPanels({ stats }: { stats?: Record<string, unknown> | null }) {
  return (
    <div className="space-y-6">
      <AdminStats stats={stats} />
      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
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
                className="group rounded-xl border border-border/60 bg-muted/40 p-4 transition hover:-translate-y-[2px] hover:border-primary/60 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-primary">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
