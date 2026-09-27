'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface LuckyWheelEntryFormProps {
  submitting: boolean
  error: string | null
  onSubmit: (values: { email: string; marketingConsent: boolean }) => void
  onDecline: () => void
}

// FDR-0014 §3.2/§3.3: single-screen form (product decision 2026-09-21 --
// wheel, form, and CTA all visible together, no separate "email step").
// Submitting this form both creates the entry AND triggers the spin in one
// action (the widget calls submitEmail then spin immediately after) -- the
// participant clicks once, not twice. Consent to unrelated marketing is a
// separate, pre-checked-but-uncheckable-off checkbox (2026-09-21 decision).
export function LuckyWheelEntryForm({ submitting, error, onSubmit, onDecline }: LuckyWheelEntryFormProps) {
  const [email, setEmail] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [website, setWebsite] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (website.trim().length > 0) return
    onSubmit({ email: email.trim(), marketingConsent })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="lucky-wheel-email" className="sr-only">
          Email
        </Label>
        <Input
          id="lucky-wheel-email"
          type="email"
          required
          autoComplete="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="lucky-wheel-consent"
          checked={marketingConsent}
          onCheckedChange={(checked) => setMarketingConsent(Boolean(checked))}
          disabled={submitting}
        />
        {/* The privacy-policy link is deliberately its own block line
            below the consent text, not inline at the end of it: an inline
            <a> here kept rendering as a separate cramped column instead of
            wrapping into the paragraph (bug reported 2026-09-23, both
            mobile and desktop) regardless of the wrapping element (shadcn
            Label or plain <label>) -- a block-level link removes the
            ambiguous inline-flex interaction entirely. Consent copy stays
            visible at every breakpoint: the checkbox + this text is the
            actual GDPR consent mechanism, not the longer informational
            paragraph that used to sit below the button (now removed on
            mobile for space, see LuckyWheelWidget.tsx). */}
        <div className="min-w-0 flex-1">
          <label
            htmlFor="lucky-wheel-consent"
            className="block text-xs leading-snug text-muted-foreground"
          >
            J'accepte de recevoir des communications d'Overbound (désabonnement possible à tout moment).
          </label>
          <a
            href="/privacy-policies"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-muted-foreground underline"
          >
            En savoir plus
          </a>
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="lucky-wheel-website">Site web</Label>
        <Input
          id="lucky-wheel-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="h-10 w-full text-sm font-bold sm:h-11 sm:text-base"
        disabled={submitting || !email.trim()}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Tirage en cours…
          </>
        ) : (
          'Je tente ma chance 🎡'
        )}
      </Button>

      <button
        type="button"
        onClick={onDecline}
        disabled={submitting}
        className="w-full text-center text-xs font-semibold underline text-muted-foreground hover:text-foreground"
      >
        Non merci, je continue sans participer
      </button>
    </form>
  )
}
