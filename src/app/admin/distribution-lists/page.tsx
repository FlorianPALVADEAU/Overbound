'use client'

import { useEffect, useState } from 'react'
import { useDistributionLists } from '@/hooks/useDistributionLists'
import type { DistributionList, DistributionListWithStats } from '@/types/DistributionList'
import { DistributionListsTable } from '@/components/admin/distribution-lists/DistributionListsTable'
import { ListFormDialog } from '@/components/admin/distribution-lists/ListFormDialog'
import { SubscribersDialog } from '@/components/admin/distribution-lists/SubscribersDialog'
import { EmailComposer } from '@/components/admin/distribution-lists/EmailComposer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, RefreshCw, Loader2, List, TrendingUp, Mail } from 'lucide-react'

type ViewMode = 'lists' | 'composer'

export default function DistributionListsPage() {
  const { lists, isLoading, fetchLists } = useDistributionLists()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [listToEdit, setListToEdit] = useState<DistributionListWithStats | undefined>()
  const [subscribersDialogList, setSubscribersDialogList] = useState<DistributionList | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('lists')

  useEffect(() => {
    fetchLists({ includeStats: true })
  }, [])

  const handleRefresh = () => {
    fetchLists({ includeStats: true })
  }

  const handleCreateClick = () => {
    setListToEdit(undefined)
    setIsFormOpen(true)
  }

  const handleEditClick = (list: DistributionListWithStats) => {
    setListToEdit(list)
    setIsFormOpen(true)
  }

  const handleViewSubscribers = (list: DistributionListWithStats) => {
    setSubscribersDialogList(list)
  }

  // Filter lists by type
  const filteredLists = lists.filter((list) => {
    if (activeTab === 'all') return true
    return list.type === activeTab
  })

  // Calculate stats
  const totalLists = lists.length
  const activeLists = lists.filter((l) => l.active).length
  const totalSubscribers = lists.reduce((sum, l) => sum + (l.subscriber_count || 0), 0)

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Listes de Distribution
          </h1>
          <p className="text-muted-foreground">
            Gérez vos listes d'emails marketing et abonnements
          </p>
        </div>
        <div className="flex gap-2">
          {viewMode === 'lists' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Actualiser
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewMode('composer')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Composer un email
              </Button>
              <Button onClick={handleCreateClick}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle liste
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setViewMode('lists')}
            >
              Retour aux listes
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'composer' ? (
        /* Email Composer View */
        <EmailComposer
          lists={lists.filter((l) => l.active)}
          onClose={() => setViewMode('lists')}
        />
      ) : (
        /* Lists Management View */
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Listes totales
                </CardTitle>
                <List className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLists}</div>
                <p className="text-xs text-muted-foreground">
                  {activeLists} active{activeLists > 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Abonnés totaux
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSubscribers}</div>
                <p className="text-xs text-muted-foreground">
                  Toutes listes confondues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taux moyen
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lists.length > 0
                    ? Math.round(totalSubscribers / lists.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Abonnés par liste
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lists Table with Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Toutes les listes</CardTitle>
              <CardDescription>
                Gérez vos listes de distribution et leurs abonnés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    Toutes ({lists.length})
                  </TabsTrigger>
                  <TabsTrigger value="marketing">
                    Marketing ({lists.filter((l) => l.type === 'marketing').length})
                  </TabsTrigger>
                  <TabsTrigger value="events">
                    Événements ({lists.filter((l) => l.type === 'events').length})
                  </TabsTrigger>
                  <TabsTrigger value="news">
                    Actualités ({lists.filter((l) => l.type === 'news').length})
                  </TabsTrigger>
                  <TabsTrigger value="volunteers">
                    Bénévoles ({lists.filter((l) => l.type === 'volunteers').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <DistributionListsTable
                      lists={filteredLists}
                      onEdit={handleEditClick}
                      onViewSubscribers={handleViewSubscribers}
                      onRefresh={handleRefresh}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialogs */}
      <ListFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        list={listToEdit}
        onSuccess={handleRefresh}
      />

      <SubscribersDialog
        open={!!subscribersDialogList}
        onOpenChange={(open) => !open && setSubscribersDialogList(null)}
        list={subscribersDialogList}
      />
    </div>
  )
}
