'use client'

import { useState } from 'react'
import { useDistributionLists } from '@/hooks/useDistributionLists'
import type { DistributionListWithStats } from '@/types/DistributionList'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  MoreHorizontal,
  Users,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface DistributionListsTableProps {
  lists: DistributionListWithStats[]
  onEdit: (list: DistributionListWithStats) => void
  onViewSubscribers: (list: DistributionListWithStats) => void
  onRefresh: () => void
}

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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      marketing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      events: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      news: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      volunteers: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      partners: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      transactional: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return colors[type] || colors.marketing
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Abonnés</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucune liste de distribution
                </TableCell>
              </TableRow>
            ) : (
              lists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{list.name}</div>
                      {list.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {list.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(list.type)}>{list.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {list.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewSubscribers(list)}
                      className="gap-1"
                    >
                      <Users className="w-4 h-4" />
                      {list.subscriber_count || 0}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={list.active}
                      onCheckedChange={() => handleToggleActive(list)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewSubscribers(list)}>
                          <Users className="w-4 h-4 mr-2" />
                          Voir les abonnés ({list.subscriber_count})
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(list)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(list)}
                        >
                          {list.active ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setListToDelete(list)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
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
