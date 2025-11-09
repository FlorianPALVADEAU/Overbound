'use client'

import { useEffect, useState } from 'react'
import { useListSubscribers } from '@/hooks/useDistributionLists'
import type { DistributionList } from '@/types/DistributionList'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Loader2, Search, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SubscribersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: DistributionList | null
}

export function SubscribersDialog({
  open,
  onOpenChange,
  list,
}: SubscribersDialogProps) {
  const { subscribers, total, isLoading, fetchSubscribers } = useListSubscribers(
    list?.id || ''
  )
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open && list) {
      fetchSubscribers({ subscribedOnly: true, limit: 100 })
    }
  }, [open, list?.id])

  const filteredSubscribers = subscribers.filter((sub) =>
    searchQuery
      ? sub.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  )

  const handleExport = () => {
    const csv = [
      ['Email', 'Nom', 'Date d\'abonnement', 'Source'].join(','),
      ...filteredSubscribers.map((sub) =>
        [
          sub.user.email,
          sub.user.full_name || '',
          sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString('fr-FR') : '',
          sub.source || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${list?.slug || 'list'}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Abonnés - {list?.name}</DialogTitle>
          <DialogDescription>
            {total} abonné{total > 1 ? 's' : ''} actif{total > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredSubscribers.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Date d'abonnement</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {searchQuery
                        ? 'Aucun résultat trouvé'
                        : 'Aucun abonné pour cette liste'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscribers.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sub.user.email}</div>
                          {sub.user.full_name && (
                            <div className="text-sm text-muted-foreground">
                              {sub.user.full_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.subscribed_at ? (
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(sub.subscribed_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.source ? (
                          <Badge variant="secondary" className="text-xs">
                            {sub.source}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {filteredSubscribers.length < total && (
          <div className="text-sm text-muted-foreground text-center py-2">
            Affichage de {filteredSubscribers.length} sur {total} abonnés
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
