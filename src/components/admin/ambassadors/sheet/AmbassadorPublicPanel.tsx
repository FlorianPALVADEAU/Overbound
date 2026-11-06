'use client'

import { useSetPublicProfile } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AdminAmbassadorSheetResponse } from '@/lib/admin/ambassadors/types'

const statusOf = (ambassador: AdminAmbassadorSheetResponse['ambassador']) => {
  if (ambassador.public_blocked) return { label: 'Masqué par l’équipe', variant: 'destructive' as const }
  if (ambassador.public_opt_in) return { label: 'Visible sur la page publique', variant: 'default' as const }
  return { label: 'Non inscrit sur la page publique', variant: 'outline' as const }
}

/** What the public /ambassadors page shows for this ambassador, and the two moderation actions. */
export function AmbassadorPublicPanel({ ambassador }: { ambassador: AdminAmbassadorSheetResponse['ambassador'] }) {
  const mutation = useSetPublicProfile(ambassador.id)
  const status = statusOf(ambassador)

  return (
    <Card variant="info">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-label font-semibold uppercase text-subtle">Page publique</p>
            <p className="text-sm text-muted-foreground">
              {ambassador.has_public_photo ? 'Photo envoyée par l’ambassadeur.' : 'Pas de photo envoyée : ses initiales s’affichent.'}
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-label font-semibold uppercase text-subtle">Description</dt>
            <dd className="wrap-break-word text-muted-foreground">{ambassador.public_bio ?? 'Aucune description.'}</dd>
          </div>
          <div>
            <dt className="text-label font-semibold uppercase text-subtle">Groupe</dt>
            <dd className="text-muted-foreground">
              {ambassador.public_show_group ? 'Affiché avec son code d’invitation.' : 'Non affiché.'}
            </dd>
          </div>
        </dl>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-9"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ blocked: !ambassador.public_blocked })}
          >
            {ambassador.public_blocked ? 'Autoriser à nouveau' : 'Masquer de la page publique'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-9"
            disabled={mutation.isPending || !ambassador.has_public_photo}
            onClick={() => mutation.mutate({ remove_photo: true })}
          >
            Retirer sa photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-9"
            disabled={mutation.isPending || !ambassador.public_bio}
            onClick={() => mutation.mutate({ clear_bio: true })}
          >
            Effacer sa description
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-9"
            disabled={mutation.isPending || !ambassador.public_show_group}
            onClick={() => mutation.mutate({ hide_group: true })}
          >
            Masquer son groupe
          </Button>
        </div>
        {mutation.error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
