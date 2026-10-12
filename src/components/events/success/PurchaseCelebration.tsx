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

const rand = (min: number, max: number) => min + Math.random() * (max - min)

// Scene timeline (ms): spotlight fades in, flames fly in every direction, the
// totem charges at the camera and roars (shakes), then the stage fades out and
// the card turns to face the viewer.
const FLAMES_START = 350
const FLAMES_END = 2900
const LOGO_START = 600
const REVEAL_AT = 3100
const BURST_AT = 3500
const DONE_AT = 4300

type Phase = 'stage' | 'reveal' | 'done'

const STAGE_CSS = `
@keyframes ob-stage-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes ob-light-pulse { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.12); opacity: 1 } }
@keyframes ob-roar {
  0%   { transform: translate(0,0) scale(.12) rotate(0); opacity: 0; filter: drop-shadow(0 0 0 rgba(249,115,22,0)) }
  30%  { transform: translate(0,0) scale(1.05) rotate(0); opacity: 1; filter: drop-shadow(0 0 40px rgba(249,115,22,.9)) }
  36%  { transform: translate(-10px,6px) scale(1.12) rotate(-2.5deg) }
  42%  { transform: translate(12px,-8px) scale(1.18) rotate(2.5deg) }
  48%  { transform: translate(-14px,-4px) scale(1.14) rotate(-3deg) }
  54%  { transform: translate(10px,8px) scale(1.22) rotate(2deg) }
  60%  { transform: translate(-12px,-8px) scale(1.18) rotate(-2.5deg) }
  66%  { transform: translate(14px,4px) scale(1.24) rotate(3deg) }
  72%  { transform: translate(-8px,8px) scale(1.2) rotate(-2deg) }
  78%  { transform: translate(8px,-6px) scale(1.26) rotate(2deg); opacity: 1; filter: drop-shadow(0 0 70px rgba(249,115,22,1)) }
  88%  { transform: translate(0,0) scale(1.36) rotate(0); opacity: 1; filter: drop-shadow(0 0 90px rgba(249,115,22,1)); animation-timing-function: cubic-bezier(.55,0,1,.45) }
  100% { transform: translate(0,0) scale(.1) rotate(0); opacity: 0; filter: drop-shadow(0 0 0 rgba(249,115,22,0)) }
}
`

const makeFlames = async () => {
  const { default: confetti } = await import('canvas-confetti')
  const small = confetti.shapeFromText({ text: '🔥', scalar: 2.5 })
  const big = confetti.shapeFromText({ text: '🔥', scalar: 4.5 })
  return { confetti, small, big }
}

type Flames = Awaited<ReturnType<typeof makeFlames>>

// Flames fly out in every direction, some rising, some falling.
const fireFlames = ({ confetti, small, big }: Flames) => {
  const useBig = Math.random() > 0.55
  confetti({
    particleCount: Math.round(rand(4, 9)),
    angle: rand(0, 360),
    spread: rand(40, 90),
    startVelocity: rand(25, 60),
    gravity: rand(-0.15, 0.6),
    drift: rand(-1.2, 1.2),
    ticks: Math.round(rand(110, 190)),
    origin: { x: rand(0.02, 0.98), y: rand(0.3, 1.05) },
    shapes: [useBig ? big : small],
    scalar: useBig ? 4.5 : 2.5,
    flat: true,
    zIndex: 1000,
    disableForReducedMotion: true,
  })
}

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
    let flameTimer: number | undefined
    let flames: Flames | null = null
    let finished = false

    void makeFlames().then((loaded) => {
      flames = loaded
    })

    const scrollToCard = () =>
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const burst = () => {
      if (!flames) return
      flames.confetti({
        particleCount: 170,
        spread: 110,
        startVelocity: 48,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#26AA26', '#86efac', '#facc15', '#f97316', '#ffffff'],
        zIndex: 1000,
        disableForReducedMotion: true,
      })
    }

    const finish = (instant: boolean) => {
      if (finished) return
      finished = true
      timers.forEach(window.clearTimeout)
      window.clearInterval(flameTimer)
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

    timers.push(
      window.setTimeout(() => {
        flameTimer = window.setInterval(() => flames && fireFlames(flames), 90)
      }, FLAMES_START),
    )
    timers.push(window.setTimeout(() => window.clearInterval(flameTimer), FLAMES_END))
    timers.push(window.setTimeout(() => setLogoOn(true), LOGO_START))
    timers.push(window.setTimeout(() => finish(false), REVEAL_AT))

    return () => {
      finished = true
      timers.forEach(window.clearTimeout)
      window.clearInterval(flameTimer)
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
              'radial-gradient(closest-side, rgba(38,170,38,.40), rgba(249,115,22,.14) 60%, transparent 100%)',
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
          className="aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-[#050607] shadow-2xl shadow-primary/30"
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
          {/* Warm light from below + pulsing centre light */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: 'linear-gradient(0deg, rgba(249,115,22,.30), transparent)' }}
          />
          <div
            aria-hidden
            className="absolute h-[70vmin] w-[70vmin] rounded-full"
            style={{
              background: 'radial-gradient(closest-side, rgba(134,239,172,.25), transparent)',
              animation: 'ob-light-pulse 1.4s ease-in-out infinite',
            }}
          />
          <span className="absolute bottom-6 text-xs uppercase tracking-[0.3em] text-white/40">
            Touche pour passer
          </span>
        </div>
      ) : null}

      {/* Own layer above the confetti canvas (z 1000): flames and confetti pass behind the totem. */}
      {logoOn ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1100] flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/totem_logo_white.png"
            alt=""
            className="w-[46vmin] max-w-sm"
            style={{ animation: 'ob-roar 2.5s cubic-bezier(.2,.8,.2,1) forwards' }}
          />
        </div>
      ) : null}
    </section>
  )
}
