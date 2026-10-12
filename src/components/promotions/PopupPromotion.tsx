'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { usePromotions } from '@/app/api/promotions/promotionsQueries'
import { isPopupPromotion } from '@/types/Promotion'
import type { Promotion, PopupConfig } from '@/types/Promotion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, X } from 'lucide-react'
import {
  getPopupSubscribeValidationError,
  normalizePopupSubscribeValue,
} from '@/lib/promotions/popupSubscribeValidation'
import { usePopupSlot } from '@/components/popups/PopupArbiterProvider'

interface PopupPromotionProps {
  isAuthenticated: boolean
}

const POPUP_SUBSCRIBED_STORAGE_KEY = 'overbound-popup-subscribed'
const POPUP_LAST_SEEN_STORAGE_KEY = 'overbound-popup-last-seen-id'
const buildRedirectUrlWithNotice = (basePath: string, notice: string) => {
  const separator = basePath.includes('?') ? '&' : '?'
  return `${basePath}${separator}popup_notice=${encodeURIComponent(notice)}`
}

export function PopupPromotion({ isAuthenticated }: PopupPromotionProps) {
  const { data: promotions = [], isLoading } = usePromotions()
  const requestPopupSlot = usePopupSlot('marketing-popup')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openedAt, setOpenedAt] = useState<number | null>(null)
  const [website, setWebsite] = useState('')

  // Form state
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')

  // Get active popup promotion
  const activePopup = useMemo(() => {
    if (isAuthenticated) return null // Don't show to authenticated users

    const popups = promotions.filter(isPopupPromotion)
    if (popups.length === 0) return null

    // Sort by starts_at DESC to get the most recent
    const sorted = [...popups].sort((a, b) =>
      new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
    )

    return sorted[0]
  }, [promotions, isAuthenticated])

  useEffect(() => {
    if (!activePopup) return

     // Don't show again if the user already submitted the popup.
    const hasAlreadySubscribed = localStorage.getItem(POPUP_SUBSCRIBED_STORAGE_KEY)
    if (hasAlreadySubscribed === 'true') return

    // Don't show again if this popup has already been seen in a previous session.
    const lastSeenPopupId = localStorage.getItem(POPUP_LAST_SEEN_STORAGE_KEY)
    if (lastSeenPopupId === activePopup.id) return

    // Check if already shown in this session
    const sessionKey = `popup-seen-${activePopup.id}`
    const hasSeenInSession = sessionStorage.getItem(sessionKey)

    if (hasSeenInSession) return

    // Apply delay if configured
    const delay = activePopup.popup_config?.delay_ms || 0

    const timer = setTimeout(() => {
      // FDR-0015 §7.3 layer 1: only one automatic popup per session -- if
      // the Lucky Wheel already claimed the slot, this popup never opens.
      if (!requestPopupSlot('marketing-popup')) return
      setOpenedAt(Date.now())
      setIsOpen(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [activePopup, requestPopupSlot])

  const handleClose = useCallback(() => {
    if (activePopup) {
      // Mark as seen in this session and persist across sessions for this popup.
      sessionStorage.setItem(`popup-seen-${activePopup.id}`, 'true')
      localStorage.setItem(POPUP_LAST_SEEN_STORAGE_KEY, activePopup.id)
    }
    setIsOpen(false)
  }, [activePopup])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activePopup) return
    if (website.trim().length > 0) {
      return
    }

    const elapsedMs = openedAt ? Date.now() - openedAt : null
    if (elapsedMs !== null && elapsedMs < 1500) {
      setError('Merci de patienter une seconde avant de valider.')
      return
    }

    const validationError = getPopupSubscribeValidationError({ fullName, email })
    if (validationError) {
      setError(validationError)
      return
    }

    const normalizedEmail = normalizePopupSubscribeValue(email)
    const normalizedFullName = normalizePopupSubscribeValue(fullName)

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/promotions/popup-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          full_name: normalizedFullName,
          promotion_id: activePopup.id,
          website: website.trim(),
          elapsed_ms: elapsedMs,
        }),
      })

      if (response.status === 409) {
        const data = await response.json()
        if (data?.code === 'EMAIL_ALREADY_REGISTERED') {
          sessionStorage.setItem(`popup-seen-${activePopup.id}`, 'true')
          localStorage.setItem(POPUP_LAST_SEEN_STORAGE_KEY, activePopup.id)
          localStorage.setItem(POPUP_SUBSCRIBED_STORAGE_KEY, 'true')
          window.location.href = buildRedirectUrlWithNotice(
            data.redirect_to || '/auth/login',
            'email_registered_login'
          )
          return
        }
        if (data?.code === 'EMAIL_ALREADY_IN_DATABASE') {
          sessionStorage.setItem(`popup-seen-${activePopup.id}`, 'true')
          localStorage.setItem(POPUP_LAST_SEEN_STORAGE_KEY, activePopup.id)
          window.location.href = buildRedirectUrlWithNotice(
            data.redirect_to || '/auth/register',
            'email_in_database_register'
          )
          return
        }
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      // Success!
      setIsSuccess(true)

      // Mark as seen
      sessionStorage.setItem(`popup-seen-${activePopup.id}`, 'true')
      localStorage.setItem(POPUP_LAST_SEEN_STORAGE_KEY, activePopup.id)
      localStorage.setItem(POPUP_SUBSCRIBED_STORAGE_KEY, 'true')

      // Close after showing success message
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !activePopup) return null

  const config = activePopup.popup_config!
  const validationError = getPopupSubscribeValidationError({ fullName, email })
  const canSubmit = !isSubmitting && !validationError

  const errorId = error ? 'popup-error' : undefined

  // Radix Dialog: focus trap, initial focus, focus return and Escape. Escape
  // always closes, even when backdrop clicks are disabled, so keyboard users
  // are never stuck (WCAG 2.1.2).
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6">
          <DialogPrimitive.Content
            aria-describedby={isSuccess ? 'popup-success-text' : 'popup-description'}
            onPointerDownOutside={(event) => {
              if (!config.backdrop_dismissible) event.preventDefault()
            }}
            className="relative z-[10001] w-full max-w-5xl overflow-hidden rounded-lg border border-border/80 bg-background p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/15 backdrop-blur-sm"
          >
        {config.show_close_button && !isSuccess && (
          <DialogPrimitive.Close
            className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-xl opacity-70 transition-opacity hover:opacity-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}

        {config.background_image_url && (
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.12]"
            style={{ backgroundImage: `url(${config.background_image_url})` }}
          />
        )}

        {isSuccess ? (
          <div role="status" className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" aria-hidden="true" />
            <DialogPrimitive.Title className="text-2xl font-bold mb-2">
              {config.success_message || 'Merci !'}
            </DialogPrimitive.Title>
            <p id="popup-success-text" className="text-base text-muted-foreground">
              Tu vas recevoir un email de confirmation très bientôt.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <DialogPrimitive.Title className="text-2xl font-bold">
                {config.form_title}
              </DialogPrimitive.Title>
              <p id="popup-description" className="text-base text-muted-foreground">
                {config.form_description}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="popup-name">
                  Prénom
                </Label>
                <Input
                  id="popup-name"
                  type="text"
                  placeholder={config.name_placeholder || 'Ton prénom'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={errorId}
                  disabled={isSubmitting}
                  autoComplete="given-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-email">
                  Email
                </Label>
                <Input
                  id="popup-email"
                  type="email"
                  placeholder={config.email_placeholder || 'ton@email.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={errorId}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              <div className="hidden" aria-hidden="true">
                <Label htmlFor="popup-website">Site web</Label>
                <Input
                  id="popup-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              {error && (
                <div id="popup-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Inscription en cours...
                  </>
                ) : (
                  config.submit_button_text
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                En t'inscrivant, tu acceptes de recevoir nos emails marketing.
                Tu peux te désinscrire à tout moment et demander la suppression de tes données (voir notre{' '}
                <a href="/privacy-policies#droits" className="underline underline-offset-2">politique de confidentialité</a>).
              </p>
            </form>
          </>
        )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
