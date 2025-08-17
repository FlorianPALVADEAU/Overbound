'use client'
import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, BarChart3, Calendar, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { AdminStats } from '@/components/admin/AdminStats'
import { VolunteerAccessControl } from '@/components/admin/VolunteerAccessControl'
import { AdminEventsCrud } from '@/components/admin/AdminEventsCrud'
import { AdminMembersManagement } from '@/components/admin/AdminMembersManagement'

interface Profile {
  role: 'admin' | 'volunteer'
  full_name?: string
}

interface AdminDashboardProps {
  user: any
  profile: Profile
  stats?: any
}

export function AdminDashboard({ user, profile, stats }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>()

  const isAdmin = profile.role === 'admin'
  const isVolunteer = profile.role === 'volunteer'

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                {isAdmin ? 'Administration' : 'Bénévole - Check-in'}
              </h1>
              <p className="text-muted-foreground">
                Bienvenue {profile.full_name || user.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {isAdmin ? 'Administrateur' : 'Bénévole'}
              </Badge>
              <Link href="/account">
                <Button variant="outline" size="sm">
                  Mon compte
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Interface Admin avec onglets */}
        {isAdmin && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Tableau de bord
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Événements
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Membres
              </TabsTrigger>
              <TabsTrigger value="checkin" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Check-in
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AdminStats stats={stats} />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <AdminEventsCrud />
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <AdminMembersManagement eventId={selectedEventId} />
            </TabsContent>

            <TabsContent value="checkin" className="space-y-6">
              <VolunteerAccessControl 
                onEventSelect={setSelectedEventId}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Interface Bénévole */}
        {isVolunteer && (
          <VolunteerAccessControl />
        )}
      </div>
    </main>
  )
}

export default AdminDashboard