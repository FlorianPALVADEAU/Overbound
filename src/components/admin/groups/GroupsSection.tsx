'use client'

import { useEffect, useMemo, useState } from 'react'
import { Users, Crown, Clock, Search, Trash2, RefreshCw, Plus, Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  useAdminUsers,
  type AdminUser,
} from '@/app/api/admin/users/usersQueries'
import { useAdminEvents, useAdminEventWaves } from '@/app/api/admin/events/eventsQueries'
import {
  useAdminAddGroupMember,
  useAdminCreateGroup,
  useAdminCreateGroupFromPromoCode,
  useAdminDeleteGroup,
  useAdminGroups,
  useAdminGroupsPromoCodes,
  useAdminImportGroupMembersFromPromoCode,
  useAdminRemoveGroupMember,
  useAdminUpdateGroup,
  type AdminGroup,
  type AdminGroupMember,
} from '@/app/api/admin/groups/groupsQueries'
import { formatWaveStartTime } from '@/lib/openSas'

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

const formatAnchor = (group: AdminGroup) => {
  if (group.anchor_wave_index === null || !group.anchor_start_time) return 'Non définie'
  return `Vague ${group.anchor_wave_index} (${formatWaveStartTime(group.anchor_start_time)})`
}

const getUserLabel = (user: AdminUser) => user.full_name || user.email || `Utilisateur #${user.id.slice(0, 8)}`
const getMemberLabel = (member: AdminGroupMember) =>
  member.full_name || member.email || `Utilisateur #${member.profile_id.slice(0, 8)}`

const searchUsers = (users: AdminUser[], term: string) => {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return users.slice(0, 8)
  return users
    .filter((user) =>
      [user.full_name, user.email, user.phone]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    )
    .slice(0, 8)
}

export function GroupsSection() {
  const { data, isLoading, isFetching, error, refetch } = useAdminGroups()
  const { data: usersData } = useAdminUsers()
  const { data: events = [] } = useAdminEvents()
  const { data: promoCodesData } = useAdminGroupsPromoCodes()

  const createGroup = useAdminCreateGroup()
  const createFromPromoCode = useAdminCreateGroupFromPromoCode()
  const importFromPromoCode = useAdminImportGroupMembersFromPromoCode()
  const updateGroup = useAdminUpdateGroup()
  const deleteGroup = useAdminDeleteGroup()
  const addMember = useAdminAddGroupMember()
  const removeMember = useAdminRemoveGroupMember()

  const [searchTerm, setSearchTerm] = useState('')

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createCaptainSearch, setCreateCaptainSearch] = useState('')
  const [createCaptainId, setCreateCaptainId] = useState('')
  const [createPromoCode, setCreatePromoCode] = useState('')

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null)
  const [editName, setEditName] = useState('')
  const [editCaptainId, setEditCaptainId] = useState('')
  const [editAnchorEventId, setEditAnchorEventId] = useState<string>('none')
  const [editAnchorWaveIndex, setEditAnchorWaveIndex] = useState<string>('none')
  const [newMemberSearch, setNewMemberSearch] = useState('')
  const [selectedNewMemberId, setSelectedNewMemberId] = useState('')
  const [selectedPromoCodeId, setSelectedPromoCodeId] = useState('none')

  const groups = data?.groups ?? []

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return groups
    return groups.filter((group) =>
      [group.name, group.invite_code, ...group.members.map((m) => `${m.full_name ?? ''} ${m.email ?? ''}`)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [groups, searchTerm])

  const membersInAnyGroup = useMemo(
    () => new Set(groups.flatMap((group) => group.members.map((member) => member.profile_id))),
    [groups]
  )

  const users = usersData?.users ?? []

  const availableCaptainsForCreate = useMemo(
    () => users.filter((user) => !membersInAnyGroup.has(user.id)),
    [users, membersInAnyGroup]
  )

  const createCaptainCandidates = useMemo(
    () => searchUsers(availableCaptainsForCreate, createCaptainSearch),
    [availableCaptainsForCreate, createCaptainSearch]
  )

  const editableCaptainCandidates = useMemo(() => {
    if (!editingGroup) return []
    const memberIds = new Set(editingGroup.members.map((member) => member.profile_id))
    return users.filter((user) => memberIds.has(user.id))
  }, [users, editingGroup])

  const addMemberCandidates = useMemo(() => {
    if (!editingGroup) return []
    const available = users.filter((user) => !membersInAnyGroup.has(user.id))
    return searchUsers(available, newMemberSearch)
  }, [users, membersInAnyGroup, editingGroup, newMemberSearch])

  const { data: editAnchorWaves = [] } = useAdminEventWaves(editAnchorEventId !== 'none' ? editAnchorEventId : null)

  useEffect(() => {
    if (!editingGroup) return
    setEditName(editingGroup.name)
    setEditCaptainId(editingGroup.captain_id)
    setEditAnchorEventId(editingGroup.anchor_event_id ?? 'none')
    setEditAnchorWaveIndex(editingGroup.anchor_wave_index !== null ? String(editingGroup.anchor_wave_index) : 'none')
    setNewMemberSearch('')
    setSelectedNewMemberId('')
    setSelectedPromoCodeId('none')
  }, [editingGroup])

  const handleCreate = async () => {
    if (!createName.trim() || !createCaptainId) return
    await createGroup.mutateAsync({ name: createName.trim(), captain_profile_id: createCaptainId }).catch(() => {})
    setCreateDialogOpen(false)
    setCreateName('')
    setCreateCaptainSearch('')
    setCreateCaptainId('')
    setCreatePromoCode('')
  }

  const handleCreateFromPromoCode = async () => {
    if (!createName.trim() || !createPromoCode.trim() || !createCaptainId) return
    await createFromPromoCode
      .mutateAsync({
        name: createName.trim(),
        promotional_code: createPromoCode.trim().toUpperCase(),
        captain_profile_id: createCaptainId,
      })
      .catch(() => {})
    setCreateDialogOpen(false)
    setCreateName('')
    setCreateCaptainSearch('')
    setCreateCaptainId('')
    setCreatePromoCode('')
  }

  const handleOpenEdit = (group: AdminGroup) => {
    setEditingGroup(group)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingGroup || !editName.trim() || !editCaptainId) return

    const payload: {
      id: string
      name: string
      captain_id: string
      anchor_event_id?: string | null
      anchor_wave_index?: number | null
    } = {
      id: editingGroup.id,
      name: editName.trim(),
      captain_id: editCaptainId,
    }

    if (editAnchorEventId === 'none') {
      payload.anchor_event_id = null
      payload.anchor_wave_index = null
    } else if (editAnchorWaveIndex !== 'none') {
      payload.anchor_event_id = editAnchorEventId
      payload.anchor_wave_index = Number(editAnchorWaveIndex)
    }

    await updateGroup.mutateAsync(payload).catch(() => {})
  }

  const handleImportFromPromo = async () => {
    if (!editingGroup || selectedPromoCodeId === 'none') return
    const selectedCode = promoCodesData?.codes.find((code) => code.id === selectedPromoCodeId)
    if (!selectedCode) return
    await importFromPromoCode
      .mutateAsync({ id: editingGroup.id, promotional_code: selectedCode.code })
      .catch(() => {})
  }

  const handleAddMember = async () => {
    if (!editingGroup || !selectedNewMemberId) return
    await addMember.mutateAsync({ id: editingGroup.id, profile_id: selectedNewMemberId }).catch(() => {})
    setSelectedNewMemberId('')
    setNewMemberSearch('')
  }

  const handleRemoveMember = async (group: AdminGroup, profileId: string) => {
    if (!confirm('Exclure ce membre du groupe ?')) return
    await removeMember.mutateAsync({ id: group.id, profileId }).catch(() => {})
  }

  const handleDelete = async (group: AdminGroup) => {
    if (!confirm(`Supprimer le groupe "${group.name}" ?`)) return
    await deleteGroup.mutateAsync(group.id).catch(() => {})
  }

  const anyPending =
    createGroup.isPending ||
    createFromPromoCode.isPending ||
    importFromPromoCode.isPending ||
    updateGroup.isPending ||
    deleteGroup.isPending ||
    addMember.isPending ||
    removeMember.isPending

  const errorMessage =
    (error as Error | null)?.message ||
    createGroup.error?.message ||
    createFromPromoCode.error?.message ||
    importFromPromoCode.error?.message ||
    updateGroup.error?.message ||
    deleteGroup.error?.message ||
    addMember.error?.message ||
    removeMember.error?.message ||
    null

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{(error as Error).message || 'Impossible de charger les groupes.'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Groupes</h3>
            <p className="text-sm text-muted-foreground">{groups.length} groupe{groups.length > 1 ? 's' : ''}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Créer un groupe
            </Button>
            {isFetching ? <Clock className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />Rafraîchir
            </Button>
          </div>
        </div>

        <div className="space-y-1 md:max-w-sm">
          <Label>Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-9" />
          </div>
        </div>

        {errorMessage ? (
          <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>
        ) : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Groupe</TableHead>
                <TableHead>Capitaine</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Vague ancre</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[220px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : filteredGroups.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Aucun groupe.</TableCell></TableRow>
              ) : (
                filteredGroups.map((group) => {
                  const captain = group.members.find((member) => member.profile_id === group.captain_id)
                  return (
                    <TableRow key={group.id}>
                      <TableCell><div className="font-medium">{group.name}</div><div className="text-xs text-muted-foreground font-mono">{group.invite_code}</div></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" />{captain ? getMemberLabel(captain) : '—'}</div></TableCell>
                      <TableCell>{group.members.length}</TableCell>
                      <TableCell>{formatAnchor(group)}</TableCell>
                      <TableCell>{formatDate(group.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(group)}>Modifier</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(group)} disabled={deleteGroup.isPending}><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un groupe</DialogTitle>
            <DialogDescription>Sélectionne explicitement le capitaine.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du groupe</Label>
              <Input value={createName} onChange={(event) => setCreateName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Capitaine</Label>
              <Input value={createCaptainSearch} onChange={(event) => setCreateCaptainSearch(event.target.value)} placeholder="Rechercher un utilisateur" />
              <div className="max-h-44 overflow-auto rounded-md border">
                {createCaptainCandidates.map((user) => (
                  <button key={user.id} type="button" onClick={() => setCreateCaptainId(user.id)} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${createCaptainId === user.id ? 'bg-muted' : ''}`}>
                    <p className="truncate">{getUserLabel(user)}</p>
                    {user.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">Créer depuis code promo ambassadeur</p>
              <Input value={createPromoCode} onChange={(event) => setCreatePromoCode(event.target.value.toUpperCase())} className="font-mono uppercase" />
              <Button variant="outline" onClick={handleCreateFromPromoCode} disabled={!createName.trim() || !createCaptainId || !createPromoCode.trim() || createFromPromoCode.isPending}>
                {createFromPromoCode.isPending ? 'Création…' : 'Créer depuis ce code promo'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!createName.trim() || !createCaptainId || createGroup.isPending}>{createGroup.isPending ? 'Création…' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le groupe</DialogTitle>
            <DialogDescription>Infos, capitaine, membres, SAS et import promo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom du groupe</Label>
                <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Capitaine</Label>
                <Select value={editCaptainId} onValueChange={setEditCaptainId}>
                  <SelectTrigger><SelectValue placeholder="Choisir le capitaine" /></SelectTrigger>
                  <SelectContent>
                    {editableCaptainCandidates.map((user) => <SelectItem key={user.id} value={user.id}>{getUserLabel(user)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <p className="text-sm font-medium">Forcer le SAS de départ</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Événement</Label>
                  <Select value={editAnchorEventId} onValueChange={(value) => { setEditAnchorEventId(value); setEditAnchorWaveIndex('none') }}>
                    <SelectTrigger><SelectValue placeholder="Aucune ancre" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune ancre</SelectItem>
                      {events.map((event) => <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vague</Label>
                  <Select value={editAnchorWaveIndex} onValueChange={setEditAnchorWaveIndex} disabled={editAnchorEventId === 'none'}>
                    <SelectTrigger><SelectValue placeholder="Choisir une vague" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune vague</SelectItem>
                      {editAnchorWaves.map((wave) => <SelectItem key={wave.wave_index} value={String(wave.wave_index)}>Vague {wave.wave_index} - {formatWaveStartTime(wave.start_time)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <p className="text-sm font-medium">Importer des membres depuis un code promo</p>
              <Select value={selectedPromoCodeId} onValueChange={setSelectedPromoCodeId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un code promo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {(promoCodesData?.codes ?? []).map((code) => (
                    <SelectItem key={code.id} value={code.id}>
                      {code.code}{code.name ? ` - ${code.name}` : ''}{code.is_active ? '' : ' (inactif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleImportFromPromo} disabled={selectedPromoCodeId === 'none' || importFromPromoCode.isPending}>
                {importFromPromoCode.isPending ? 'Import…' : 'Importer les membres du code promo'}
              </Button>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <p className="text-sm font-medium">Ajouter un membre manuellement</p>
              <Input value={newMemberSearch} onChange={(event) => setNewMemberSearch(event.target.value)} placeholder="Rechercher un utilisateur" />
              <div className="max-h-40 overflow-auto rounded-md border">
                {addMemberCandidates.map((user) => (
                  <button key={user.id} type="button" onClick={() => setSelectedNewMemberId(user.id)} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${selectedNewMemberId === user.id ? 'bg-muted' : ''}`}>
                    <p className="truncate">{getUserLabel(user)}</p>
                    {user.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
                  </button>
                ))}
              </div>
              <Button onClick={handleAddMember} disabled={!selectedNewMemberId || addMember.isPending}>{addMember.isPending ? 'Ajout…' : 'Ajouter au groupe'}</Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Membres actuels</p>
              {(editingGroup?.members ?? []).map((member) => {
                const isCaptain = member.profile_id === editingGroup?.captain_id
                return (
                  <div key={member.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{getMemberLabel(member)}</p>
                      <p className="text-xs text-muted-foreground">{member.email ?? `Utilisateur #${member.profile_id.slice(0, 8)}`}</p>
                    </div>
                    {isCaptain ? (
                      <span className="text-xs text-amber-600 flex items-center gap-1"><Crown className="h-3.5 w-3.5" />Capitaine</span>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => editingGroup && handleRemoveMember(editingGroup, member.profile_id)} disabled={removeMember.isPending}><Trash2 className="mr-1.5 h-4 w-4" />Exclure</Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Fermer</Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim() || !editCaptainId || anyPending}><Save className="mr-2 h-4 w-4" />{updateGroup.isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default GroupsSection
