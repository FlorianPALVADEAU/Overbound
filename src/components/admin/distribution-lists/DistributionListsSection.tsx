'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDistributionLists, useDistributionListsPage } from '@/hooks/useDistributionLists'
import type { DistributionList, DistributionListWithStats } from '@/types/DistributionList'
import { ListFormDialog } from './ListFormDialog'
import { SubscribersDialog } from './SubscribersDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, RefreshCw, Loader2, List, TrendingUp } from 'lucide-react'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import { StatRow } from '@/components/ds'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'

export function DistributionListsSection() {
  const { lists, isLoading, fetchLists, toggleActive } = useDistributionLists()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [listToEdit, setListToEdit] = useState<DistributionListWithStats | undefined>()
  const [subscribersDialogList, setSubscribersDialogList] = useState<DistributionList | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const { data: pageData, isLoading: pageLoading, isFetching: pageFetching, error: pageError } = useDistributionListsPage({ cursor, limit: 25, search: deferredSearch, type: activeTab })

  useEffect(() => {
    fetchLists({ includeStats: true })
  }, [])

  useEffect(() => {
    setCursor(null)
    setPreviousCursors([])
  }, [activeTab, deferredSearch])

  const handleRefresh = () => {
    fetchLists({ includeStats: true })
    queryClient.invalidateQueries({ queryKey: ['admin', 'distribution-lists', 'page'] })
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

  const pageLists = pageData?.items ?? []
  const columns = useMemo<OperationsListColumn<DistributionListWithStats>[]>(() => [
    { id: 'name', header: 'Nom', cell: (list) => <div className="min-w-0"><p className="truncate font-medium">{list.name}</p>{list.description ? <p className="line-clamp-1 text-sm text-muted-foreground">{list.description}</p> : null}</div> },
    { id: 'type', header: 'Type', cell: (list) => <span className="rounded-full bg-muted px-2 py-1 text-xs">{list.type}</span> },
    { id: 'slug', header: 'Slug', cell: (list) => <code className="text-xs">{list.slug}</code> },
    { id: 'subscribers', header: 'Abonnés', cell: (list) => <button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted" onClick={(event) => { event.stopPropagation(); handleViewSubscribers(list) }}><span>♙</span>{list.subscriber_count || 0}</button> },
    { id: 'status', header: 'Statut', cell: (list) => <span className={list.active ? 'text-success' : 'text-muted-foreground'}>{list.active ? 'Active' : 'Inactive'}</span> },
  ], [])
  const rowActions: OperationsListAction<DistributionListWithStats>[] = [
    { id: 'subscribers', label: 'Voir les abonnés', onSelect: handleViewSubscribers },
    { id: 'edit', label: 'Modifier', onSelect: handleEditClick },
    { id: 'toggle', label: 'Modifier le statut', onSelect: (list) => { void toggleActive(list.id, !list.active).then(handleRefresh) } },
  ]

  // Calculate stats
  const totalLists = lists.length
  const activeLists = lists.filter((l) => l.active).length
  const totalSubscribers = lists.reduce((sum, l) => sum + (l.subscriber_count || 0), 0)

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Communication"
        title="Listes de diffusion"
        description="Gérez vos listes d'emails marketing et abonnements"
        actions={
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
            <Button onClick={handleCreateClick}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle liste
            </Button>
          </>
        }
      />

      <StatRow
        compact
        stats={[
          { label: 'Listes totales', value: totalLists, unit: `${activeLists} active${activeLists > 1 ? 's' : ''}` },
          { label: 'Abonnés totaux', value: totalSubscribers, unit: 'toutes listes' },
          { label: 'Taux moyen', value: lists.length > 0 ? Math.round(totalSubscribers / lists.length) : 0, unit: 'abonnés / liste' },
        ]}
      />

      {/* Lists Table with Tabs */}
      <Card variant="info">
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
              {isLoading || pageLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <OperationsList
                  data={{ items: pageLists, nextCursor: pageData?.nextCursor ?? null, total: pageData?.total }}
                  status={pageError ? 'error' : pageLoading && !pageData ? 'loading' : pageFetching ? 'stale' : 'idle'}
                  errorMessage={pageError?.message}
                  onRetry={handleRefresh}
                  getItemId={(list) => list.id}
                  columns={columns}
                  rowActions={rowActions}
                  search={search}
                  searchPlaceholder="Rechercher une liste…"
                  onSearchChange={setSearch}
                  pagination={{ cursor, previousCursors, nextCursor: pageData?.nextCursor ?? null, total: pageData?.total, limit: 25 }}
                  onPaginationChange={({ cursor: nextCursor, previousCursors: nextPrevious }) => { setCursor(nextCursor); setPreviousCursors(nextPrevious) }}
                  itemLabel="liste"
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
