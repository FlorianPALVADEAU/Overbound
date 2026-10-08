'use client'

import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface Props {
  formattedSalesStart: string | null
  countdown: Countdown | null
  notifyEmail: string
  notifyStatus: 'idle' | 'loading' | 'success' | 'error'
  notifyMessage: string | null
  onNotifyEmailChange: (email: string) => void
  onNotifySubmit: (e: FormEvent<HTMLFormElement>) => void
}

const padTwo = (n: number) => n.toString().padStart(2, '0')

/** Sales not open yet: countdown plus an email capture to be told at opening. */
export function EventAnnouncedPanel({
  formattedSalesStart,
  countdown,
  notifyEmail,
  notifyStatus,
  notifyMessage,
  onNotifyEmailChange,
  onNotifySubmit,
}: Props) {
  return (
    <Card className="border-primary/30 bg-card">
      <CardContent className="pt-6">
        <p className="text-sm font-semibold">Inscriptions pas encore ouvertes</p>
        {formattedSalesStart ? (
          <p className="mt-1 text-sm text-muted-foreground">Ouverture prévue le {formattedSalesStart}.</p>
        ) : null}

        {countdown ? (
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { value: countdown.days, label: 'Jours' },
              { value: padTwo(countdown.hours), label: 'Heures' },
              { value: padTwo(countdown.minutes), label: 'Minutes' },
              { value: padTwo(countdown.seconds), label: 'Secondes' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-lg bg-muted px-2 py-3">
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
            className="min-h-11 w-full rounded-xl"
            disabled={notifyStatus === 'loading' || notifyStatus === 'success'}
          >
            {notifyStatus === 'loading'
              ? 'Envoi...'
              : notifyStatus === 'success'
                ? 'On te prévient !'
                : "Me prévenir de l'ouverture"}
          </Button>
        </form>
        {notifyMessage ? <p className="mt-2 text-xs text-muted-foreground">{notifyMessage}</p> : null}
      </CardContent>
    </Card>
  )
}
