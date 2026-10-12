'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Download, Link2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildShareText,
  buildShareUrl,
  buildSocialShareLinks,
  type SocialNetwork,
} from '@/lib/share/purchaseShare'

interface PurchaseCelebrationProps {
  registrationId: string
  eventSlug: string
  eventTitle: string
  hasFirstName: boolean
  /** Dev-only: render the sample card from the preview page. */
  preview?: boolean
  previewTeamSize?: number
}

const NETWORK_LABELS: Record<SocialNetwork, string> = {
  whatsapp: 'WhatsApp',
  x: 'X',
  reddit: 'Reddit',
  facebook: 'Facebook',
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Scene timeline (ms): spotlight fades in, the totem charges at the camera and
// fades in smoothly, then the stage fades out, the card turns to face the viewer
// and one confetti burst goes off.
const LOGO_START = 600
const REVEAL_AT = 3100
const BURST_AT = 3500
const DONE_AT = 4300

type Phase = 'stage' | 'reveal' | 'done'

const STAGE_CSS = `
@keyframes ob-stage-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes ob-light-pulse { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.12); opacity: 1 } }
@keyframes ob-roar {
  0%   { transform: scale(.7); opacity: 0; animation-timing-function: cubic-bezier(.16,1,.3,1) }
  20%  { transform: scale(1.1); opacity: 1; animation-timing-function: ease-in-out }
  30%  { transform: scale(.98); animation-timing-function: ease-in-out }
  38%  { transform: scale(1); animation-timing-function: ease-in-out }
  80%  { transform: scale(1.08); opacity: 1; animation-timing-function: cubic-bezier(.5,0,.75,0) }
  100% { transform: scale(1.4); opacity: 0 }
}
@keyframes ob-tremor {
  0%,100% { transform: translate(0,0) rotate(0) }
  25%     { transform: translate(1.5px,-1px) rotate(.25deg) }
  50%     { transform: translate(-1px,1.5px) rotate(-.2deg) }
  75%     { transform: translate(-1.5px,-.5px) rotate(.15deg) }
}
`

const loadConfetti = async () => (await import('canvas-confetti')).default

type Confetti = Awaited<ReturnType<typeof loadConfetti>>

export function PurchaseCelebration({
  registrationId,
  eventSlug,
  eventTitle,
  hasFirstName,
  preview = false,
  previewTeamSize,
}: PurchaseCelebrationProps) {
  const [phase, setPhase] = useState<Phase>('stage')
  const [logoOn, setLogoOn] = useState(false)
  const [showName, setShowName] = useState(true)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<(() => void) | null>(null)

  const revealed = phase !== 'stage'

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('done')
      return
    }

    const timers: number[] = []
    let confetti: Confetti | null = null
    let finished = false

    void loadConfetti().then((loaded) => {
      confetti = loaded
    })

    const scrollToCard = () =>
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const burst = () => {
      if (!confetti) return
      confetti({
        particleCount: 170,
        spread: 110,
        startVelocity: 48,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#26AA26', '#86efac', '#ffffff'],
        zIndex: 1000,
        disableForReducedMotion: true,
      })
    }

    const finish = (instant: boolean) => {
      if (finished) return
      finished = true
      timers.forEach(window.clearTimeout)
      setLogoOn(false)
      if (instant) {
        setPhase('done')
        scrollToCard()
        return
      }
      setPhase('reveal')
      scrollToCard()
      timers.push(window.setTimeout(burst, BURST_AT - REVEAL_AT))
      timers.push(window.setTimeout(() => setPhase('done'), DONE_AT - REVEAL_AT))
    }
    skipRef.current = () => finish(true)
    // Keyboard users skip with Escape, Enter or Space (the overlay has no focusable control).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') skipRef.current?.()
    }
    window.addEventListener('keydown', onKeyDown)

    timers.push(window.setTimeout(() => setLogoOn(true), LOGO_START))
    timers.push(window.setTimeout(() => finish(false), REVEAL_AT))

    return () => {
      finished = true
      timers.forEach(window.clearTimeout)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // The stage covers the viewport: freeze page scroll underneath it.
  useEffect(() => {
    if (phase !== 'stage') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  const cardUrl = useMemo(() => {
    const params = new URLSearchParams({ registration_id: registrationId })
    if (!showName) params.set('name', '0')
    if (preview) params.set('preview', '1')
    if (preview && previewTeamSize) params.set('team', String(previewTeamSize))
    return `/api/events/${encodeURIComponent(eventSlug)}/success/card?${params.toString()}`
  }, [registrationId, eventSlug, showName, preview, previewTeamSize])

  const shareText = buildShareText(eventTitle)
  // Origin is only known in the browser: resolve it after mount to keep SSR and hydration identical.
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  const shareUrl = origin ? buildShareUrl(origin, eventSlug) : ''
  const links = buildSocialShareLinks(shareUrl, shareText)

  const fetchCardFile = useCallback(async () => {
    const response = await fetch(cardUrl)
    if (!response.ok) throw new Error('Carte indisponible')
    const blob = await response.blob()
    return new File([blob], 'overbound-inscription.png', { type: 'image/png' })
  }, [cardUrl])

  const download = useCallback(async () => {
    const file = await fetchCardFile()
    const href = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = file.name
    anchor.click()
    URL.revokeObjectURL(href)
  }, [fetchCardFile])

  const shareStory = async () => {
    setBusy(true)
    setError(null)
    try {
      const file = await fetchCardFile()
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText, url: shareUrl })
      } else {
        await download()
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setError('Partage impossible, essaie de télécharger la carte.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copie impossible.')
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 overflow-x-clip">
      <div ref={cardRef} className="relative isolate w-72 sm:w-80">
        {/* Spotlight on the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -inset-y-12 -z-10"
          style={{
            background:
              'radial-gradient(closest-side, rgba(38,170,38,.40), rgba(38,170,38,.14) 60%, transparent 100%)',
            opacity: revealed ? 1 : 0,
            transition: 'opacity 1400ms ease-out',
          }}
        />
        <div
          style={{
            // Plain 2D-flat once settled: a lingering 3D transform makes the
            // browser rasterize the image at low resolution (blurry/pixelated).
            transform:
              phase === 'done'
                ? 'none'
                : revealed
                  ? 'perspective(1400px) rotateY(0deg) scale(1)'
                  : 'perspective(1400px) rotateY(-100deg) scale(.85)',
            opacity: revealed ? 1 : 0,
            transition: 'transform 1000ms cubic-bezier(.2,.9,.25,1), opacity 600ms ease-out',
          }}
          className="aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-surface-deep shadow-2xl shadow-primary/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardUrl}
            alt={`Carte d'inscription ${eventTitle}`}
            width={1080}
            height={1920}
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {hasFirstName ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showName}
            onChange={(event) => setShowName(event.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Afficher mon prénom sur la carte
        </label>
      ) : null}

      <div className="flex w-full flex-col gap-3">
        <Button size="lg" className="min-h-11 w-full" onClick={shareStory} disabled={busy}>
          <Share2 className="mr-2 h-4 w-4" /> Partager en story
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => void download().catch(() => setError('Téléchargement impossible.'))}
        >
          <Download className="mr-2 h-4 w-4" /> Télécharger la carte
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(links) as SocialNetwork[]).map((network) => (
            <Button key={network} asChild variant="secondary" className="min-h-11">
              <a href={links[network]} target="_blank" rel="noopener noreferrer">
                {NETWORK_LABELS[network]}
              </a>
            </Button>
          ))}
        </div>
        <Button variant="ghost" className="min-h-11" onClick={copyLink}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />}
          {copied ? 'Lien copié' : 'Copier le lien'}
        </Button>
        {error ? <p role="alert" className="text-center text-sm text-destructive">{error}</p> : null}
      </div>

      {phase !== 'done' ? (
        <div
          role="presentation"
          onClick={() => skipRef.current?.()}
          className="fixed inset-0 z-[900] flex cursor-pointer items-center justify-center overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 46%, rgba(38,170,38,.38) 0%, rgba(8,14,10,.96) 38%, #000 78%)',
            opacity: phase === 'reveal' ? 0 : 1,
            transition: phase === 'reveal' ? 'opacity 800ms ease-in' : undefined,
            animation: phase === 'stage' ? 'ob-stage-in 450ms ease-out' : undefined,
            pointerEvents: phase === 'reveal' ? 'none' : 'auto',
          }}
        >
          <style>{STAGE_CSS}</style>
          {/* Light from below + pulsing centre light */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: 'linear-gradient(0deg, rgba(38,170,38,.30), transparent)' }}
          />
          <div
            aria-hidden
            className="absolute h-[70vmin] w-[70vmin] rounded-full"
            style={{
              background: 'radial-gradient(closest-side, rgba(134,239,172,.25), transparent)',
              animation: 'ob-light-pulse 1.4s ease-in-out infinite',
            }}
          />
          <span className="absolute bottom-6 text-xs uppercase tracking-eyebrow text-white/70">
            Touche ou Échap pour passer
          </span>
        </div>
      ) : null}

      {/* Own layer above the confetti canvas (z 1000): confetti passes behind the totem. */}
      {logoOn ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1100] flex items-center justify-center"
        >
          <div
            className="w-[46vmin] max-w-sm will-change-transform"
            style={{
              animation: 'ob-roar 2.5s linear forwards',
              filter: 'drop-shadow(0 0 48px rgba(38,170,38,.55))',
            }}
          >
            {/* Very light tremor on its own layer, starts once the entry bounce settles. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/totem_logo_white.png"
              alt=""
              className="w-full"
              style={{ animation: 'ob-tremor 120ms linear 800ms infinite' }}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
