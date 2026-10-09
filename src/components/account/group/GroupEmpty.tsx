'use client'

import { useState } from 'react'
import { useCreateGroup, useGroupInvitePreview, useJoinGroup } from '@/app/api/groups/groupQueries'
import { Eyebrow } from '@/components/account/AccountScreen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { defaultGroupName, parseInviteCode } from '@/lib/groups/invite'

const INVITE_CODE_LENGTH = 8

/** `?join=CODE` comes from shared invite links; read once, client-side only. */
const readInviteFromUrl = () =>
  typeof window === 'undefined' ? '' : (parseInviteCode(new URLSearchParams(window.location.search).get('join')) ?? '')

export function GroupEmpty({ fullName }: { fullName: string | null | undefined }) {
  const createGroup = useCreateGroup()
  const joinGroup = useJoinGroup()
  const [code, setCode] = useState(readInviteFromUrl)
  const [name, setName] = useState('')
  const [waveReassigned, setWaveReassigned] = useState(false)

  const normalizedCode = code.trim().toUpperCase()
  const preview = useGroupInvitePreview(normalizedCode, { enabled: normalizedCode.length === INVITE_CODE_LENGTH })
  const busy = createGroup.isPending || joinGroup.isPending
  const error = joinGroup.error?.message ?? createGroup.error?.message

  const join = async () => {
    if (!normalizedCode) return
    try {
      const result = await joinGroup.mutateAsync(normalizedCode)
      setCode('')
      setWaveReassigned(Boolean(result.wave_reassigned))
    } catch {
      // surfaced through joinGroup.error
    }
  }

  const create = async () => {
    const finalName = name.trim() || defaultGroupName(fullName)
    try {
      await createGroup.mutateAsync(finalName)
    } catch {
      // surfaced through createGroup.error
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <Eyebrow>Mon groupe</Eyebrow>
        <h1 className="mt-2 text-balance text-[2.5rem] font-black leading-[0.95] tracking-tight">Partez ensemble.</h1>
        <p className="mt-3 text-muted-foreground">
          Même groupe, même SAS de départ pour tous les participants OPEN. Collègues, club, potes : un code suffit.
        </p>
      </header>

      <section className="space-y-3">
        <label htmlFor="group-join-code" className="text-base font-bold">
          J&apos;ai un code
        </label>
        <div className="flex gap-2">
          <Input
            id="group-join-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => event.key === 'Enter' && join()}
            placeholder="AB12CD34"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={16}
            disabled={busy}
            className="h-12 font-mono text-lg uppercase tracking-widest"
          />
          <Button onClick={join} disabled={!normalizedCode || busy} className="h-12 px-6 text-base font-bold">
            {joinGroup.isPending ? '…' : 'Rejoindre'}
          </Button>
        </div>
        {preview.data ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{preview.data.name}</span> · capitaine{' '}
            {preview.data.captain.full_name ?? preview.data.captain.email ?? 'inconnu'} · {preview.data.members_count} membre
            {preview.data.members_count > 1 ? 's' : ''}
          </p>
        ) : null}
        {waveReassigned ? (
          <p className="text-sm font-medium text-primary">Ton départ a été aligné sur celui du groupe.</p>
        ) : null}
      </section>

      <section className="space-y-3 border-t border-border pt-8">
        <label htmlFor="group-create-name" className="text-base font-bold">
          Ou je crée le mien
        </label>
        <div className="flex gap-2">
          <Input
            id="group-create-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && create()}
            placeholder={defaultGroupName(fullName)}
            disabled={busy}
            className="h-12 text-base"
          />
          <Button onClick={create} disabled={busy} variant="outline" className="h-12 px-6 text-base font-bold">
            {createGroup.isPending ? '…' : 'Créer'}
          </Button>
        </div>
      </section>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
