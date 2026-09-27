'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { RewardRarity } from '@/lib/luckyWheel/campaign'

export interface WheelSegment {
  id: string
  name: string
  rarity: RewardRarity
  imageUrl: string | null
}

interface LuckyWheelWheelProps {
  segments: WheelSegment[]
  /** Server-determined winning reward id, already resolved before this
   * component starts spinning -- the wheel only animates toward it, it
   * never decides (spec §3.3). Null until the spin request resolves. */
  winningRewardId: string | null
  onAnimationComplete: () => void
}

// Overbound brand palette (docs/guides/email-conventions.md), ordered
// common -> legendary. A color gradient tied to real rarity is honest
// disclosure (unlike segment *size*, which stays equal regardless -- see
// campaign.ts rarityFromProbability/rarityFromWeightRank comment): it
// tells the participant "this one's special" without exposing the exact
// odds. Legendary uses gold, the brand's highest-attention accent.
const RARITY_COLORS: Record<RewardRarity, string> = {
  common: '#64748b',
  uncommon: '#2563eb',
  rare: '#7c3aed',
  legendary: '#facc15',
}

const RARITY_TEXT_COLORS: Record<RewardRarity, string> = {
  common: '#ffffff',
  uncommon: '#ffffff',
  rare: '#ffffff',
  legendary: '#0f172a',
}

const SIZE = 320
const RADIUS = SIZE / 2
const CENTER = SIZE / 2
const HUB_RADIUS = RADIUS * 0.24
const SPIN_DURATION_MS = 4200
const EXTRA_FULL_TURNS = 6
// Idle step: the wheel physically rotates by one segmentAngle at a time,
// in a loop, while waiting for the participant to click (product decision
// 2026-09-22 -- a real mechanical step, not a color highlight hopping
// between fixed segments). STEP_DURATION_MS is the rotation's own CSS
// transition length; HOLD_MS is how long it pauses on each segment before
// stepping again.
const IDLE_STEP_DURATION_MS = 260
const IDLE_STEP_HOLD_MS = 500

// Mirrors the SVG's own CSS transition easing (cubic-bezier(0.17, 0.67,
// 0.12, 0.99)) in JS, via Newton-Raphson root-finding -- needed so the
// center hub image can be updated in step with the wheel's actual
// on-screen angle during the real spin (product feedback 2026-09-23: the
// hub should keep cycling images at the wheel's pace while it spins, not
// jump straight to the final image), not just at idle/instant transitions.
// A small, precise cubic-bezier progress function is worth writing by hand
// here rather than adding a dependency for it.
const makeCubicBezierEasing = (x1: number, y1: number, x2: number, y2: number) => {
  const sampleCurveX = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
  const sampleCurveY = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
  const sampleCurveDerivativeX = (t: number) =>
    3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2)

  const solveForT = (x: number) => {
    let t = x
    for (let i = 0; i < 8; i += 1) {
      const currentX = sampleCurveX(t) - x
      const derivative = sampleCurveDerivativeX(t)
      if (Math.abs(derivative) < 1e-6) break
      t -= currentX / derivative
    }
    return Math.min(1, Math.max(0, t))
  }

  return (x: number) => sampleCurveY(solveForT(x))
}

const spinEasing = makeCubicBezierEasing(0.17, 0.67, 0.12, 0.99)

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Point on the wheel's circumference at `angleDeg`, measured clockwise
 * from the top (12 o'clock), matching where the fixed pointer sits. */
const pointOnCircle = (angleDeg: number, radius: number) => {
  const angleFromTop = toRadians(angleDeg - 90)
  return {
    x: CENTER + radius * Math.cos(angleFromTop),
    y: CENTER + radius * Math.sin(angleFromTop),
  }
}

const describeSegmentPath = (startAngle: number, endAngle: number) => {
  const start = pointOnCircle(startAngle, RADIUS)
  const end = pointOnCircle(endAngle, RADIUS)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
}

const MAX_LABEL_LINE_LENGTH = 11
const MAX_LABEL_LINES = 3

/** Greedily wraps a reward name into short lines that fit a narrow wedge,
 * truncating with an ellipsis rather than letting text spill past the
 * segment (the "on ne voit pas ce qu'il y a marqué" bug reported
 * 2026-09-22). Word-based, not character-based, so words aren't split
 * mid-way when they do fit. */
const wrapLabel = (name: string): string[] => {
  const words = name.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= MAX_LABEL_LINE_LENGTH) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    current = word.length > MAX_LABEL_LINE_LENGTH ? `${word.slice(0, MAX_LABEL_LINE_LENGTH - 1)}…` : word
  }
  if (current) lines.push(current)

  if (lines.length > MAX_LABEL_LINES) {
    const truncated = lines.slice(0, MAX_LABEL_LINES)
    truncated[MAX_LABEL_LINES - 1] = `${truncated[MAX_LABEL_LINES - 1].replace(/…$/, '')}…`
    return truncated
  }
  return lines
}

// FDR-0014 §3.3/§17: hand-built SVG wheel (product decision 2026-09-22 --
// discrete, step-by-step stop like Flytex, text always upright at rest,
// per-reward product images; the react-custom-roulette-r19 library
// supported neither, hence this replacement). Segment sizes stay equal
// regardless of rarity (§17: never imply a probability that isn't the real
// one) -- only color and, once configured, the product image communicate
// rarity/identity. The wheel is idle until a server result exists, then
// rotates by an exact, precomputed angle so it always comes to rest with
// the winning segment centered under the fixed top pointer, upright and
// readable -- never an arbitrary/continuous spin with no guaranteed
// final orientation.
export function LuckyWheelWheel({ segments, winningRewardId, onAnimationComplete }: LuckyWheelWheelProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasCompletedForCurrentWin, setHasCompletedForCurrentWin] = useState(false)
  // The idle rotation and the real spin both drive the same `rotation`
  // value but with different transition durations -- this flag picks which
  // CSS transition length applies on the next rotation change.
  const [isIdleStepping, setIsIdleStepping] = useState(false)
  // Separate from `rotation`: the wheel's *actual* SVG rotation is a CSS
  // transition the browser animates natively (smoother than a React-driven
  // rAF loop would manage at 320px). displayRotation is a JS-side replica,
  // stepped via requestAnimationFrame using the same easing curve, used
  // only to derive which segment is under the pointer *during* the spin --
  // so the center hub image keeps cycling in step with the visible motion
  // instead of jumping straight to the final image (product feedback
  // 2026-09-23).
  const [displayRotation, setDisplayRotation] = useState(0)
  const spinAnimationRef = useRef<{ start: number; from: number; to: number; rafId: number } | null>(null)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(query.matches)
    const listener = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  // Shuffled once per distinct segment set (keyed by id list), not on every
  // render: the API groups rewards by rarity, which reads as an arbitrary
  // ranking ("why is this one first?") rather than a wheel.
  const segmentKey = segments.map((segment) => segment.id).join('|')
  const shuffledSegments = useMemo(() => {
    const copy = [...segments]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentKey])

  const segmentAngle = 360 / Math.max(shuffledSegments.length, 1)

  useEffect(() => {
    if (!winningRewardId || isSpinning || hasCompletedForCurrentWin) return

    // Stop the idle step rotation immediately -- the real spin takes over
    // from whatever angle it left off at, never resets or jumps backward.
    setIsIdleStepping(false)

    const winningIndex = shuffledSegments.findIndex((segment) => segment.id === winningRewardId)
    const targetIndex = winningIndex >= 0 ? winningIndex : 0

    if (prefersReducedMotion) {
      // Skip the animation entirely; go straight to the result (§17).
      setHasCompletedForCurrentWin(true)
      onAnimationComplete()
      return
    }

    // Target rotation is computed relative to the wheel's *current* angle
    // (which the idle step loop may have already advanced), not an
    // absolute value -- otherwise the wheel could visibly jump backward if
    // idle stepping had rotated past where a naive absolute target would
    // land. The segment's center angle is (targetIndex + 0.5) *
    // segmentAngle measured clockwise from the top; the wheel must land on
    // a rotation R (mod 360) such that R ≡ 360 - segmentCenterAngle, i.e.
    // the smallest forward rotation from the current angle that satisfies
    // that congruence, plus several full turns for the visual spin.
    //
    // BUG FIXED 2026-09-23 ("tombé entre deux cases"): the actual on-screen
    // angle is `rotation - segmentAngle / 2` (see the SVG transform below,
    // pointer-centering offset), but this formula used to target `rotation`
    // directly -- the wheel always landed exactly half a segment off from
    // the winning reward. currentAngleMod360 must account for that same
    // offset so the *visual* result, not the raw state value, lands on the
    // segment's center.
    const fromRotation = rotation
    const segmentCenterAngle = (targetIndex + 0.5) * segmentAngle
    const requiredFinalAngleMod360 = (360 - segmentCenterAngle) % 360
    const currentVisualAngleMod360 = (((fromRotation - segmentAngle / 2) % 360) + 360) % 360
    const forwardDelta = (requiredFinalAngleMod360 - currentVisualAngleMod360 + 360) % 360
    const toRotation = fromRotation + forwardDelta + EXTRA_FULL_TURNS * 360

    setRotation(toRotation)
    setIsSpinning(true)

    // Drive displayRotation with our own rAF loop, replicating the SVG's
    // CSS easing in JS, so currentTopIndex (below) reflects the wheel's
    // real on-screen angle throughout the spin -- not just at the start
    // and end -- and the center hub keeps cycling images at the wheel's
    // decelerating pace (product feedback 2026-09-23).
    if (spinAnimationRef.current) {
      cancelAnimationFrame(spinAnimationRef.current.rafId)
    }
    const animationState = { start: performance.now(), from: fromRotation, to: toRotation, rafId: 0 }
    spinAnimationRef.current = animationState

    const tick = (now: number) => {
      const elapsed = now - animationState.start
      const progress = Math.min(1, elapsed / SPIN_DURATION_MS)
      const eased = spinEasing(progress)
      setDisplayRotation(animationState.from + (animationState.to - animationState.from) * eased)
      if (progress < 1) {
        animationState.rafId = requestAnimationFrame(tick)
      }
    }
    animationState.rafId = requestAnimationFrame(tick)
    // `rotation` is intentionally not a dependency: it's read here as "the
    // angle at the moment winningRewardId became available", not something
    // this effect should re-run for -- it changes continuously during idle
    // stepping, and re-running this effect on every idle step (while
    // isSpinning is still false) would be harmless but wasteful, whereas
    // re-running it mid-spin would restart the rAF loop from a stale point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    winningRewardId,
    isSpinning,
    hasCompletedForCurrentWin,
    shuffledSegments,
    segmentAngle,
    prefersReducedMotion,
    onAnimationComplete,
  ])

  useEffect(() => {
    return () => {
      if (spinAnimationRef.current) cancelAnimationFrame(spinAnimationRef.current.rafId)
    }
  }, [])

  const handleTransitionEnd = () => {
    if (!isSpinning) return
    if (spinAnimationRef.current) {
      cancelAnimationFrame(spinAnimationRef.current.rafId)
      // Snap display to the exact final angle -- the rAF loop's last frame
      // could land a fraction of a degree short of it, which would then
      // make currentTopIndex briefly disagree with the wheel's true
      // (CSS-driven) resting position right as the result reveals.
      setDisplayRotation(spinAnimationRef.current.to)
      spinAnimationRef.current = null
    }
    setIsSpinning(false)
    setHasCompletedForCurrentWin(true)
    onAnimationComplete()
  }

  const isIdle = !isSpinning && !winningRewardId

  // Outside of an active spin, displayRotation just mirrors rotation
  // directly (idle stepping is already discrete/instant enough that a
  // separate rAF isn't needed there -- only the continuous real spin
  // requires interpolation).
  useEffect(() => {
    if (!isSpinning) setDisplayRotation(rotation)
  }, [rotation, isSpinning])

  // Idle rotation: the wheel physically turns by one segmentAngle at a
  // time, pausing between steps, looping continuously until the
  // participant clicks. Stops immediately once winningRewardId is set --
  // the real spin (above) then takes over from wherever this left off, it
  // never continues as a decelerating version of this loop.
  useEffect(() => {
    if (!isIdle || prefersReducedMotion || shuffledSegments.length === 0) return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    const step = () => {
      if (cancelled) return
      setIsIdleStepping(true)
      setRotation((previous) => previous + segmentAngle)
      timeoutId = setTimeout(step, IDLE_STEP_DURATION_MS + IDLE_STEP_HOLD_MS)
    }

    timeoutId = setTimeout(step, IDLE_STEP_HOLD_MS)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [isIdle, prefersReducedMotion, shuffledSegments.length, segmentAngle])

  // The segment currently under the fixed top pointer -- drives the center
  // hub image. Uses displayRotation (not rotation directly) so this stays
  // accurate throughout the real spin's rAF-driven interpolation, not just
  // at its start and end; during idle stepping and at rest the two values
  // are identical anyway.
  const currentTopIndex = useMemo(() => {
    if (shuffledSegments.length === 0) return 0
    // Must mirror the same -segmentAngle/2 pointer-centering offset applied
    // to the SVG's own transform below, or this picks the segment whose
    // *boundary* (not center) is under the pointer -- one wheel-body off
    // from what's actually visible.
    const visualRotation = displayRotation - segmentAngle / 2
    const normalized = ((visualRotation % 360) + 360) % 360
    // Inverse of the targeting math in the spin effect: rotation R brings
    // segment index i to the top when R ≡ 360 - (i + 0.5) * segmentAngle.
    const centerAngleAtTop = (360 - normalized) % 360
    const index = Math.floor(centerAngleAtTop / segmentAngle) % shuffledSegments.length
    return index
  }, [displayRotation, segmentAngle, shuffledSegments.length])

  const hubSegment = shuffledSegments[currentTopIndex] ?? null

  return (
    <div
      className={`relative mx-auto flex max-w-full items-center justify-center overflow-hidden ${
        isIdle && !prefersReducedMotion ? 'animate-lucky-wheel-breathe' : ''
      }`}
      style={{ width: SIZE, height: SIZE }}
    >
      {/* Fixed pointer, top center -- never rotates. */}
      <div
        className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '22px solid #0f172a',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
        }}
        aria-hidden="true"
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label="Roue des récompenses"
        style={{
          // Segment 0 spans [0, segmentAngle) with its *center* at
          // segmentAngle/2, but the fixed pointer sits at exactly 0°
          // (top). Without this offset, rotation=0 lines the pointer up
          // with the boundary between two segments, not the middle of
          // one -- the bug reported 2026-09-22 ("le petit triangle... il
          // est positionné pile poil entre deux cases"). Subtracting half
          // a segment here re-centers the whole wheel so rotation=0 (and
          // every subsequent step/spin target computed relative to it)
          // lands a segment's center under the pointer, never a seam.
          transform: `rotate(${rotation - segmentAngle / 2}deg)`,
          transition: isSpinning
            ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
            : isIdleStepping
              ? `transform ${IDLE_STEP_DURATION_MS}ms ease-in-out`
              : 'none',
        }}
        onTransitionEnd={() => {
          if (isSpinning) {
            handleTransitionEnd()
          } else {
            setIsIdleStepping(false)
          }
        }}
      >
        <defs>
          {/* Hub cutout: segments are drawn as full wedges from the center,
              then this circle masks out the middle so the fixed image hub
              (rendered in HTML, not SVG -- it must never rotate) shows
              through cleanly instead of segments crowding behind it. */}
          <mask id="lucky-wheel-hub-mask">
            <rect x={0} y={0} width={SIZE} height={SIZE} fill="#ffffff" />
            <circle cx={CENTER} cy={CENTER} r={HUB_RADIUS} fill="#000000" />
          </mask>
        </defs>

        <g mask="url(#lucky-wheel-hub-mask)">
          {shuffledSegments.map((segment, index) => {
            const startAngle = index * segmentAngle
            const endAngle = startAngle + segmentAngle
            const centerAngle = startAngle + segmentAngle / 2
            const labelPoint = pointOnCircle(centerAngle, RADIUS * 0.68)
            const lines = wrapLabel(segment.name)
            // Lines stack along the segment's own radial direction (each
            // tspan offset by dy, in the pre-rotation local frame) so the
            // whole block still reads tangentially once rotated, instead
            // of stacking lines perpendicular to the wedge and running out
            // of room even faster.
            const lineHeight = 10
            const blockOffset = -((lines.length - 1) * lineHeight) / 2

            return (
              <g key={segment.id}>
                <path
                  d={describeSegmentPath(startAngle, endAngle)}
                  fill={RARITY_COLORS[segment.rarity]}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />

                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fill={RARITY_TEXT_COLORS[segment.rarity]}
                  fontSize={9}
                  fontWeight={800}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${centerAngle}, ${labelPoint.x}, ${labelPoint.y})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {lines.map((line, lineIndex) => (
                    <tspan key={lineIndex} x={labelPoint.x} dy={lineIndex === 0 ? blockOffset : lineHeight}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            )
          })}
        </g>

        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#0f172a" strokeWidth={4} />
      </svg>

      {/* Fixed center hub -- never rotates with the wheel. Shows the
          product image (object-fit: cover) of whichever segment currently
          sits under the top pointer: it updates live during the idle
          step rotation and freezes on the winning reward's image once the
          real spin stops (product decision 2026-09-22). */}
      <div
        className="absolute left-1/2 top-1/2 z-[5] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-4 border-slate-900 bg-white"
        style={{ width: HUB_RADIUS * 2, height: HUB_RADIUS * 2 }}
      >
        {hubSegment?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- SVG-adjacent
          // fixed-size avatar, arbitrary external reward image URLs (not in
          // next.config.ts images.remotePatterns), next/image would reject
          // or require per-domain allowlisting admins can't self-serve.
          <img src={hubSegment.imageUrl} alt={hubSegment.name} className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-[10px] font-bold text-slate-900">
            {hubSegment?.name ?? ''}
          </span>
        )}
      </div>
    </div>
  )
}
