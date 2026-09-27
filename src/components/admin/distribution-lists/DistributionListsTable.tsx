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
import { EVENT_OPENING_FIRST_LIST_ID } from '@/lib/subscriptions/constants'

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
      <div className="hidden overflow-hidden rounded-lg border md:block">
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
                      disabled={list.id === EVENT_OPENING_FIRST_LIST_ID}
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
                        <DropdownMenuItem
                          onClick={() => onEdit(list)}
                          disabled={list.id === EVENT_OPENING_FIRST_LIST_ID}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {list.id === EVENT_OPENING_FIRST_LIST_ID
                            ? 'Modifier (indisponible)'
                            : 'Modifier'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(list)}
                          disabled={list.id === EVENT_OPENING_FIRST_LIST_ID}
                        >
                          {list.active ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" />
                              {list.id === EVENT_OPENING_FIRST_LIST_ID
                                ? 'Désactiver (indisponible)'
                                : 'Désactiver'}
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" />
                              {list.id === EVENT_OPENING_FIRST_LIST_ID
                                ? 'Activer (indisponible)'
                                : 'Activer'}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setListToDelete(list)}
                          className="text-destructive"
                          disabled={list.id === EVENT_OPENING_FIRST_LIST_ID}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {list.id === EVENT_OPENING_FIRST_LIST_ID
                            ? 'Supprimer (indisponible)'
                            : 'Supprimer'}
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
      <div className="space-y-3 md:hidden">
        {lists.length === 0 ? <div className="rounded-lg border py-8 text-center text-sm text-muted-foreground">Aucune liste de distribution</div> : lists.map((list) => (
          <article key={list.id} className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{list.name}</p>{list.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p> : null}</div><Badge className={`shrink-0 ${getTypeColor(list.type)}`}>{list.type}</Badge></div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><code className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 text-xs">{list.slug}</code><Button variant="ghost" size="sm" onClick={() => onViewSubscribers(list)} className="ml-auto gap-1"><Users className="h-4 w-4" />{list.subscriber_count || 0}</Button><Switch checked={list.active} onCheckedChange={() => handleToggleActive(list)} disabled={list.id === EVENT_OPENING_FIRST_LIST_ID} /></div>
            <div className="mt-3 flex justify-end border-t pt-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><MoreHorizontal className="mr-2 h-4 w-4" />Actions</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => onViewSubscribers(list)}><Users className="mr-2 h-4 w-4" />Voir les abonnés ({list.subscriber_count})</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onEdit(list)} disabled={list.id === EVENT_OPENING_FIRST_LIST_ID}><Edit className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem><DropdownMenuItem onClick={() => handleToggleActive(list)} disabled={list.id === EVENT_OPENING_FIRST_LIST_ID}>{list.active ? <><PowerOff className="mr-2 h-4 w-4" />Désactiver</> : <><Power className="mr-2 h-4 w-4" />Activer</>}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setListToDelete(list)} className="text-destructive" disabled={list.id === EVENT_OPENING_FIRST_LIST_ID}><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
          </article>
        ))}
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
