'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useCreateGroup,
  useGroupInvitePreview,
  useJoinGroup,
} from '@/app/api/groups/groupQueries'
import {
  buildInviteMessage,
  buildInviteUrl,
  buildWhatsAppUrl,
  defaultGroupName,
  type GroupIntent,
} from '@/lib/groups/invite'
import { formatWaveStartTime } from '@/lib/openSas'
import type { Group } from '@/types/Group'
import type { EventUser } from './types'

interface Props {
  user: EventUser | null
  event: { slug: string; id: string; title: string }
  group: Group | null | undefined
  /** Open a group action from the page URL (?group=create|join). */
  intent: GroupIntent | null
  /** Group the visitor was invited to (?invite=CODE). */
  inviteCode: string | null
  /** Guest taps a group action: ask them to sign in first, without leaving the page. */
  onNeedAuth: (intent: GroupIntent) => void
}

const shell = 'scroll-mt-24 rounded-2xl border border-primary/50 bg-primary/10 p-4 sm:p-5'

/**
 * Group actions inside the registration, no trip to the account page:
 * create in one tap (name chosen for you), join with a code or an invite link,
 * and share the invite from here once the group exists.
 */
export default function GroupPanel({ user, event, group, intent, inviteCode, onNeedAuth }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<GroupIntent | null>(intent)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const createGroup = useCreateGroup()
  const joinGroup = useJoinGroup()
  const preview = useGroupInvitePreview(inviteCode, { enabled: Boolean(user) && !group })
  const error = createGroup.error?.message ?? joinGroup.error?.message ?? null
  const busy = createGroup.isPending || joinGroup.isPending

  useEffect(() => {
    if (intent) setMode(intent)
  }, [intent])

  // Arriving from a "create a group" or invite link: bring the panel into view.
  useEffect(() => {
    if (intent || inviteCode) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [intent, inviteCode])

  const create = () => {
    if (!user) return onNeedAuth('create')
    createGroup.mutate(defaultGroupName(user.fullName))
  }
  const openJoin = () => (user ? setMode('join') : onNeedAuth('join'))
  const join = (value: string) => value.trim() && joinGroup.mutate(value.trim())

  // ---- Already in a group: share it ----
  if (group) {
    const inviteUrl = buildInviteUrl(window.location.origin, event.slug, group.invite_code)
    const message = buildInviteMessage(event.title, inviteUrl)
    const anchored = group.anchor_event_id === event.id && group.anchor_start_time
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

    const invite = async () => {
      if (canShare) {
        try {
          await navigator.share({ title: event.title, text: message })
        } catch {
          /* share sheet dismissed */
        }
        return
      }
      window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer')
    }
    const copy = async () => {
      await navigator.clipboard.writeText(inviteUrl).catch(() => {})
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div ref={ref} className={shell}>
        <p className="text-base font-black">
          {group.name} <span className="font-semibold text-muted-foreground">· {group.members.length} membre{group.members.length > 1 ? 's' : ''}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {anchored
            ? `Départ du groupe : ${formatWaveStartTime(group.anchor_start_time)}. Tes potes partent avec toi.`
            : 'Le premier du groupe qui s’inscrit réserve le départ pour tout le monde (format OPEN).'}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button type="button" className="h-12 rounded-xl font-bold" onClick={invite}>
            <Share2 className="mr-2 h-4 w-4" aria-hidden />
            Inviter mes potes
          </Button>
          <Button type="button" variant="outline" className="h-12 rounded-xl font-semibold" onClick={copy}>
            {copied ? <Check className="mr-2 h-4 w-4" aria-hidden /> : <Copy className="mr-2 h-4 w-4" aria-hidden />}
            {copied ? 'Lien copié' : 'Copier le lien'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Code du groupe : <span className="font-mono font-bold text-foreground">{group.invite_code}</span>
        </p>
      </div>
    )
  }

  // ---- Invited by link ----
  if (inviteCode) {
    return (
      <div ref={ref} className={shell}>
        {!user ? (
          <>
            <p className="text-base font-black">On t’invite dans un groupe.</p>
            <p className="mt-1 text-sm text-muted-foreground">Connecte-toi pour le rejoindre, sans quitter cette page.</p>
            <Button type="button" className="mt-4 h-12 w-full rounded-xl font-bold" onClick={() => onNeedAuth('join')}>
              Rejoindre le groupe
            </Button>
          </>
        ) : preview.data ? (
          <>
            <p className="text-base font-black">
              {preview.data.captain.full_name ?? 'Un ami'} t’invite dans « {preview.data.name} ».
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.data.members_count} membre{preview.data.members_count > 1 ? 's' : ''} · vous partez au même horaire.
            </p>
            <Button
              type="button"
              className="mt-4 h-12 w-full rounded-xl font-bold"
              disabled={busy}
              onClick={() => join(inviteCode)}
            >
              {joinGroup.isPending ? 'Un instant…' : 'Rejoindre le groupe'}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {preview.isError ? 'Ce lien d’invitation n’est plus valable.' : 'Chargement de ton invitation…'}
          </p>
        )}
        {error ? <p className="mt-2 text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    )
  }

  // ---- No group yet ----
  return (
    <div ref={ref} className={shell}>
      <p className="text-base font-black">Tu viens avec des potes ?</p>
      <p className="mt-1 text-sm text-muted-foreground">Un groupe, c’est le même départ pour tout le monde.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" className="h-12 rounded-xl font-bold" disabled={busy} onClick={create}>
          {createGroup.isPending ? 'Création…' : 'Créer mon groupe'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl font-semibold"
          disabled={busy}
          onClick={openJoin}
        >
          J’ai un code d’invitation
        </Button>
      </div>

      {mode === 'join' && user ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            join(code)
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AB12CD34"
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus
            className="h-12 rounded-xl bg-background font-mono text-base uppercase"
            disabled={busy}
          />
          <Button type="submit" className="h-12 shrink-0 rounded-xl px-6 font-bold" disabled={!code.trim() || busy}>
            Rejoindre
          </Button>
        </form>
      ) : null}
      {error ? <p className="mt-2 text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
