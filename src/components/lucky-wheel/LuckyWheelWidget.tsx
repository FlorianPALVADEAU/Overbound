'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useLuckyWheelTrigger, type LuckyWheelTriggerRules } from '@/hooks/lucky-wheel/use-lucky-wheel-trigger'
import { useLuckyWheelSpin } from '@/hooks/lucky-wheel/use-lucky-wheel-spin'
import { trackLuckyWheelEvent } from '@/lib/luckyWheel/analytics'
import { usePopupSlot } from '@/components/popups/PopupArbiterProvider'
import { LuckyWheelEntryForm } from './LuckyWheelEntryForm'
import { LuckyWheelWheel, type WheelSegment } from './LuckyWheelWheel'
import { LuckyWheelResult } from './LuckyWheelResult'

// Pause between the wheel physically stopping and the result screen
// appearing, so the win doesn't feel abrupt (product feedback 2026-09-22).
const RESULT_REVEAL_DELAY_MS = 2000

interface LuckyWheelWidgetProps {
  eventId: string
}

type CampaignState = {
  id: string
  name: string
  triggerRules: LuckyWheelTriggerRules
  rewards: WheelSegment[]
}

// FDR-0014 §12.1/§12.3/§18: orchestrator. Lazy-loaded (dynamic import) by
// GlobalLuckyWheelWidget, only on routes allowlisted in
// src/lib/luckyWheel/placement.ts. A failure at any step (fetch,
// entry, spin) never blocks the rest of the page or the purchase tunnel:
// the widget just stops rendering.
//
// Single-screen popup (2026-09-21 product decision): a centered, ~560px
// promo-style popup (like PopupPromotion.tsx), never full-screen -- the
// event page stays visible behind a dimmed backdrop. The wheel, email
// field, consent checkbox and CTA are all visible together from the first
// render; there is no separate "email step" before the wheel appears. One
// click (submit the form) both records the entry and triggers the spin.
//
// No manual "tente ta chance" trigger button: the popup opens automatically
// per trigger_rules (delay/scroll%/exit intent), same mechanism as
// PopupPromotion. A campaign with no trigger_rules configured never opens
// on its own -- configure at least one rule in the admin.
export function LuckyWheelWidget({ eventId }: LuckyWheelWidgetProps) {
  const [campaign, setCampaign] = useState<CampaignState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showResult, setShowResult] = useState(false)
  // True once the wheel has physically stopped, until the result screen
  // reveals -- keeps the form locked during RESULT_REVEAL_DELAY_MS instead
  // of letting the participant edit the email or re-click spin while the
  // outcome is already decided.
  const [awaitingReveal, setAwaitingReveal] = useState(false)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    }
  }, [])

  const spinApi = useLuckyWheelSpin(eventId)
  // Read once, on mount, not on every render: a successful spin() writes
  // this same flag (use-lucky-wheel-spin.ts) so the result screen doesn't
  // get replayed on the next visit -- but recomputing it live here would
  // unmount the widget mid-flow the instant that write lands, right before
  // the result ever renders. This is a "was I already in on load" check,
  // not a live subscription.
  const [alreadyParticipated] = useState(() => spinApi.hasLocalParticipationFlag())

  useEffect(() => {
    let cancelled = false
    fetch(`/api/lucky-wheel/campaign?event_id=${eventId}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return
        if (data?.campaign) {
          setCampaign({
            id: data.campaign.id,
            name: data.campaign.name,
            triggerRules: data.campaign.trigger_rules ?? {},
            rewards: (data.campaign.rewards ?? []) as WheelSegment[],
          })
          trackLuckyWheelEvent('wheel_impression', { campaign_id: data.campaign.id, event_id: eventId })
        }
      })
      .catch(() => {
        // Fail soft (§18): no campaign, widget never renders.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  const { shouldOpen } = useLuckyWheelTrigger({
    rules: campaign?.triggerRules ?? {},
    enabled: Boolean(campaign) && !alreadyParticipated,
    alreadyTriggered: alreadyParticipated,
  })

  // FDR-0015 §7.3 layer 1: only one automatic popup per session -- if
  // PopupPromotion already claimed the slot, this widget never opens even
  // though its own trigger condition was met.
  const requestPopupSlot = usePopupSlot('lucky-wheel')

  useEffect(() => {
    if (shouldOpen && requestPopupSlot('lucky-wheel')) setIsOpen(true)
  }, [shouldOpen, requestPopupSlot])

  useEffect(() => {
    if (isOpen && campaign) {
      trackLuckyWheelEvent('wheel_opened', { campaign_id: campaign.id, event_id: eventId })
    }
  }, [isOpen, campaign, eventId])

  if (!loaded || !campaign || alreadyParticipated || campaign.rewards.length === 0 || !isOpen) {
    return null
  }

  const handleClose = () => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
    setIsOpen(false)
    setShowResult(false)
    setAwaitingReveal(false)
  }

  // One click: submit the form both records the entry and immediately
  // triggers the spin -- the participant never sees a second button.
  const handleFormSubmit = async ({ email, marketingConsent }: { email: string; marketingConsent: boolean }) => {
    try {
      const { wheelEntryId, alreadyParticipated: already } = await spinApi.submitEmail({ email, marketingConsent })
      trackLuckyWheelEvent('email_submitted', { campaign_id: campaign.id, event_id: eventId })
      if (already) {
        handleClose()
        return
      }

      const result = await spinApi.spin(wheelEntryId)
      trackLuckyWheelEvent('wheel_spun', { campaign_id: campaign.id, event_id: eventId })
      if (result.success) {
        trackLuckyWheelEvent('reward_won', {
          campaign_id: campaign.id,
          event_id: eventId,
          reward_id: result.allocationId,
          reward_type: result.rewardType,
        })
      } else {
        // NO_REWARD_AVAILABLE: no segment to animate toward -- go straight
        // to the result screen (LuckyWheelResult handles success === false).
        setShowResult(true)
      }
    } catch {
      // Error surfaced via spinApi.error, form stays interactive for retry.
    }
  }

  // The wheel has physically stopped, but the result reveal is held back
  // by RESULT_REVEAL_DELAY_MS so it doesn't feel abrupt -- confetti fires
  // right as the result screen appears, only for an actual win.
  const handleAnimationComplete = () => {
    const won = spinApi.outcome?.success === true
    setAwaitingReveal(true)
    revealTimerRef.current = setTimeout(() => {
      setShowResult(true)
      setAwaitingReveal(false)
      if (won) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          zIndex: 10002,
        })
      }
    }, RESULT_REVEAL_DELAY_MS)
  }

  const handleCtaClick = () => {
    trackLuckyWheelEvent('reward_cta_clicked', {
      campaign_id: campaign.id,
      event_id: eventId,
      reward_id: spinApi.outcome?.allocationId,
    })
  }

  const winningRewardId = spinApi.outcome?.success ? spinApi.outcome.rewardId ?? null : null

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        // Accessible name, stable across the form and result screens (the
        // visible h2 only exists on the form screen). Also the hook the
        // placement e2e spec selects on.
        aria-label="Roue de la fortune"
        // max-h-[75vh] on mobile (product feedback 2026-09-22: popup must
        // never exceed 3/4 of the screen height), relaxed on sm+ where the
        // two-column layout is much shorter. overflow-y-auto so any
        // overflow scrolls inside the dialog rather than clipping or
        // pushing the dialog off-screen.
        className="relative flex max-h-[75vh] w-full max-w-240 flex-col overflow-y-auto rounded-2xl border border-border/80 bg-background shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:max-h-[90vh]"
      >
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 rounded-full border border-border/60 bg-background/90 p-2 opacity-80 transition-opacity hover:opacity-100 sm:right-4 sm:top-4"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        {showResult && spinApi.outcome ? (
          <div className="p-5 sm:p-8">
            <LuckyWheelResult
              outcome={spinApi.outcome}
              eventId={eventId}
              onClose={handleClose}
              onCtaClick={handleCtaClick}
            />
          </div>
        ) : (
          // Two-column layout (product reference 2026-09-22): wheel fills
          // the left column, form/copy the right -- both visible together,
          // no step to click through before the wheel appears. Stacks
          // vertically below the sm breakpoint; the wheel column never
          // gets width-constrained below the wheel's own 80vw/445px sizing
          // (min-w-0 + shrink-0 on the wheel wrapper, not a flex-basis
          // percentage that could squeeze it under 445px on mid-size
          // screens).
          <div className="flex flex-col sm:flex-row">
            {/* Mobile: the wheel is clipped to a fixed, shorter band and
                fades out at the bottom instead of reserving its full
                320px height -- the pointer, hub and top segments (what
                actually needs to be seen) stay visible, the rest is
                implied rather than scrolled to (product feedback
                2026-09-23: "je veux pas de scroll... masquer le bas de
                la roue avec un fade"). Full circle again at sm+, where
                the two-column layout has plenty of vertical room. */}
            <div
              // Fixed height (not an inline style, which can't vary by
              // breakpoint) so the clip window applies on mobile only --
              // an inline style={{height:220}} was leaking into desktop
              // too, clipping the wheel there as well even though
              // overflow was visible (bug reported 2026-09-23, "le
              // desktop est hideux"). h-55 (=220px) on mobile, h-auto
              // from sm+ so the full 320px circle renders with room to
              // spare in the two-column layout.
              className="relative flex h-55 shrink-0 items-start justify-center overflow-hidden bg-muted/40 pt-6 sm:h-auto sm:items-center sm:overflow-visible sm:p-8 sm:pt-8 sm:w-111.25"
            >
              <div className="h-80 sm:h-auto">
                <LuckyWheelWheel
                  segments={campaign.rewards}
                  winningRewardId={winningRewardId}
                  onAnimationComplete={handleAnimationComplete}
                />
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent sm:hidden"
                aria-hidden="true"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4 text-center sm:gap-4 sm:p-8 sm:text-left">
              <div>
                <h2 className="text-lg font-bold sm:text-2xl">Tourne & gagne !</h2>
                {/* "Chance élevée de gagner", not a hard 100% guarantee at
                    the code level -- the RPC can still return
                    NO_REWARD_AVAILABLE if every reward is exhausted or out
                    of its commercial phase. The admin operating convention
                    (docs/guides/critical-operations.md candidate) is to
                    always keep at least one low-cost, unlimited-stock
                    reward active so this copy stays true in practice. */}
                <p className="text-xs font-semibold text-primary sm:text-sm">
                  Une récompense à gagner à chaque participation.
                </p>
              </div>

              <LuckyWheelEntryForm
                submitting={spinApi.submittingEmail || spinApi.spinning || awaitingReveal}
                error={spinApi.error}
                onSubmit={handleFormSubmit}
                onDecline={handleClose}
              />

              <p className="hidden text-xs text-muted-foreground sm:block">
                Ton email sert uniquement à t'envoyer ta récompense et, si tu l'acceptes, nos actualités.
                Désabonnement possible à tout moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
