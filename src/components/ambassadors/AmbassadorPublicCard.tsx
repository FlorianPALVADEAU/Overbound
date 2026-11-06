'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AvatarUploader } from '@/components/account/profile/AvatarUploader'
import { Disclosure } from '@/components/ds'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { storagePathFromPublicUrl } from '@/lib/account/avatar'
import { getInitials } from '@/lib/account/profile'
import { normalizeBio, PUBLIC_BIO_MAX, toPublicName } from '@/lib/ambassadors/publicProfile'
import { useAmbassadorPublicProfile } from '@/hooks/ambassadors/useAmbassadorPublicProfile'

interface AmbassadorPublicCardProps {
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

/**
 * Opt-in to the public ambassador page. The master switch comes first, then what will be published,
 * then a preview of the card. Off by default: nothing is shown until the ambassador turns it on.
 */
export function AmbassadorPublicCard({ fullName, email, avatarUrl }: AmbassadorPublicCardProps) {
  const { query, mutation } = useAmbassadorPublicProfile(true)
  const profile = query.data
  const hasUploadedPhoto = storagePathFromPublicUrl(avatarUrl) !== null
  const [draft, setDraft] = useState<string | null>(null)

  // No ambassador row (404) or a load error: nothing to configure, the rest of the dashboard stays.
  if (!profile) return null

  const bio = draft ?? profile.public_bio ?? ''
  const bioChanged = (normalizeBio(bio) ?? '') !== (profile.public_bio ?? '')
  const publicName = toPublicName(fullName)
  const statusLabel = profile.is_listed ? 'Visible' : profile.public_opt_in ? 'Masquée par l’équipe' : 'Désactivée'

  return (
    <Disclosure
      title="Ma page publique"
      badge={<Badge variant="outline">{statusLabel}</Badge>}
      summary="Ton prénom, ta photo et ta description, sur la page des ambassadeurs"
    >
      <div className="space-y-6">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
          <span className="text-sm">
            <span className="block font-semibold">Apparaître sur la page publique</span>
            <span className="block text-muted-foreground">Désactivé par défaut. Tu peux changer d’avis à tout moment.</span>
          </span>
          <Switch
            checked={profile.public_opt_in}
            disabled={mutation.isPending || profile.public_blocked}
            onCheckedChange={(checked) => mutation.mutate({ public_opt_in: checked })}
          />
        </label>

        {profile.public_blocked ? (
          <p className="text-sm text-muted-foreground">L’équipe Overbound a masqué ta page publique. Écris-nous pour en savoir plus.</p>
        ) : null}

        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Ce qui sera publié</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Ton prénom et l’initiale de ton nom : {publicName}</li>
            <li>La photo que tu envoies ici, ou tes initiales si tu n’en envoies pas</li>
            <li>Ta description, si tu en écris une</li>
            <li>Le nombre d’amis que tu as recrutés cette saison, s’il n’est pas zéro</li>
            {profile.group && profile.public_show_group ? <li>Ton équipe et son code d’invitation</li> : null}
          </ul>
          <p className="pt-2 text-muted-foreground">
            Jamais ton nom complet, ton adresse email, tes points ni ton rang sur la page publique.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-primary/25 to-surface-deep font-display text-title font-bold text-primary"
          >
            {hasUploadedPhoto && avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : getInitials(publicName, null)}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-subtle">Aperçu</p>
            <p className="truncate font-semibold">{publicName}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{bio || 'Ta description apparaîtra ici.'}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <AvatarUploader src={avatarUrl} name={fullName} email={email} canRemove={hasUploadedPhoto} />
          <p className="pt-2 text-sm text-muted-foreground">
            {hasUploadedPhoto ? 'Ta photo est celle qui sera publiée.' : 'Sans photo envoyée ici, tes initiales s’affichent.'}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="ambassador-bio" className="text-sm font-semibold">
            Ta description
          </label>
          <Textarea
            id="ambassador-bio"
            value={bio}
            maxLength={PUBLIC_BIO_MAX}
            rows={3}
            placeholder="Ex. : je cours en équipe depuis 3 ans, viens nous rejoindre."
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {bio.length}/{PUBLIC_BIO_MAX}
            </span>
            <Button
              type="button"
              size="cta"
              variant="outline"
              disabled={!bioChanged || mutation.isPending}
              onClick={() => mutation.mutate({ public_bio: bio }, { onSuccess: () => setDraft(null) })}
            >
              Enregistrer
            </Button>
          </div>
        </div>

        {profile.group ? (
          <div className="space-y-2">
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
              <span className="text-sm">
                <span className="block font-semibold">Proposer mon groupe</span>
                <span className="block text-muted-foreground">
                  Affiche « {profile.group.name} » avec un bouton pour le rejoindre.
                </span>
              </span>
              <Switch
                checked={profile.public_show_group}
                disabled={mutation.isPending}
                onCheckedChange={(checked) => mutation.mutate({ public_show_group: checked })}
              />
            </label>
            <p className="text-xs text-warning">
              Attention : toute personne qui voit la page peut rejoindre ton équipe avec le code {profile.group.invite_code}.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tu ne diriges aucun groupe : seul le capitaine peut le proposer. Crée-en un depuis{' '}
            <Link href="/account/group" className="font-semibold text-primary hover:underline">
              ton compte
            </Link>{' '}
            pour le proposer ici.
          </p>
        )}

        {profile.is_listed ? (
          <Link href="/ambassadors" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
            Voir la page publique
          </Link>
        ) : null}

        <div aria-live="polite" role="status" className="min-h-5 text-sm text-success">
          {mutation.isPending ? 'Enregistrement…' : mutation.isSuccess ? 'Modifications enregistrées.' : null}
        </div>
        {mutation.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Les modifications n’ont pas pu être enregistrées. Réessaie dans un instant.
          </p>
        ) : null}
      </div>
    </Disclosure>
  )
}
