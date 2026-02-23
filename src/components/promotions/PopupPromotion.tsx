'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePromotions } from '@/app/api/promotions/promotionsQueries'
import { isPopupPromotion } from '@/types/Promotion'
import type { Promotion, PopupConfig } from '@/types/Promotion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, X } from 'lucide-react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

interface PopupPromotionProps {
  isAuthenticated: boolean
}

export function PopupPromotion({ isAuthenticated }: PopupPromotionProps) {
  const { data: promotions = [], isLoading } = usePromotions()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha | null>(null)
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? ''
  const shouldUseCaptcha = Boolean(hcaptchaSiteKey)

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

    // Check if already shown in this session
    const sessionKey = `popup-seen-${activePopup.id}`
    const hasSeenInSession = sessionStorage.getItem(sessionKey)

    if (hasSeenInSession) return

    // Apply delay if configured
    const delay = activePopup.popup_config?.delay_ms || 0

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [activePopup])

  const handleClose = () => {
    if (activePopup) {
      // Mark as seen in this session
      sessionStorage.setItem(`popup-seen-${activePopup.id}`, 'true')
    }
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activePopup) return
    if (shouldUseCaptcha && !captchaToken) {
      setError('Merci de valider le captcha avant de continuer.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/promotions/popup-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          promotion_id: activePopup.id,
          captchaToken: shouldUseCaptcha ? captchaToken : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      // Success!
      setIsSuccess(true)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)

      // Mark as seen
      sessionStorage.setItem(`popup-seen-${activePopup.id}`, 'true')

      // Close after showing success message
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !activePopup) return null

  const config = activePopup.popup_config!

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && config.backdrop_dismissible) {
          handleClose()
        }
      }}
    >
      <DialogContent
        className="max-w-5xl"
        onPointerDownOutside={(e) => {
          if (!config.backdrop_dismissible) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!config.backdrop_dismissible) {
            e.preventDefault()
          }
        }}
      >
        {config.show_close_button && !isSuccess && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {config.background_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 -z-10"
            style={{ backgroundImage: `url(${config.background_image_url})` }}
          />
        )}

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <DialogTitle className="text-2xl font-bold mb-2">
              {config.success_message || 'Merci !'}
            </DialogTitle>
            <DialogDescription className="text-base">
              Tu vas recevoir un email de confirmation très bientôt.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {config.form_title}
              </DialogTitle>
              <DialogDescription className="text-base">
                {config.form_description}
              </DialogDescription>
            </DialogHeader>

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
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              {shouldUseCaptcha ? (
                <div className="flex justify-center">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={hcaptchaSiteKey}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                  />
                </div>
              ) : null}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  config.submit_button_text
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                En t'inscrivant, tu acceptes de recevoir nos emails marketing.
                Tu peux te désinscrire à tout moment.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
