'use client'

import Link from 'next/link'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { useAdminOrders, useResendReceipt } from '@/app/api/admin/orders/ordersQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { OperationsList, type OperationsListAction, type OperationsListColumn, type OperationsListFilter } from '@/components/admin/operations'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderListItem, type OrderListStatus } from '@/lib/admin/ordersList'

const STATUS_LABEL = ORDER_STATUS_LABEL
const STATUS_CLASS: Record<OrderListStatus, string> = {
  paid: 'border-success/40 bg-success/15 text-success',
  pending: 'border-warning/40 bg-warning/15 text-warning',
  cancelled: 'border-border bg-muted text-muted-foreground',
  refunded: 'border-info/40 bg-info/15 text-info',
}
const LIMITS = [25, 50, 100]

const money = (cents: number | null, currency: string) =>
  cents === null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)

const dateTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(value))

const isStatus = (value: string | null): value is OrderListStatus => ORDER_STATUSES.some((status) => status === value)

/** Every payment, with the bibs and refunds behind it; the place to answer « did this person pay? ». */
export function OrdersSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event')
  const urlStatus = searchParams.get('status')

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [status, setStatus] = useState<OrderListStatus | null>(isStatus(urlStatus) ? urlStatus : null)
  const [limit, setLimit] = useState(50)
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const resendReceipt = useResendReceipt()
  const hasInitializedSearch = useRef(false)

  // A link such as « paiements en attente » arrives with the status in the URL.
  useEffect(() => {
    setStatus(isStatus(urlStatus) ? urlStatus : null)
    setCursor(null)
    setPreviousCursors([])
  }, [urlStatus])

  useEffect(() => {
    if (!hasInitializedSearch.current) {
      hasInitializedSearch.current = true
      return
    }
    setCursor(null)
    setPreviousCursors([])
  }, [deferredSearch, eventId])

  const { data, error, isLoading, isFetching, refetch } = useAdminOrders({ cursor, limit, status, query: deferredSearch || undefined, eventId })
  const { data: events = [] } = useAdminEvents()
  const orders = data?.orders ?? []
  const selected = orders.find((order) => order.id === selectedId) ?? null

  const resetPagination = () => {
    setCursor(null)
    setPreviousCursors([])
  }

  // The event filter lives in the list itself: the admin shell no longer carries an event across pages.
  const setEventFilter = (nextEventId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextEventId) params.set('event', nextEventId)
    else params.delete('event')
    const query = params.toString()
    router.replace(query ? `/dashboard/orders?${query}` : '/dashboard/orders', { scroll: false })
  }

  const sendReceipt = (order: OrderListItem) => {
    if (!order.providerOrderId) return
    resendReceipt.mutate(
      { paymentIntentId: order.providerOrderId },
      {
        onSuccess: () => setNotice({ tone: 'success', text: `Reçu renvoyé pour la commande de ${order.email}.` }),
        onError: (mutationError) => setNotice({ tone: 'error', text: mutationError.message }),
      },
    )
  }

  const openParticipants = (order: OrderListItem) => {
    // The orders list only knows the event by title; the participants page picks the event when none is selected.
    router.push(eventId ? `/dashboard/events/${eventId}/participants` : '/dashboard/participants')
  }

  const filters: OperationsListFilter[] = [
    {
      id: 'event',
      label: 'Événement',
      value: eventId ?? '',
      allLabel: 'Tous les événements',
      options: events.map((event) => ({ value: event.id, label: event.title })),
    },
    {
      id: 'status',
      label: 'Statut',
      value: status ?? '',
      allLabel: 'Tous les statuts',
      options: ORDER_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] })),
    },
    { id: 'limit', label: 'Lignes', value: String(limit), options: LIMITS.map((value) => ({ value: String(value), label: String(value) })) },
  ]

  const columns: OperationsListColumn<OrderListItem>[] = [
    {
      id: 'order',
      header: 'Commande',
      cell: (order) => <><p className="break-all font-medium">{order.email}</p><p className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</p></>,
    },
    {
      id: 'status',
      mobile: 'summary',
      header: 'Statut',
      cell: (order) => {
        const known = isStatus(order.status) ? order.status : null
        return <Badge variant="outline" className={known ? STATUS_CLASS[known] : undefined}>{known ? STATUS_LABEL[known] : order.status ?? '—'}</Badge>
      },
    },
    {
      id: 'amount',
      mobile: 'summary',
      header: 'Montant',
      cell: (order) => <><p className="tabular-nums">{money(order.amountCents, order.currency)}</p>{order.refundedCents > 0 ? <p className="text-xs text-muted-foreground">dont {money(order.refundedCents, order.currency)} remboursés</p> : null}</>,
    },
    {
      id: 'registrations',
      mobile: 'detail',
      header: 'Inscriptions',
      cell: (order) => <><p>{order.registrations}</p>{order.cancelledRegistrations > 0 ? <p className="text-xs text-muted-foreground">{order.cancelledRegistrations} annulée{order.cancelledRegistrations > 1 ? 's' : ''}</p> : null}</>,
    },
    { id: 'events', mobile: 'detail', header: 'Événement', cell: (order) => (order.events.length > 0 ? order.events.join(', ') : '—') },
    { id: 'date', mobile: 'detail', header: 'Date', cell: (order) => dateTime(order.createdAt) },
    { id: 'reference', mobile: 'detail', header: 'Référence', cell: (order) => <span className="break-all font-mono text-xs">{order.providerOrderId ?? '—'}</span>, hiddenByDefault: true },
  ]

  const rowActions: OperationsListAction<OrderListItem>[] = [
    { id: 'participants', label: 'Voir les participants', onSelect: openParticipants },
    { id: 'receipt', label: 'Renvoyer le reçu', onSelect: sendReceipt, disabled: (order) => !order.canResendReceipt || resendReceipt.isPending },
    { id: 'stripe', label: 'Ouvrir dans Stripe', onSelect: (order) => order.stripeUrl && window.open(order.stripeUrl, '_blank', 'noopener,noreferrer'), disabled: (order) => !order.stripeUrl },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Billetterie"
        title="Commandes"
        description={eventId ? 'Paiements de l’événement choisi dans le filtre. Annule une inscription depuis la page Participants pour la rembourser.' : 'Tous les paiements. Annule une inscription depuis la page Participants pour la rembourser.'}
      />
      {notice ? (
        <Alert variant={notice.tone === 'error' ? 'destructive' : 'default'} role="status">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{notice.text}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setNotice(null)}>Fermer</Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <OperationsList
        storageKey="orders"
        data={{ items: orders, nextCursor: data?.page.nextCursor ?? null, total: data?.page.totalCount }}
        status={error ? 'error' : isLoading && !data ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={error?.message}
        onRetry={() => void refetch()}
        getItemId={(order) => order.id}
        columns={columns}
        filters={filters}
        onFilterChange={(filterId, value) => {
          resetPagination()
          if (filterId === 'event') setEventFilter(value)
          if (filterId === 'status') setStatus(isStatus(value) ? value : null)
          if (filterId === 'limit') setLimit(Number(value))
        }}
        search={search}
        searchPlaceholder="E-mail, référence Stripe ou identifiant"
        onSearchChange={setSearch}
        toolbarActions={
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
            Actualiser
          </Button>
        }
        rowActions={rowActions}
        pagination={{ cursor, previousCursors, nextCursor: data?.page.nextCursor ?? null, total: data?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPrevious }) => {
          setCursor(nextCursor)
          setPreviousCursors(nextPrevious)
        }}
        itemLabel="commande"
        selectedItem={selected}
        onSelectedItemChange={(order) => setSelectedId(order?.id ?? null)}
        detailTitle={(order) => order.email}
        detailDescription={(order) => `Commande du ${dateTime(order.createdAt)}`}
        renderDetail={(order) => (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={!order.canResendReceipt || resendReceipt.isPending} onClick={() => sendReceipt(order)}>Renvoyer le reçu</Button>
              {order.stripeUrl ? <Button asChild size="sm" variant="outline"><a href={order.stripeUrl} target="_blank" rel="noopener noreferrer">Stripe<ExternalLink /></a></Button> : null}
              {order.invoiceUrl ? <Button asChild size="sm" variant="outline"><a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer">Facture<ExternalLink /></a></Button> : null}
              <Button asChild size="sm" variant="outline"><Link href={eventId ? `/dashboard/events/${eventId}/participants` : '/dashboard/participants'}>Participants</Link></Button>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Montant</dt><dd>{money(order.amountCents, order.currency)}</dd></div>
              <div><dt className="text-muted-foreground">Remboursé</dt><dd>{money(order.refundedCents, order.currency)}</dd></div>
              <div><dt className="text-muted-foreground">Inscriptions</dt><dd>{order.registrations} ({order.cancelledRegistrations} annulée{order.cancelledRegistrations > 1 ? 's' : ''})</dd></div>
              <div><dt className="text-muted-foreground">Événement</dt><dd>{order.events.join(', ') || '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Référence</dt><dd className="break-all font-mono text-xs">{order.providerOrderId ?? '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Identifiant</dt><dd className="break-all font-mono text-xs">{order.id}</dd></div>
            </dl>
          </div>
        )}
      />
    </div>
  )
}
