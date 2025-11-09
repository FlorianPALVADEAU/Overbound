'use client'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
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
import { ADMIN_NAV_ITEMS } from '@/components/admin/adminNavItems'
import { AdminEmailPlayground } from '@/components/admin/emails/AdminEmailPlayground'
import { DistributionListsSection } from '@/components/admin/distribution-lists/DistributionListsSection'
import { useAdminDashboardStore, type AdminTabValue } from '@/store/useAdminDashboardStore'

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

  const isAdmin = profile.role === 'admin'
  const isVolunteer = profile.role === 'volunteer'

  const activeTabLabel = useMemo(
    () => ADMIN_NAV_ITEMS.find((item) => item.value === activeTab)?.label ?? 'Tableau de bord',
    [activeTab]
  )

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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bienvenue</p>
                <h1 className="text-2xl font-semibold lg:text-3xl">
                  {profile.full_name || user.email}
                </h1>
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

            <div className="md:hidden">
              <Select
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as AdminTabValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une section" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_NAV_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
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
                <AdminStats stats={stats} />
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

export default AdminDashboard
