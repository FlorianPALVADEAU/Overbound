'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Users, Copy, Check, Crown, LogOut, Shield, Plus, Share2 } from 'lucide-react'
import { FAKE_MY_GROUP } from '@/lib/groups/fakeData'
import {
  useMyGroup,
  useCreateGroup,
  useRenameGroup,
  useDisbandGroup,
  useJoinGroup,
  useDelegateGroup,
  useLeaveGroup,
  useGroupInvitePreview,
} from '@/app/api/groups/groupQueries'
import type { GroupMember } from '@/types/Group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface GroupSectionProps {
  currentUserId: string
}

export default function GroupSection({ currentUserId }: GroupSectionProps) {
  const { data: group, isLoading } = useMyGroup()

  const createGroup = useCreateGroup()
  const renameGroup = useRenameGroup()
  const disbandGroup = useDisbandGroup()
  const joinGroup = useJoinGroup()
  const delegateGroup = useDelegateGroup()
  const leaveGroup = useLeaveGroup()

  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('join') ?? ''
  })
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [copied, setCopied] = useState(false)
  const [delegatingTo, setDelegatingTo] = useState<string | null>(null)
  const [joinWaveReassigned, setJoinWaveReassigned] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)

  const USE_FAKE = process.env.NEXT_PUBLIC_FAKE_GROUPS === 'true'
  const resolvedUserId = USE_FAKE ? FAKE_MY_GROUP.captain_id : currentUserId
  const isCaptain = group?.captain_id === resolvedUserId
  const { data: invitePreview, isLoading: invitePreviewLoading, error: invitePreviewError } =
    useGroupInvitePreview(joinCode || null, { enabled: !group && joinCode.trim().length === 8 })

  useEffect(() => {
    if (!group && joinCode.trim().length === 8) {
      setJoinDialogOpen(true)
    }
  }, [group, joinCode])

  useEffect(() => {
    if (group) {
      setJoinDialogOpen(false)
    }
  }, [group])

  const copyInviteCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!group) return
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'
    const joinUrl = `${siteUrl}/account?tab=group&join=${group.invite_code}`
    const text = `Rejoins mon groupe "${group.name}" sur Overbound ! 🏅\nUtilise ce lien pour rejoindre directement : ${joinUrl}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {}
    }
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreate = async () => {
    if (!createName.trim()) return
    try {
      await createGroup.mutateAsync(createName.trim())
      setCreateName('')
    } catch {}
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    try {
      const result = await joinGroup.mutateAsync(joinCode.trim())
      setJoinCode('')
      if (result.wave_reassigned) {
        setJoinWaveReassigned(true)
      }
    } catch {}
  }

  const getCaptainLabel = () => {
    if (!invitePreview) return 'Capitaine'
    return invitePreview.captain.full_name || invitePreview.captain.email || 'Capitaine'
  }

  const handleRename = async () => {
    if (!group || !newName.trim()) return
    try {
      await renameGroup.mutateAsync({ id: group.id, name: newName.trim() })
      setEditingName(false)
      setNewName('')
    } catch {}
  }

  const handleDisband = async () => {
    if (!group) return
    if (!confirm('Dissoudre le groupe ? Cette action est irréversible.')) return
    try {
      await disbandGroup.mutateAsync(group.id)
    } catch {}
  }

  const handleLeave = async () => {
    if (!group) return
    if (!confirm('Quitter le groupe ?')) return
    try {
      await leaveGroup.mutateAsync(group.id)
    } catch {}
  }

  const handleDelegate = async (memberId: string) => {
    if (!group) return
    if (!confirm('Déléguer le rôle de capitaine à ce membre ?')) return
    try {
      await delegateGroup.mutateAsync({ id: group.id, new_captain_id: memberId })
      setDelegatingTo(null)
    } catch {}
  }

  const getMemberDisplayName = (m: GroupMember) => {
    if (m.full_name) return m.full_name
    if (m.email) return m.email.split('@')[0]
    return m.profile_id.slice(0, 8)
  }

  const anyLoading =
    createGroup.isPending || joinGroup.isPending || renameGroup.isPending ||
    disbandGroup.isPending || delegateGroup.isPending || leaveGroup.isPending

  const error =
    createGroup.error?.message || joinGroup.error?.message || renameGroup.error?.message ||
    disbandGroup.error?.message || delegateGroup.error?.message || leaveGroup.error?.message

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Chargement...</CardContent>
      </Card>
    )
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Rejoindre ce groupe ?</DialogTitle>
              <DialogDescription>
                {invitePreview
                  ? 'Vérifie les informations puis confirme pour rejoindre.'
                  : 'Chargement des informations du groupe...'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              {invitePreviewLoading ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : invitePreview ? (
                <>
                  <p><span className="font-medium">Groupe :</span> {invitePreview.name}</p>
                  <p><span className="font-medium">Capitaine :</span> {getCaptainLabel()}</p>
                  <p><span className="font-medium">Membres :</span> {invitePreview.members_count}</p>
                  <p><span className="font-medium">Code :</span> <span className="font-mono">{invitePreview.invite_code}</span></p>
                </>
              ) : (
                <p className="text-destructive">{(invitePreviewError as Error | null)?.message || 'Code invalide'}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Plus tard</Button>
              <Button
                onClick={handleJoin}
                disabled={!invitePreview || joinGroup.isPending}
              >
                {joinGroup.isPending ? 'Connexion...' : 'Rejoindre le groupe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Créer un groupe
            </CardTitle>
            <CardDescription>
              Créez un groupe pour partir au même départ que vos collègues ou amis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nom du groupe (ex: Entreprise XYZ)"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                disabled={anyLoading}
              />
              <Button onClick={handleCreate} disabled={!createName.trim() || anyLoading}>
                Créer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Rejoindre un groupe
            </CardTitle>
            <CardDescription>
              Entrez le code d&apos;invitation partagé par votre capitaine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Code d'invitation (ex: AB12CD34)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                disabled={anyLoading}
                className="font-mono uppercase"
              />
              <Button onClick={handleJoin} disabled={!joinCode.trim() || anyLoading}>
                Rejoindre
              </Button>
            </div>
            {joinWaveReassigned && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Ta vague de départ a été mise à jour pour correspondre à celle du groupe.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-7 text-sm w-48"
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    autoFocus
                  />
                  <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>Annuler</Button>
                  <Button size="sm" onClick={handleRename} disabled={!newName.trim() || anyLoading}>OK</Button>
                </div>
              ) : (
                <span>{group.name}</span>
              )}
              {isCaptain && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Capitaine
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {group.members.length} membre{group.members.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {isCaptain && !editingName && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingName(true); setNewName(group.name) }}
              >
                Renommer
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Invite code */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Code d&apos;invitation</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-widest">{group.invite_code}</span>
            <Button size="sm" variant="ghost" onClick={copyInviteCode} className="h-7 px-2">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button size="sm" onClick={handleShare} className="gap-2 mt-1">
            <Share2 className="h-4 w-4" />
            Partager le code
          </Button>
          <p className="text-xs text-muted-foreground">
            Partagez ce code à vos équipiers pour qu&apos;ils rejoignent votre groupe.
          </p>
        </div>

        {/* Wave anchor info */}
        {group.anchor_wave_index && group.anchor_start_time && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/10 dark:bg-blue-950/30 dark:border-blue-800 p-3 space-y-1">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">Vague de départ du groupe pour les participants du format OPEN</p>
            <p className="text-sm font-semibold">
              Vague {group.anchor_wave_index} —{' '}
              {new Date(group.anchor_start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-muted-foreground">
              Les nouveaux membres inscrits à cet événement seront automatiquement assignés à cette vague.
            </p>
          </div>
        )}

        <Separator />

        {/* Members list */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">Membres</p>
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {m.role === 'captain' ? (
                  <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm truncate">
                  {getMemberDisplayName(m)}
                  {m.profile_id === currentUserId && (
                    <span className="text-xs text-muted-foreground ml-1">(vous)</span>
                  )}
                </span>
              </div>
              {isCaptain && m.profile_id !== currentUserId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={() => handleDelegate(m.profile_id)}
                  disabled={anyLoading}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Capitaine
                </Button>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {isCaptain ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisband}
              disabled={anyLoading}
            >
              Dissoudre le groupe
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLeave}
              disabled={anyLoading}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Quitter le groupe
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
