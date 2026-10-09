'use client'

import { useRef } from 'react'
import { CameraIcon } from 'lucide-react'
import { UserAvatar } from '@/components/account/UserAvatar'
import { useUpdateAvatar } from '@/hooks/account/useUpdateAvatar'

interface AvatarUploaderProps {
  src: string | null | undefined
  name: string | null | undefined
  email: string | null | undefined
  /** The photo comes from the account's own upload, so "remove" has something to remove. */
  canRemove: boolean
}

export function AvatarUploader({ src, name, email, canRemove }: AvatarUploaderProps) {
  const input = useRef<HTMLInputElement>(null)
  const update = useUpdateAvatar()

  const choose = (file: File | undefined) => {
    if (file) update.mutate({ kind: 'upload', file })
    if (input.current) input.current.value = '' // lets the same file be picked again after an error
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={update.isPending}
        aria-label="Changer ma photo de profil"
        className="group relative rounded-full disabled:opacity-60"
      >
        <UserAvatar src={src} name={name} email={email} className="size-20 text-xl" />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
          <CameraIcon className="size-4" />
        </span>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => choose(event.target.files?.[0])} />

      <p className="text-xs text-muted-foreground">
        {update.isPending ? 'Envoi en cours…' : update.isSuccess ? 'Photo mise à jour.' : null}
      </p>
      {canRemove ? (
        <button type="button" onClick={() => update.mutate({ kind: 'remove' })} disabled={update.isPending} className="min-h-8 text-xs font-semibold text-muted-foreground hover:text-foreground">
          Retirer ma photo
        </button>
      ) : null}
      {update.error ? (
        <p role="alert" className="text-xs text-destructive">
          {update.error.message}
        </p>
      ) : null}
    </div>
  )
}
