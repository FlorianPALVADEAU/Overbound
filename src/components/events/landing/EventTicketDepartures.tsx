'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PricingTimeline } from '@/components/events/PricingTimeline'
import { getCurrentTicketPrice, isPriceChangeImminent } from '@/lib/pricing'
import { getCurrentPriceTier, type EventPriceTier } from '@/types/EventPriceTier'
import { formatWaveStartTime } from '@/lib/openSas'
import {
  describeTicketDeparture,
  splitDepartureWaves,
  type DepartureWave,
  type LandingTicket,
} from '@/lib/events/eventLandingView'
import { LANDING_X } from './layout'
import { SectionEyebrow } from './SectionEyebrow'

interface SlotListProps {
  waves: DepartureWave[]
  isOnSale: boolean
  hrefFor: (waveIndex: number) => string
  onPick: (waveIndex: number) => void
  onPickFromDropdown: (waveIndex: number) => void
}

const placesLabel = (remaining: number) =>
  remaining <= 0 ? 'Complet' : `${remaining} place${remaining > 1 ? 's' : ''}`

/** First slots as chips, the rest in a dropdown; one tap either way reaches the registration. */
function SlotList({ waves, isOnSale, hrefFor, onPick, onPickFromDropdown }: SlotListProps) {
  const { visible, overflow } = splitDepartureWaves(waves)
  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {visible.map((wave) => (
          <li key={wave.wave_index}>
            <SlotChip
              time={formatWaveStartTime(wave.start_time) ?? '—'}
              caption={placesLabel(wave.remaining)}
              href={isOnSale && wave.remaining > 0 ? hrefFor(wave.wave_index) : null}
              onClick={() => onPick(wave.wave_index)}
            />
          </li>
        ))}
      </ul>
      {overflow.length > 0 ? (
        <Select value="" disabled={!isOnSale} onValueChange={(value) => onPickFromDropdown(Number(value))}>
          <SelectTrigger className="mt-3 h-12 w-full rounded-xl border-primary/60 bg-primary/10 font-semibold">
            <SelectValue placeholder={`Voir les ${overflow.length} autres horaires`} />
          </SelectTrigger>
          <SelectContent>
            {overflow.map((wave) => (
              <SelectItem key={wave.wave_index} value={String(wave.wave_index)} disabled={wave.remaining <= 0}>
                {formatWaveStartTime(wave.start_time) ?? '—'} — {placesLabel(wave.remaining)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </>
  )
}

type ChooserTicket = LandingTicket & { description?: string | null }

interface Props {
  tickets: ChooserTicket[]
  eventPriceTiers: EventPriceTier[]
  eventDate: string
  currency: string
  isOnSale: boolean
  /** Slots per ticket id; undefined until the overview has loaded. */
  wavesByTicket: Record<string, DepartureWave[]> | undefined
  rankedLabel: string
  /** Registration with the group panel opened: `create` or `join`. */
  groupHref: (intent: 'create' | 'join') => string
  registerHref: (ticketId: string, waveIndex?: number) => string
  onRegister: (payload: { ticketId: string; ticketName: string; waveIndex: number | null }) => void
  /** Rendered above the cards: sales-not-open panel, existing registration notice. */
  notice?: React.ReactNode
}

interface SlotChipProps {
  time: string
  caption: string
  /** null → not selectable (full or sales closed). */
  href: string | null
  onClick: () => void
}

const SlotChip = ({ time, caption, href, onClick }: SlotChipProps) => {
  const base = 'flex min-h-16 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition'
  const body = (
    <>
      <span className="text-lg font-black leading-tight">{time}</span>
      <span className="text-[11px] font-semibold leading-tight">{caption}</span>
    </>
  )
  if (!href) {
    return <div className={`${base} border-border bg-muted/50 text-muted-foreground opacity-60`}>{body}</div>
  }
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${base} border-primary/60 bg-primary/10 text-foreground hover:bg-primary hover:text-primary-foreground [&>span:last-child]:text-primary hover:[&>span:last-child]:text-primary-foreground`}
    >
      {body}
    </Link>
  )
}

/**
 * The decision section: one card per format with its current price and its
 * departures. Many slots → pick a time (ticket and slot reach the registration
 * preselected). One departure → one register button.
 */
export function EventTicketDepartures({
  tickets,
  eventPriceTiers,
  eventDate,
  currency,
  isOnSale,
  wavesByTicket,
  rankedLabel,
  groupHref,
  registerHref,
  onRegister,
  notice,
}: Props) {
  const router = useRouter()
  const activeTier = getCurrentPriceTier(eventPriceTiers)
  const discount = activeTier && activeTier.discount_percentage > 0 ? activeTier.discount_percentage : 0
  const money = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: (currency || 'EUR').toUpperCase() }).format(
      cents / 100,
    )

  const cheapest = tickets.length
    ? tickets.reduce((min, t) => (t.final_price_cents < min.final_price_cents ? t : min), tickets[0])
    : null

  return (
    <div className={`${LANDING_X} py-12 sm:py-16`}>
      <SectionEyebrow>Inscription</SectionEyebrow>
      <h2 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
        Choisis ton format, choisis ton départ.
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Prix du moment et horaires de départ au même endroit. Paiement sécurisé, billet par email.
      </p>

      {notice ? <div className="mt-6 space-y-4">{notice}</div> : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {tickets.map((ticket) => {
          const price = getCurrentTicketPrice(ticket as never, eventPriceTiers)
          const imminent = isPriceChangeImminent(ticket as never, eventPriceTiers)
          const departure = describeTicketDeparture({
            ticket,
            waves: wavesByTicket?.[ticket.id],
            rankedLabel,
          })

          return (
            <article
              key={ticket.id}
              className="flex flex-col gap-5 rounded-3xl border-2 border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="wrap-break-word text-xl font-black">{ticket.name}</h3>
                  {ticket.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  {discount > 0 && ticket.final_price_cents > price ? (
                    <p className="text-xs text-muted-foreground line-through">{money(ticket.final_price_cents)}</p>
                  ) : null}
                  <p className="text-3xl font-black text-primary">{money(price)}</p>
                  {discount > 0 ? (
                    <Badge className="mt-1 border-0 bg-primary/15 text-primary">-{discount}%</Badge>
                  ) : null}
                </div>
              </header>
              {imminent ? (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> Prix en hausse bientôt
                </p>
              ) : null}

              <div className="mt-auto">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {departure.kind === 'slots' ? 'Touche ton horaire de départ' : 'Départ'}
                </p>

                {departure.kind === 'loading' ? (
                  <div className="h-16 animate-pulse rounded-xl bg-muted" aria-hidden />
                ) : null}

                {departure.kind === 'slots' ? (
                  <SlotList
                    waves={departure.waves}
                    isOnSale={isOnSale}
                    hrefFor={(waveIndex) => registerHref(ticket.id, waveIndex)}
                    onPick={(waveIndex) =>
                      onRegister({ ticketId: ticket.id, ticketName: ticket.name, waveIndex })
                    }
                    onPickFromDropdown={(waveIndex) => {
                      onRegister({ ticketId: ticket.id, ticketName: ticket.name, waveIndex })
                      router.push(registerHref(ticket.id, waveIndex))
                    }}
                  />
                ) : null}

                {departure.kind === 'single' ? (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    <li className="col-span-2">
                      <SlotChip
                        time={departure.label ?? 'Départ unique'}
                        caption={departure.label ? 'Un seul départ · S’inscrire' : 'S’inscrire'}
                        href={
                          isOnSale && !departure.full
                            ? registerHref(ticket.id, departure.waveIndex ?? undefined)
                            : null
                        }
                        onClick={() =>
                          onRegister({ ticketId: ticket.id, ticketName: ticket.name, waveIndex: departure.waveIndex })
                        }
                      />
                    </li>
                  </ul>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-primary/60 bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-lg font-black">Tu pars avec tes potes ? Crée un groupe.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Un groupe part au même horaire. Tu le crées en un clic pendant ton inscription, puis tu partages le lien.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button asChild size="lg" className="h-12 rounded-xl px-8 font-bold">
            <Link href={groupHref('create')}>Créer mon groupe</Link>
          </Button>
          <Link href={groupHref('join')} className="text-center text-sm font-semibold text-primary underline-offset-4 hover:underline">
            J&apos;ai un code d&apos;invitation
          </Link>
        </div>
      </div>

      {eventPriceTiers.length > 0 && cheapest ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-5 pb-16 sm:p-6 sm:pb-20">
          <PricingTimeline
            ticket={cheapest as never}
            eventPriceTiers={eventPriceTiers}
            currency={currency as 'eur' | 'usd' | 'gbp'}
            eventDate={eventDate}
          />
        </div>
      ) : null}
    </div>
  )
}
