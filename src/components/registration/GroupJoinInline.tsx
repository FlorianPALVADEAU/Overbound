'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useCreateGroup, useJoinGroup } from '@/app/api/groups/groupQueries'

export default function GroupJoinInline() {
  const [mode, setMode] = useState<'join' | 'create' | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [groupName, setGroupName] = useState('')

  const joinGroup = useJoinGroup()
  const createGroup = useCreateGroup()

  const error = joinGroup.error?.message ?? createGroup.error?.message ?? null
  const isLoading = joinGroup.isPending || createGroup.isPending

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    await joinGroup.mutateAsync(inviteCode.trim()).catch(() => {})
  }

  const handleCreate = async () => {
    if (!groupName.trim()) return
    await createGroup.mutateAsync(groupName.trim()).catch(() => {})
  }

  return (
    <div className="rounded-lg border border-green-500/60 bg-green-500/10 p-4 space-y-3">
      <button
        type="button"
        onClick={() => setMode(mode ? null : 'join')}
        className="flex w-full items-center justify-between text-sm font-semibold text-green-800 dark:text-green-300 hover:text-green-900 dark:hover:text-green-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" />
          Tu t&apos;inscris avec des collègues ou amis ?
        </span>
        {mode
          ? <ChevronUp className="h-4 w-4 shrink-0" />
          : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {!mode && (
        <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
          Rejoins ou crée un groupe pour être automatiquement assigné au même SAS que tes équipiers.
        </p>
      )}

      {mode && (
        <div className="space-y-3">
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === 'join'
                  ? 'bg-green-600 text-white'
                  : 'text-green-700 dark:text-green-400 hover:bg-green-500/20'
              }`}
            >
              Rejoindre un groupe
            </button>
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-green-600 text-white'
                  : 'text-green-700 dark:text-green-400 hover:bg-green-500/20'
              }`}
            >
              Créer un groupe
            </button>
          </div>

          {mode === 'join' && (
            <div className="space-y-2">
              <p className="text-xs text-green-700 dark:text-green-400">
                Entre le code partagé par ton capitaine.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Code d'invitation (ex: AB12CD34)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="font-mono uppercase h-9 text-sm bg-background"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleJoin}
                  disabled={!inviteCode.trim() || isLoading}
                  className="h-9 shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  Rejoindre
                </Button>
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-2">
              <p className="text-xs text-green-700 dark:text-green-400">
                Crée un groupe et partage le code à tes équipiers.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom du groupe (ex: Entreprise XYZ)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="h-9 text-sm bg-background"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!groupName.trim() || isLoading}
                  className="h-9 shrink-0 bg-green-600 hover:bg-green-700 text-white"
                >
                  Créer
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
      )}
    </div>
  )
}
