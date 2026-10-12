'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminOverview } from '@/components/admin/AdminOverview'
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
import { AdminShell } from '@/components/admin/AdminShell'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { Container } from '@/components/ds'
import { AdminEmailPlayground } from '@/components/admin/emails/AdminEmailPlayground'
import { DistributionListsSection } from '@/components/admin/distribution-lists/DistributionListsSection'
import { UsersSection } from '@/components/admin/users/UsersSection'
import { AmbassadorsSection } from '@/components/admin/ambassadors/AmbassadorsSection'
import { GroupsSection } from '@/components/admin/groups/GroupsSection'
import { BootcampsSection } from '@/components/admin/bootcamps/BootcampsSection'
import { LuckyWheelSection } from '@/components/admin/lucky-wheel/LuckyWheelSection'
import { ADMIN_TAB_VALUES, useAdminDashboardStore, type AdminTabValue } from '@/store/useAdminDashboardStore'

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
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const selectedEventId = searchParams.get('event') ?? undefined

  const isAdmin = profile.role === 'admin'
  const isVolunteer = profile.role === 'volunteer'

  useEffect(() => {
    if (!tabParam) return
    if (ADMIN_TAB_VALUES.includes(tabParam as AdminTabValue)) {
      setActiveTab(tabParam as AdminTabValue)
    }
  }, [tabParam, setActiveTab])

  if (isVolunteer && !isAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <Container size="form" className="space-y-8 py-8">
          <AdminPageHeader
            eyebrow="Terrain"
            title="Check-in bénévole"
            description={`Bienvenue ${profile.full_name || user.email}`}
            actions={
              <>
                <Badge variant="secondary">Bénévole</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href="/account">Mon compte</Link>
                </Button>
              </>
            }
          />
          <VolunteerAccessControl />
          <Card variant="info">
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
        </Container>
      </main>
    )
  }

  return (
    <AdminShell fullName={profile.full_name || user.email} eventId={selectedEventId}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AdminTabValue)}
        className="space-y-8"
      >
        <TabsContent value="overview" className="space-y-8">
          <AdminOverview stats={stats} />
        </TabsContent>
        <TabsContent value="events" className="space-y-8">
          <EventsSection />
        </TabsContent>
        <TabsContent value="races" className="space-y-8">
          <RacesSection />
        </TabsContent>
        <TabsContent value="obstacles" className="space-y-8">
          <ObstaclesSection />
        </TabsContent>
        <TabsContent value="tickets" className="space-y-8">
          <TicketsSection />
        </TabsContent>
        <TabsContent value="promocodes" className="space-y-8">
          <PromotionalCodesSection />
        </TabsContent>
        <TabsContent value="promotions" className="space-y-8">
          <PromotionsSection />
        </TabsContent>
        <TabsContent value="upsells" className="space-y-8">
          <UpsellsSection />
        </TabsContent>
        <TabsContent value="lucky-wheel" className="space-y-8">
          <LuckyWheelSection />
        </TabsContent>
        <TabsContent value="ambassadors" className="space-y-8">
          <AmbassadorsSection />
        </TabsContent>
        <TabsContent value="users" className="space-y-8">
          <UsersSection />
        </TabsContent>
        <TabsContent value="groups" className="space-y-8">
          <GroupsSection />
        </TabsContent>
        <TabsContent value="bootcamps" className="space-y-8">
          <BootcampsSection />
        </TabsContent>
        <TabsContent value="members" className="space-y-8">
          <RegistrationsSection eventId={selectedEventId} />
        </TabsContent>
        <TabsContent value="checkin" className="space-y-8">
          <VolunteerAccessControl eventId={selectedEventId} />
        </TabsContent>
        <TabsContent value="logs" className="space-y-8">
          <AdminLogsSection />
        </TabsContent>
        <TabsContent value="emails" className="space-y-8">
          <AdminEmailPlayground />
        </TabsContent>
        <TabsContent value="distribution-lists" className="space-y-8">
          <DistributionListsSection />
        </TabsContent>
      </Tabs>
    </AdminShell>
  )
}

export default AdminDashboard
