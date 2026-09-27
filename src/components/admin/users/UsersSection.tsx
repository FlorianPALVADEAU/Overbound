'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Mail, UserCog, RefreshCw, Clock, Pencil, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useAdminUsersPage,
  useAmbassadorPromoCodes,
  updateAdminUserRole,
  updateAdminUser,
  deleteAdminUser,
  adminUsersQueryKey,
  type AdminUser,
  type AmbassadorPromoCode,
} from '@/app/api/admin/users/usersQueries'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import { parseOperationsListUrlState, writeOperationsListUrlState } from '@/components/admin/operations/operationsListUrlState'

const roleLabels: Record<AdminUser['role'], string> = {
  user: 'Utilisateur',
  volunteer: 'Bénévole',
  admin: 'Administrateur',
  ambassador: 'Ambassadeur',
}

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

export function UsersSection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialUrl = useMemo(() => parseOperationsListUrlState(searchParams, { filterIds: ['role'] }), [searchParams])
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const [roleFilter, setRoleFilter] = useState<AdminUser['role'] | 'all'>((initialUrl.filters.role as AdminUser['role'] | undefined) ?? 'all')
  const [limit, setLimit] = useState(initialUrl.limit)
  const [cursor, setCursor] = useState<string | null>(initialUrl.cursor)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editValues, setEditValues] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    marketing_opt_in: false,
    role: 'user' as AdminUser['role'],
    ambassador_promotional_code_id: null as string | null,
  })
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const userParams = useMemo(() => ({ cursor, limit, query: deferredSearch || undefined, role: roleFilter, sort: 'created_at' as const, direction: 'desc' as const }), [cursor, deferredSearch, limit, roleFilter])
  const { data, isLoading, isFetching, error, refetch } = useAdminUsersPage(userParams)
  const { data: promoCodesData, isLoading: promoCodesLoading } = useAmbassadorPromoCodes()

  const users = data?.users ?? []
  const filteredUsers = users
  const resetPagination = () => { setCursor(null); setPreviousCursors([]) }
  useEffect(() => { resetPagination() }, [deferredSearch])
  useEffect(() => {
    const next = writeOperationsListUrlState(searchParams, { cursor, sort: null, direction: null, limit, selectedId: null, filters: { role: roleFilter === 'all' ? '' : roleFilter } }, { filterIds: ['role'] })
    if (next !== searchParams.toString()) router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [cursor, limit, pathname, roleFilter, router, searchParams])
  useEffect(() => {
    const next = parseOperationsListUrlState(searchParams, { filterIds: ['role'] })
    const nextRole = next.filters.role && next.filters.role in roleLabels ? next.filters.role as AdminUser['role'] : 'all'
    const hasExternalStateChange = roleFilter !== nextRole || limit !== next.limit || cursor !== next.cursor
    setRoleFilter((current) => current === nextRole ? current : nextRole)
    setLimit((current) => current === next.limit ? current : next.limit)
    setCursor((current) => current === next.cursor ? current : next.cursor)
    if (hasExternalStateChange) setPreviousCursors([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const availablePromoCodes = useMemo(() => {
    const codes = promoCodesData?.codes ?? []
    if (!editUser) return codes
    const selectedId = editValues.ambassador_promotional_code_id
    const selectedCode = selectedId ? codes.find((code) => code.id === selectedId) : null
    const filtered = codes.filter((code) => !code.assigned_profile_id || code.assigned_profile_id === editUser.id)
    if (selectedId && !selectedCode && editUser.ambassador_promotional_code_id === selectedId) {
      const fallback: AmbassadorPromoCode = {
        id: selectedId,
        code: editUser.ambassador_code ?? 'CODE_INCONNU',
        name: null,
        is_active: Boolean(editUser.ambassador_code_is_active),
        assigned_profile_id: editUser.id,
      }
      return [fallback, ...filtered]
    }
    return filtered
  }, [promoCodesData, editUser, editValues.ambassador_promotional_code_id])

  useEffect(() => {
    if (editValues.role !== 'ambassador' && editValues.ambassador_promotional_code_id) {
      setEditValues((prev) => ({ ...prev, ambassador_promotional_code_id: null }))
    }
  }, [editValues.role, editValues.ambassador_promotional_code_id])

  const handleRoleChange = async (userId: string, role: AdminUser['role']) => {
    setUpdatingId(userId)
    try {
      await updateAdminUserRole(userId, role)
      queryClient.setQueryData(adminUsersQueryKey, (previous: typeof data | undefined) => {
        if (!previous) return previous
        return {
          ...previous,
          users: previous.users.map((user) =>
            user.id === userId ? { ...user, role } : user,
          ),
        }
      })
      await queryClient.invalidateQueries({ queryKey: [...adminUsersQueryKey, 'page'] })
    } catch (err) {
      console.error('Erreur mise à jour rôle:', err)
      alert('Erreur lors de la mise à jour du rôle.')
    } finally {
      setUpdatingId(null)
    }
  }

  const openEditDialog = (user: AdminUser) => {
    setEditUser(user)
    setEditValues({
      full_name: user.full_name ?? '',
      phone: user.phone ?? '',
      date_of_birth: user.date_of_birth ?? '',
      marketing_opt_in: Boolean(user.marketing_opt_in),
      role: user.role,
      ambassador_promotional_code_id: user.ambassador_promotional_code_id ?? null,
    })
  }

  const handleEditSave = async () => {
    if (!editUser) return
    setUpdatingId(editUser.id)
    try {
      const payload = {
        full_name: editValues.full_name.trim() || null,
        phone: editValues.phone.trim() || null,
        date_of_birth: editValues.date_of_birth || null,
        marketing_opt_in: editValues.marketing_opt_in,
        role: editValues.role,
        ambassador_promotional_code_id: editValues.ambassador_promotional_code_id,
      }
      const updated = await updateAdminUser(editUser.id, payload)
      queryClient.setQueryData(adminUsersQueryKey, (previous: typeof data | undefined) => {
        if (!previous) return previous
        return {
          ...previous,
          users: previous.users.map((user) =>
            user.id === editUser.id ? { ...user, ...updated } : user,
          ),
        }
      })
      await queryClient.invalidateQueries({ queryKey: [...adminUsersQueryKey, 'page'] })
      setEditUser(null)
    } catch (err) {
      console.error('Erreur mise à jour utilisateur:', err)
      alert('Erreur lors de la mise à jour de l’utilisateur.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Supprimer l’utilisateur "${user.full_name || user.email || user.id}" ?`)) {
      return
    }
    setDeleteLoadingId(user.id)
    try {
      await deleteAdminUser(user.id)
      queryClient.setQueryData(adminUsersQueryKey, (previous: typeof data | undefined) => {
        if (!previous) return previous
        return {
          ...previous,
          users: previous.users.filter((item) => item.id !== user.id),
        }
      })
      await queryClient.invalidateQueries({ queryKey: [...adminUsersQueryKey, 'page'] })
    } catch (err) {
      console.error('Erreur suppression utilisateur:', err)
      alert('Erreur lors de la suppression de l’utilisateur.')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {(error as Error).message || 'Impossible de charger les utilisateurs.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Utilisateurs</h3>
            <p className="text-sm text-muted-foreground">
              {data?.page?.totalCount ?? data?.total ?? 0} utilisateur{(data?.page?.totalCount ?? data?.total ?? 0) > 1 ? 's' : ''} correspondant{(data?.page?.totalCount ?? data?.total ?? 0) > 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            {isFetching ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Actualisation…
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </div>

        <OperationsList
          data={{ items: filteredUsers, nextCursor: data?.page?.nextCursor ?? null, total: data?.page?.totalCount }}
          status={isLoading ? 'loading' : isFetching ? 'stale' : 'idle'}
          errorMessage={undefined}
          onRetry={() => void refetch()}
          getItemId={(user) => user.id}
          columns={[
            { id: 'user', header: 'Utilisateur', cell: (user) => <><p className="truncate font-medium">{user.full_name || user.email || 'Utilisateur'}</p><p className="truncate text-xs text-muted-foreground">{user.email || '—'}</p>{user.phone ? <p className="truncate text-xs text-muted-foreground">{user.phone}</p> : null}</> },
            { id: 'role', header: 'Rôle', cell: (user) => <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as AdminUser['role'])} disabled={updatingId === user.id}><SelectTrigger className="h-8 w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">{roleLabels.user}</SelectItem><SelectItem value="volunteer">{roleLabels.volunteer}</SelectItem><SelectItem value="admin">{roleLabels.admin}</SelectItem><SelectItem value="ambassador">{roleLabels.ambassador}</SelectItem></SelectContent></Select> },
            { id: 'group', header: 'Groupe', cell: (user) => <><p className="truncate">{user.group_name || 'Aucun groupe'}</p>{user.group_invite_code ? <p className="font-mono text-xs text-muted-foreground">{user.group_invite_code}</p> : null}</> },
            { id: 'created', header: 'Créé le', cell: (user) => formatDate(user.created_at), hiddenByDefault: true },
            { id: 'last-sign-in', header: 'Dernière connexion', cell: (user) => formatDate(user.last_sign_in_at), hiddenByDefault: true },
          ] satisfies OperationsListColumn<AdminUser>[]}
          search={searchTerm}
          searchPlaceholder="Nom, email, rôle…"
          onSearchChange={setSearchTerm}
          filters={[{
            id: 'role',
            label: 'Rôle',
            value: roleFilter,
            options: [{ value: 'all', label: 'Tous' }, ...Object.entries(roleLabels).map(([value, label]) => ({ value, label }))],
          }, {
            id: 'limit',
            label: 'Lignes',
            value: String(limit),
            options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })),
          }]}
          onFilterChange={(filterId, value) => {
            resetPagination()
            if (filterId === 'role') setRoleFilter((value || 'all') as AdminUser['role'] | 'all')
            if (filterId === 'limit') setLimit(Number(value))
          }}
          rowActions={[
            { id: 'edit', label: 'Modifier', onSelect: openEditDialog },
            { id: 'email', label: 'Envoyer un email', onSelect: (user) => { if (user.email) window.location.href = `mailto:${user.email}` }, disabled: (user) => !user.email },
            { id: 'delete', label: 'Supprimer', destructive: true, onSelect: handleDelete, disabled: (user) => deleteLoadingId === user.id },
          ] satisfies OperationsListAction<AdminUser>[]}
          pagination={{ cursor, previousCursors, nextCursor: data?.page?.nextCursor ?? null, total: data?.page?.totalCount, limit }}
          onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => {
            setCursor(nextCursor)
            setPreviousCursors(nextPreviousCursors)
          }}
          itemLabel="utilisateur"
          emptyState={<div className="py-10 text-center text-sm text-muted-foreground">Aucun utilisateur ne correspond à cette recherche.</div>}
        />
      </CardContent>

      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Modifier l’utilisateur</DialogTitle>
            <DialogDescription>
              Mets à jour les informations du compte sélectionné.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1">
              <Label>Nom complet</Label>
              <Input
                value={editValues.full_name}
                onChange={(event) => setEditValues((prev) => ({ ...prev, full_name: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Téléphone</Label>
              <Input
                value={editValues.phone}
                onChange={(event) => setEditValues((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={editValues.date_of_birth}
                onChange={(event) => setEditValues((prev) => ({ ...prev, date_of_birth: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={editValues.role}
                onValueChange={(value) =>
                  setEditValues((prev) => ({ ...prev, role: value as AdminUser['role'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{roleLabels.user}</SelectItem>
                  <SelectItem value="volunteer">{roleLabels.volunteer}</SelectItem>
                  <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                  <SelectItem value="ambassador">{roleLabels.ambassador}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editValues.role === 'ambassador' ? (
              <div className="space-y-2">
                <Label>Code promo ambassadeur</Label>
                <Select
                  value={editValues.ambassador_promotional_code_id ?? ''}
                  onValueChange={(value) =>
                    setEditValues((prev) => ({
                      ...prev,
                      ambassador_promotional_code_id: value || null,
                    }))
                  }
                  disabled={promoCodesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={promoCodesLoading ? 'Chargement…' : 'Choisir un code actif'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePromoCodes.length === 0 ? (
                      <SelectItem value="__no_code_available__" disabled>
                        Aucun code promo disponible
                      </SelectItem>
                    ) : null}
                    {availablePromoCodes.map((code) => (
                      <SelectItem key={code.id} value={code.id}>
                        {code.code}{code.name ? ` — ${code.name}` : ''}{code.is_active ? '' : ' (inactif)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Seuls les codes actifs et non déjà associés à un autre ambassadeur sont listés.
                </p>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Marketing opt-in</Label>
                <p className="text-xs text-muted-foreground">
                  Autorise les communications marketing.
                </p>
              </div>
              <Switch
                checked={editValues.marketing_opt_in}
                onCheckedChange={(checked) =>
                  setEditValues((prev) => ({ ...prev, marketing_opt_in: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleEditSave} disabled={updatingId === editUser?.id}>
              {updatingId === editUser?.id ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default UsersSection
