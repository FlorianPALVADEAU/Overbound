'use client'

import { useState } from 'react'
import { CheckIcon, CopyIcon, Share2Icon } from 'lucide-react'
import {
  useDelegateGroup,
  useDisbandGroup,
  useLeaveGroup,
  useRenameGroup,
} from '@/app/api/groups/groupQueries'
import { Eyebrow } from '@/components/account/AccountScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatClockTimeParis } from '@/lib/dateTime'
import { useGroupInvite } from '@/hooks/account/useGroupInvite'
import type { Group } from '@/types/Group'
import { ConfirmAction } from './ConfirmAction'
import { GroupInsights } from './GroupInsights'
import { GroupMembers } from './GroupMembers'

export function GroupDetails({ group, currentUserId }: { group: Group; currentUserId: string }) {
  const renameGroup = useRenameGroup()
  const disbandGroup = useDisbandGroup()
  const leaveGroup = useLeaveGroup()
  const delegateGroup = useDelegateGroup()
  const { invite, copyCode, copied } = useGroupInvite(group)

  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(group.name)

  const isCaptain = group.captain_id === currentUserId
  const busy = renameGroup.isPending || disbandGroup.isPending || leaveGroup.isPending || delegateGroup.isPending
  const error =
    renameGroup.error?.message ?? disbandGroup.error?.message ?? leaveGroup.error?.message ?? delegateGroup.error?.message
  const anchorTime = formatClockTimeParis(group.anchor_start_time)

  const rename = async () => {
    if (!draftName.trim()) return
    try {
      await renameGroup.mutateAsync({ id: group.id, name: draftName.trim() })
      setRenaming(false)
    } catch {
      // surfaced through renameGroup.error
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <Eyebrow>Mon groupe</Eyebrow>
        {renaming ? (
          <div className="mt-2 flex gap-2">
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && rename()}
              autoFocus
              className="h-12 text-lg font-bold"
              aria-label="Nom du groupe"
            />
            <Button onClick={rename} disabled={!draftName.trim() || busy} className="h-12 px-5 font-bold">
              OK
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-balance text-[2.5rem] font-black leading-[0.95] tracking-tight">{group.name}</h1>
            {isCaptain ? (
              <button
                type="button"
                onClick={() => {
                  setDraftName(group.name)
                  setRenaming(true)
                }}
                className="min-h-11 shrink-0 text-sm font-semibold text-primary"
              >
                Renommer
              </button>
            ) : null}
          </div>
        )}
        <p className="mt-2 text-muted-foreground">
          {group.members.length} membre{group.members.length > 1 ? 's' : ''}
          {group.anchor_wave_index && anchorTime ? ` · départ commun SAS ${group.anchor_wave_index} à ${anchorTime}` : ''}
        </p>
      </header>

      <div className="space-y-10 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:space-y-0">
      <section className="space-y-4 lg:self-start">
        <Eyebrow>Code d&apos;invitation</Eyebrow>
        <button
          type="button"
          onClick={copyCode}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-label="Copier le code d'invitation"
        >
          <span className="font-mono text-4xl font-black tracking-[0.18em]">{group.invite_code}</span>
          {copied ? <CheckIcon className="size-6 text-primary" /> : <CopyIcon className="size-5 text-muted-foreground" />}
        </button>
        <Button onClick={invite} className="h-12 w-full gap-2 text-base font-bold">
          <Share2Icon className="size-5" />
          Inviter mes amis
        </Button>
      </section>

      <GroupMembers
        members={group.members}
        currentUserId={currentUserId}
        isCaptain={isCaptain}
        busy={busy}
        onDelegate={(profileId) => delegateGroup.mutate({ id: group.id, new_captain_id: profileId })}
      />
      </div>

      <GroupInsights />

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      <section className="border-t border-border pt-4">
        {isCaptain ? (
          <ConfirmAction
            trigger={
              <button type="button" disabled={busy} className="min-h-11 text-sm font-semibold text-destructive">
                Dissoudre le groupe
              </button>
            }
            title="Dissoudre le groupe ?"
            description="Tous les membres sont retirés du groupe. Cette action est irréversible."
            confirmLabel="Dissoudre"
            onConfirm={() => disbandGroup.mutate(group.id)}
          />
        ) : (
          <ConfirmAction
            trigger={
              <button type="button" disabled={busy} className="min-h-11 text-sm font-semibold text-destructive">
                Quitter le groupe
              </button>
            }
            title="Quitter le groupe ?"
            description="Tu ne partageras plus le départ du groupe. Ton SAS actuel est conservé."
            confirmLabel="Quitter"
            onConfirm={() => leaveGroup.mutate(group.id)}
          />
        )}
      </section>
    </div>
  )
}
