'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LuckyWheelSpinOutcome } from '@/hooks/lucky-wheel/use-lucky-wheel-spin'

interface LuckyWheelResultProps {
  outcome: LuckyWheelSpinOutcome
  eventId: string
  onClose: () => void
  onCtaClick?: () => void
}

const formatExpiry = (iso?: string) => {
  if (!iso) return null
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// FDR-0014 §3.4 (revised 2026-09-21): reward name, expiration, conditions,
// primary CTA -- and, for discount-type rewards, the plain promo code
// itself, shown and copyable right here. Replaces the earlier
// "no code, applies automatically" design: that relied on the same
// device/browser being used to spin and to check out, which is not a
// given (see src/lib/luckyWheel/redemption.ts header). The code is also
// emailed (LuckyWheelRewardEmail.tsx) so it survives even if this screen
// is closed without copying it.
export function LuckyWheelResult({ outcome, eventId, onClose, onCtaClick }: LuckyWheelResultProps) {
  const [copied, setCopied] = useState(false)

  if (!outcome.success) {
    return (
      <div className="space-y-4 text-center py-4">
        <h2 className="text-xl font-bold">Pas de chance cette fois-ci</h2>
        <p className="text-muted-foreground">Merci d'avoir tenté ta chance !</p>
        <Button variant="outline" onClick={onClose} className="w-full">
          Fermer
        </Button>
      </div>
    )
  }

  const expiry = formatExpiry(outcome.expiresAt)

  const handleCopy = async () => {
    if (!outcome.promoCode) return
    try {
      await navigator.clipboard.writeText(outcome.promoCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (permissions, old browser) -- the code
      // is still visible on screen and in the email, never blocking.
    }
  }

  return (
    <div className="space-y-4 text-center py-4">
      <h2 className="text-2xl font-bold">{outcome.rewardName}</h2>
      <p className="text-muted-foreground">Ta récompense est prête, direction l'inscription !</p>

      {outcome.promoCode && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            Utilise ce code lors de ton inscription
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3 font-mono text-lg font-bold tracking-widest text-primary transition-colors hover:bg-primary/10"
          >
            {outcome.promoCode}
            {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
          </button>
          <p className="text-xs text-muted-foreground">
            {copied ? 'Copié !' : 'Aussi envoyé par email.'}
          </p>
        </div>
      )}

      {expiry && (
        <p className="text-sm text-muted-foreground">Offre valable jusqu'au {expiry}.</p>
      )}
      <Button asChild className="w-full" onClick={onCtaClick}>
        <a href={`/events/${eventId}/register`}>Je prends mon dossard</a>
      </Button>
      <Button variant="ghost" onClick={onClose} className="w-full">
        Fermer
      </Button>
    </div>
  )
}
