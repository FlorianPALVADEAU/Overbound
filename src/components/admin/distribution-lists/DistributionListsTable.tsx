'use client'

import { useState } from 'react'
import { useDistributionLists } from '@/hooks/useDistributionLists'
import type { DistributionListWithStats } from '@/types/DistributionList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Users } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { EVENT_OPENING_FIRST_LIST_ID } from '@/lib/subscriptions/constants'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'

interface DistributionListsTableProps {
  lists: DistributionListWithStats[]
  onEdit: (list: DistributionListWithStats) => void
  onViewSubscribers: (list: DistributionListWithStats) => void
  onRefresh: () => void
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    marketing: 'bg-info/15 text-info',
    events: 'bg-success/15 text-success',
    news: 'bg-primary/15 text-primary',
    volunteers: 'bg-warning/15 text-warning',
    partners: 'bg-secondary-foreground/15 text-secondary-foreground',
    transactional: 'bg-muted text-muted-foreground',
  }
  return colors[type] || colors.marketing
}

const isLocked = (list: DistributionListWithStats) => list.id === EVENT_OPENING_FIRST_LIST_ID

export function DistributionListsTable({
  lists,
  onEdit,
  onViewSubscribers,
  onRefresh,
}: DistributionListsTableProps) {
  const { deleteList, toggleActive } = useDistributionLists()
  const [listToDelete, setListToDelete] = useState<DistributionListWithStats | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!listToDelete) return

    setIsDeleting(true)
    try {
      await deleteList(listToDelete.id)
      setListToDelete(null)
      onRefresh()
    } catch (error) {
      console.error('Error deleting list:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async (list: DistributionListWithStats) => {
    try {
      await toggleActive(list.id, !list.active)
      onRefresh()
    } catch (error) {
      console.error('Error toggling active status:', error)
    }
  }

  const columns: OperationsListColumn<DistributionListWithStats>[] = [
    {
      id: 'name',
      header: 'Nom',
      cell: (list) => (
        <div>
          <div className="font-medium">{list.name}</div>
          {list.description ? <div className="line-clamp-1 text-sm text-muted-foreground">{list.description}</div> : null}
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      mobile: 'summary',
      cell: (list) => <Badge className={getTypeColor(list.type)}>{list.type}</Badge>,
    },
    {
      id: 'subscribers',
      header: 'Abonnés',
      mobile: 'summary',
      cell: (list) => (
        <Button variant="ghost" size="sm" onClick={() => onViewSubscribers(list)} className="gap-1">
          <Users className="h-4 w-4" />
          {list.subscriber_count || 0}
        </Button>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      mobile: 'summary',
      cell: (list) => (
        <Switch
          aria-label={list.active ? `Désactiver ${list.name}` : `Activer ${list.name}`}
          checked={list.active}
          onCheckedChange={() => handleToggleActive(list)}
          disabled={isLocked(list)}
        />
      ),
    },
    {
      id: 'slug',
      header: 'Slug',
      mobile: 'detail',
      cell: (list) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{list.slug}</code>,
    },
  ]

  const rowActions: OperationsListAction<DistributionListWithStats>[] = [
    { id: 'subscribers', label: 'Voir les abonnés', onSelect: onViewSubscribers },
    { id: 'edit', label: 'Modifier', onSelect: onEdit, disabled: isLocked },
    {
      id: 'toggle',
      label: 'Activer / désactiver',
      onSelect: (list) => void handleToggleActive(list),
      disabled: isLocked,
    },
    { id: 'delete', label: 'Supprimer', onSelect: setListToDelete, disabled: isLocked, destructive: true },
  ]

  return (
    <>
      <OperationsList
        data={{ items: lists, nextCursor: null, total: lists.length }}
        getItemId={(list) => list.id}
        columns={columns}
        rowActions={rowActions}
        pagination={{ cursor: null, previousCursors: [], nextCursor: null, total: lists.length }}
        onPaginationChange={() => undefined}
        itemLabel="liste"
        emptyState={<div className="px-3 py-12 text-center text-sm text-muted-foreground">Aucune liste de distribution</div>}
      />

      <AlertDialog
        open={!!listToDelete}
        onOpenChange={(open) => !open && setListToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la liste ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la liste{' '}
              <strong>{listToDelete?.name}</strong> ?<br />
              Cette action est irréversible et supprimera également tous les
              abonnements associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
