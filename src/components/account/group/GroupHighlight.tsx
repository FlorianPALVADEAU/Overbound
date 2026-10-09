'use client'

import Link from 'next/link'
import { CheckIcon, Share2Icon, UsersIcon } from 'lucide-react'
import { useMyGroup } from '@/app/api/groups/groupQueries'
import { Eyebrow } from '@/components/account/AccountScreen'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroupInvite } from '@/hooks/account/useGroupInvite'
import { UserAvatar } from '@/components/account/UserAvatar'
import { formatClockTimeParis } from '@/lib/dateTime'
import type { Group } from '@/types/Group'

const MAX_AVATARS = 5

function MemberAvatars({ group }: { group: Group }) {
  const shown = group.members.slice(0, MAX_AVATARS)
  const hidden = group.members.length - shown.length

  return (
    <ul className="flex -space-x-2" aria-label="Membres du groupe">
      {shown.map((member, index) => (
        <li key={member.id} className="relative" style={{ zIndex: index }} title={member.full_name ?? member.email ?? undefined}>
          <UserAvatar src={member.avatar_url} name={member.full_name} email={member.email} className="size-10 border-2 border-background" />
        </li>
      ))}
      {hidden > 0 ? (
        <li
          className="relative flex size-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-bold"
          style={{ zIndex: shown.length }}
        >
          +{hidden}
        </li>
      ) : null}
    </ul>
  )
}

function ActiveGroup({ group }: { group: Group }) {
  const { invite, copied } = useGroupInvite(group)
  const departure = formatClockTimeParis(group.anchor_start_time)
  const members = group.members.length

  return (
    <section className="rounded-2xl bg-primary/10 p-5 ring-1 ring-primary/30">
      <Eyebrow className="text-primary">Mon groupe</Eyebrow>
      <h2 className="mt-1 text-2xl font-black leading-tight tracking-tight">{group.name}</h2>

      <div className="mt-4 space-y-3">
        <MemberAvatars group={group} />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {members} membre{members > 1 ? 's' : ''}
          </span>
          {group.anchor_wave_index && departure ? ` · départ commun SAS ${group.anchor_wave_index}, ${departure}` : ''}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button onClick={invite} className="h-11 gap-2 font-bold">
          {copied ? <CheckIcon className="size-4" /> : <Share2Icon className="size-4" />}
          {copied ? 'Copié' : 'Inviter'}
        </Button>
        <Button asChild variant="outline" className="h-11 font-bold">
          <Link href="/account/group">Gérer</Link>
        </Button>
      </div>
    </section>
  )
}

function NoGroup() {
  return (
    <section className="rounded-2xl border-2 border-dashed border-primary/40 p-5">
      <UsersIcon className="size-6 text-primary" />
      <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight">Partez ensemble.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Collègues, club, potes : un groupe, c&apos;est le même départ pour toute la bande et un code pour inviter.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button asChild className="h-11 font-bold">
          <Link href="/account/group">Créer un groupe</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 font-bold">
          <Link href="/account/group">J&apos;ai un code</Link>
        </Button>
      </div>
    </section>
  )
}

/** Home block that keeps the group one tap away, whether or not the user has one yet. */
export function GroupHighlight() {
  const { data: group, isLoading } = useMyGroup()

  if (isLoading) return <Skeleton className="h-44 w-full rounded-2xl" />
  return group ? <ActiveGroup group={group} /> : <NoGroup />
}
