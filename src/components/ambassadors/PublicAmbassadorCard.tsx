import Image from 'next/image'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { DISPLAY_TITLE, Pill } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getInitials } from '@/lib/account/profile'
import type { PublicAmbassador } from '@/lib/ambassadors/loadPublicAmbassadors'
import { buildReferralUrl } from '@/lib/attribution/referral'
import { resolveImageSource } from '@/lib/images/imageSource'
import { cn } from '@/lib/utils'

interface PublicAmbassadorCardProps {
  ambassador: PublicAmbassador
  /** Event open for sales: every link lands on its page. Null sends visitors to the home page. */
  eventSlug: string | null
}

const recruitsLabel = (count: number) => (count === 1 ? '1 ami recruté' : `${count} amis recrutés`)

/** Relative link: the code (or the group) travels in the URL and is applied at registration. */
const referralHref = (code: string, eventSlug: string | null) => buildReferralUrl('', code, eventSlug)
/** Registration page with the group to join and, when there is one, the ambassador's code too. */
const groupHref = (inviteCode: string, eventSlug: string, code: string | null) =>
  `/events/${encodeURIComponent(eventSlug)}/register?invite=${encodeURIComponent(inviteCode)}${code ? `&ref=${encodeURIComponent(code)}` : ''}`

/**
 * One ambassador: a large portrait, the name in the display face, a short bio, then one primary action
 * (run with them). Joining their team is a text link, so each card has a single call to action.
 */
export function PublicAmbassadorCard({ ambassador, eventSlug }: PublicAmbassadorCardProps) {
  const firstName = ambassador.name.split(' ')[0]
  const photo = ambassador.photo_url ? resolveImageSource(ambassador.photo_url) : null

  return (
    <Card variant="feature" className="h-full gap-0 py-0">
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        {photo ? (
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            unoptimized={!photo.optimizable}
            className="object-cover transition-transform duration-300 ease-standard group-hover:scale-105"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center bg-linear-to-br from-primary/25 to-surface-deep">
            <span className={cn(DISPLAY_TITLE, 'text-display-xl text-primary')}>{getInitials(ambassador.name, null)}</span>
          </div>
        )}
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-6">
          {ambassador.recruits > 0 ? (
            <Pill variant="glass">
              <Users className="size-3" aria-hidden />
              {recruitsLabel(ambassador.recruits)}
            </Pill>
          ) : null}
          <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>{ambassador.name}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        {ambassador.bio ? <p className="line-clamp-4 wrap-break-word text-sm text-muted-foreground">{ambassador.bio}</p> : null}

        {ambassador.code ? (
          <Button asChild size="cta" className="mt-auto w-full">
            <Link href={referralHref(ambassador.code, eventSlug)}>Courir avec {firstName}</Link>
          </Button>
        ) : null}

        {ambassador.group && eventSlug ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 p-3">
            <div className="min-w-0">
              <p className="text-label font-semibold uppercase text-subtle">Son équipe</p>
              <p className="truncate text-sm font-semibold">{ambassador.group.name}</p>
            </div>
            <Link
              href={groupHref(ambassador.group.invite_code, eventSlug, ambassador.code)}
              aria-label={`Rejoindre l’équipe ${ambassador.group.name}`}
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Rejoindre l’équipe
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
