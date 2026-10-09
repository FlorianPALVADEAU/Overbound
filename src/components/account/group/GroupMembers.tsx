'use client'

import { useMemo, useState } from 'react'
import { CrownIcon, MoreVerticalIcon, SearchIcon, ShieldIcon } from 'lucide-react'
import { Eyebrow } from '@/components/account/AccountScreen'
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
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { filterMembers, memberDisplayName, sortMembers } from '@/lib/groups/members'
import { UserAvatar } from '@/components/account/UserAvatar'
import type { GroupMember } from '@/types/Group'

/** Short lists are shown whole; long ones get a search box and a "show more" step. */
const SEARCH_THRESHOLD = 8
const PAGE_SIZE = 20

interface GroupMembersProps {
  members: GroupMember[]
  currentUserId: string
  isCaptain: boolean
  busy: boolean
  onDelegate: (profileId: string) => void
}

export function GroupMembers({ members, currentUserId, isCaptain, busy, onDelegate }: GroupMembersProps) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(SEARCH_THRESHOLD)
  const [delegateTarget, setDelegateTarget] = useState<GroupMember | null>(null)

  const sorted = useMemo(() => sortMembers(members, currentUserId), [members, currentUserId])
  const matches = useMemo(() => filterMembers(sorted, query), [sorted, query])
  const shown = matches.slice(0, visible)
  const searchable = members.length > SEARCH_THRESHOLD

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <Eyebrow>Membres</Eyebrow>
        <p className="text-xs tabular-nums text-muted-foreground">{members.length}</p>
      </div>

      {searchable ? (
        <div className="relative mb-2">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setVisible(SEARCH_THRESHOLD)
            }}
            placeholder="Rechercher un membre"
            aria-label="Rechercher un membre"
            className="h-11 pl-9 text-base"
          />
        </div>
      ) : null}

      <ul>
        {shown.map((member) => {
          const isSelf = member.profile_id === currentUserId
          return (
            <li key={member.id} className="flex min-h-14 items-center gap-3 border-t border-border py-2 first:border-t-0">
              <UserAvatar
                src={member.avatar_url}
                name={member.full_name}
                email={member.email}
                tone={member.role === 'captain' ? 'brand' : 'neutral'}
                className="size-10 shrink-0"
              />
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-base font-semibold">
                <span className="truncate">{memberDisplayName(member)}</span>
                {isSelf ? <span className="shrink-0 text-xs font-normal text-muted-foreground">(toi)</span> : null}
                {member.role === 'captain' ? <CrownIcon className="size-3.5 shrink-0 text-amber-400" aria-label="Capitaine" /> : null}
              </span>
              {isCaptain && !isSelf ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={busy} aria-label={`Actions pour ${memberDisplayName(member)}`} className="size-11 shrink-0">
                      <MoreVerticalIcon className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setDelegateTarget(member)}>
                      <ShieldIcon className="size-4" />
                      Passer capitaine
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </li>
          )
        })}
      </ul>

      {matches.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Aucun membre ne correspond.</p> : null}

      {matches.length > shown.length ? (
        <Button variant="outline" onClick={() => setVisible((current) => current + PAGE_SIZE)} className="mt-3 h-11 w-full font-bold">
          Afficher {Math.min(PAGE_SIZE, matches.length - shown.length)} de plus ({matches.length - shown.length} restants)
        </Button>
      ) : null}

      <AlertDialog open={delegateTarget !== null} onOpenChange={(open) => !open && setDelegateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passer le rôle de capitaine ?</AlertDialogTitle>
            <AlertDialogDescription>
              {delegateTarget ? memberDisplayName(delegateTarget) : ''} pourra renommer le groupe, le dissoudre et passer le rôle à son tour. Tu deviendras simple membre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="h-11"
              onClick={() => {
                if (delegateTarget) onDelegate(delegateTarget.profile_id)
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
