'use client'

import { useMemo, useState } from 'react'
import { Mail, Search, UserCog, RefreshCw, Clock, Pencil, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useAdminUsers,
  updateAdminUserRole,
  updateAdminUser,
  deleteAdminUser,
  adminUsersQueryKey,
  type AdminUser,
} from '@/app/api/admin/users/usersQueries'

const roleLabels: Record<AdminUser['role'], string> = {
  user: 'Utilisateur',
  volunteer: 'Bénévole',
  admin: 'Administrateur',
}

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

export function UsersSection() {
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editValues, setEditValues] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    marketing_opt_in: false,
    role: 'user' as AdminUser['role'],
  })
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching, error, refetch } = useAdminUsers()

  const users = data?.users ?? []

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) =>
      [
        user.full_name,
        user.email,
        roleLabels[user.role],
        user.phone,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term)),
    )
  }, [searchTerm, users])

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
              {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nom, email, rôle…"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Dernière connexion</TableHead>
              <TableHead className="w-[260px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <Clock className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    Chargement des utilisateurs…
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun utilisateur ne correspond à cette recherche.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{user.full_name || user.email || 'Utilisateur'}</span>
                        <span className="text-xs text-muted-foreground">{user.email || '—'}</span>
                        {user.phone ? (
                          <span className="text-xs text-muted-foreground">{user.phone}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as AdminUser['role'])}
                          disabled={updatingId === user.id}
                        >
                          <SelectTrigger className="h-8 w-[180px]">
                            <SelectValue placeholder="Choisir un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">{roleLabels.user}</SelectItem>
                            <SelectItem value="volunteer">{roleLabels.volunteer}</SelectItem>
                            <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.last_sign_in_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                        {user.email ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={`mailto:${user.email}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          disabled={deleteLoadingId === user.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteLoadingId === user.id ? 'Suppression…' : 'Supprimer'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
                </SelectContent>
              </Select>
            </div>
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
