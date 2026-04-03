'use client'

import { type FormEvent } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { PricingTimeline } from '@/components/events/PricingTimeline'
import { UltraArenaTicketCards } from '@/components/events/ultra-arena/UltraArenaTicketCards'
import type { Event } from '@/types/Event'
import type { EventPriceTier } from '@/types/EventPriceTier'

interface EventUser {
  id: string
  email: string
}

interface ExistingRegistration {
  id: string
  checked_in: boolean
  tickets: Array<{ name: string | null }> | null
}

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface Props {
  event: Event
  tickets: any[]
  eventPriceTiers: EventPriceTier[]
  availableSpots: number
  user: EventUser | null
  existingRegistration: ExistingRegistration | null | undefined
  isOnSale: boolean
  isAnnounced: boolean
  lowestPrice: number | null
  baseLowestPrice: number | null
  hasDiscount: boolean
  priceCurrency: string
  formatCurrency: (cents: number) => string
  formattedSalesStart: string | null
  countdown: Countdown | null
  notifyEmail: string
  notifyStatus: 'idle' | 'loading' | 'success' | 'error'
  notifyMessage: string | null
  onNotifyEmailChange: (email: string) => void
  onNotifySubmit: (e: FormEvent<HTMLFormElement>) => void
  onRegisterClick: (payload: { ticketId: string; ticketName: string; raceType?: string | null }) => void
  onPriceSectionRegisterClick: () => void
}

const WHAT_IS_INCLUDED = [
  "Accès à l'arène pour la journée complète",
  'Dossard officiel et QR code',
  'Chronométrage sur parcours',
  'Accès au village et aux zones de repos',
]

const padTwo = (n: number) => n.toString().padStart(2, '0')

export function UltraArenaPricing({
  event,
  tickets,
  eventPriceTiers,
  availableSpots,
  user,
  existingRegistration,
  isOnSale,
  isAnnounced,
  lowestPrice,
  baseLowestPrice,
  hasDiscount,
  priceCurrency,
  formatCurrency,
  formattedSalesStart,
  countdown,
  notifyEmail,
  notifyStatus,
  notifyMessage,
  onNotifyEmailChange,
  onNotifySubmit,
  onRegisterClick,
  onPriceSectionRegisterClick,
}: Props) {
  return (
    <section id="tarifs-inscription" className="py-16 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Tarifs & inscription
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Tu sais ce que tu viens chercher.
            <br className="hidden sm:block" /> Prends ta place.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Voici les tarifs en cours et l'accès inscription. Paiement sécurisé, billet envoyé par email.
          </p>
          <p className="mt-2 text-sm font-semibold text-primary">
            Tu peux attendre. Ou sécuriser ta place maintenant.
          </p>
        </div>

        {/* ── Unified pricing card: timeline + current price + CTA ── */}
        <Card className="mb-6 border-primary/20 bg-card/80">
          <CardContent className="pt-6">

            {/* Timeline — top of the card, needs extra bottom padding for absolute labels */}
            {eventPriceTiers.length > 0 && tickets.length > 0 ? (
              <div className="px-1 pb-14 sm:px-3 sm:pb-16">
                <PricingTimeline
                  ticket={tickets.reduce((min: any, t: any) =>
                    (t.final_price_cents ?? Infinity) < (min.final_price_cents ?? Infinity) ? t : min,
                    tickets[0]
                  )}
                  eventPriceTiers={eventPriceTiers}
                  currency={priceCurrency as 'eur' | 'usd' | 'gbp'}
                  eventDate={event.date}
                />
              </div>
            ) : null}

            {/* Divider + current price + CTA */}
            <div className="border-t border-border/40 pt-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Tarif en cours
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Même expérience. Juste plus cher plus tard.
                  </p>
                  {lowestPrice !== null ? (
                    <div className="mt-1">
                      {hasDiscount && baseLowestPrice && baseLowestPrice > lowestPrice ? (
                        <p className="text-sm font-semibold text-muted-foreground line-through">
                          dès {formatCurrency(baseLowestPrice)}
                        </p>
                      ) : null}
                      <p className="text-3xl font-black text-foreground sm:text-4xl">
                        dès {formatCurrency(lowestPrice)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-2xl font-bold">Ouverture prochaine</p>
                  )}
                </div>

                {isOnSale ? (
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-xl px-8 text-base font-semibold"
                    onClick={onPriceSectionRegisterClick}
                  >
                    <Link href={`/events/${event.slug}/register`}>Je bloque ma place maintenant</Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl px-8 text-base font-semibold"
                    disabled
                  >
                    Inscriptions à venir
                  </Button>
                )}
              </div>

              {/* Included items */}
              <div className="mt-5 border-t border-border/40 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Inclus dans ton inscription
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {WHAT_IS_INCLUDED.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {isOnSale ? (
                <p className="mt-3 text-xs font-semibold text-primary">
                  Prochaine augmentation à venir.
                </p>
              ) : null}

              {/* Trust badges */}
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-lg bg-background/70 p-3">Paiement sécurisé Stripe</div>
                <div className="rounded-lg bg-background/70 p-3">Billet + QR code par email</div>
                <div className="rounded-lg bg-background/70 p-3">Inscription en quelques minutes</div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Announced: countdown + notify form ── */}
        {isAnnounced ? (
          <Card className="mb-6 border-primary/20 bg-card/80">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold">Inscriptions pas encore ouvertes</p>
              {formattedSalesStart ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Ouverture prévue le {formattedSalesStart}.
                </p>
              ) : null}

              {countdown ? (
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    { value: countdown.days, label: 'Jours' },
                    { value: padTwo(countdown.hours), label: 'Heures' },
                    { value: padTwo(countdown.minutes), label: 'Minutes' },
                    { value: padTwo(countdown.seconds), label: 'Secondes' },
                  ].map(({ value, label }) => (
                    <div key={label} className="rounded-lg bg-muted/60 px-2 py-3">
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-[10px] uppercase">{label}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <form className="mt-4 space-y-3" onSubmit={onNotifySubmit}>
                <Input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => onNotifyEmailChange(e.target.value)}
                  placeholder="Ton email"
                  className="h-11 rounded-xl"
                  required
                />
                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  disabled={notifyStatus === 'loading' || notifyStatus === 'success'}
                >
                  {notifyStatus === 'loading'
                    ? 'Envoi...'
                    : notifyStatus === 'success'
                      ? 'On te prévient !'
                      : "Me prévenir de l'ouverture"}
                </Button>
              </form>
              {notifyMessage ? (
                <p className="mt-2 text-xs text-muted-foreground">{notifyMessage}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* ── Existing registration notice ── */}
        {user && existingRegistration ? (
          <Alert className="mb-6 border-primary/30 bg-primary/5 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Tu as déjà une inscription active avec le billet "
              {existingRegistration.tickets?.[0]?.name ?? '—'}". Tu peux compléter une nouvelle
              inscription pour un autre format ou participant.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* ── Ticket cards — clean grid, no accordion ── */}
        <div className="mb-2">
          <p className="mb-4 text-sm font-semibold text-muted-foreground">
            Choisis ton format et réserve directement :
          </p>
          <UltraArenaTicketCards
            tickets={tickets}
            eventPriceTiers={eventPriceTiers}
            priceCurrency={priceCurrency}
            isOnSale={isOnSale}
            eventSlug={event.slug}
            user={user}
            onRegisterClick={onRegisterClick}
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Pour être dans le même SAS, inscrivez-vous en une seule commande avec tous les participants.
        </p>
      </div>
    </section>
  )
}
