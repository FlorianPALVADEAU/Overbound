'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { useGetObstacles } from '@/app/api/obstacles/obstaclesQueries'
import { cn } from '@/lib/utils'
import { RANKED_LAP_TIME_LIMITS } from '@/constants/raceFormatRules'
import { COURSE_PATH } from '@/constants/coursePath'


// Ordre réel sur le parcours. `at` = position sur le tracé (0 = départ, 1 = arrivée).
// `dbName` = nom de l'obstacle en base : la photo vient de `obstacles.image_url`.
const OBSTACLES = [
  { name: 'Wall over', at: 0.06, dbName: 'Par dessus, par dessous' },
  { name: "Farmer's carry", at: 0.15, dbName: 'Farmer Carry' },
  { name: 'Rondins', at: 0.24, dbName: 'Rondins de bois' },
  { name: "Poutres d'équilibre", at: 0.33, dbName: 'Equilibre sur poutre' },
  { name: 'Chain carry', at: 0.42, dbName: 'Chaînes' },
  { name: 'Monkey bars', at: 0.52, dbName: 'Échelles suspendues' },
  { name: 'Wall under', at: 0.62, dbName: 'Par dessus, par dessous' },
  { name: 'Barbelé', at: 0.71, dbName: 'Barbelés' },
  { name: 'Tire flip', at: 0.8, dbName: 'Renversé de pneus' },
  { name: 'Tire drag', at: 0.89, dbName: 'Tiré de pneu' },
] as const

const GLIDE_SECONDS = 0.7
const HOLD_AFTER_PICK_SECONDS = 5

// Le coureur marque une pause sur chaque obstacle : le temps de lire la photo.
const MOVE_SECONDS = 0.5
const DWELL_SECONDS = 0.7
const FIRST_MOVE_SECONDS = 0.6
const LAST_MOVE_SECONDS = 1

interface Segment {
  start: number
  duration: number
  from: number
  to: number
}

const TIMELINE: { segments: Segment[]; total: number } = (() => {
  const segments: Segment[] = []
  let time = 0
  let position = 0
  const push = (duration: number, to: number) => {
    segments.push({ start: time, duration, from: position, to })
    time += duration
    position = to
  }
  OBSTACLES.forEach((obstacle, index) => {
    push(index === 0 ? FIRST_MOVE_SECONDS : MOVE_SECONDS, obstacle.at)
    push(DWELL_SECONDS, obstacle.at)
  })
  push(LAST_MOVE_SECONDS, 1)
  return { segments, total: time }
})()

const DWELL_START = OBSTACLES.map(
  (obstacle) =>
    TIMELINE.segments.find((seg) => seg.from === obstacle.at && seg.to === obstacle.at)?.start ?? 0,
)

const ease = (ratio: number) => ratio * ratio * (3 - 2 * ratio)

const progressAt = (elapsed: number) => {
  const t = elapsed % TIMELINE.total
  const segment = TIMELINE.segments.find((s) => t < s.start + s.duration) ?? TIMELINE.segments[0]
  const ratio = Math.min((t - segment.start) / segment.duration, 1)
  return segment.from + (segment.to - segment.from) * ease(ratio)
}

interface Point {
  x: number
  y: number
}

export function ConceptExplainer() {
  const sectionRef = useRef<HTMLElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const progressRef = useRef<SVGPathElement>(null)
  const runnerRef = useRef<SVGGElement>(null)
  const pickRef = useRef<(index: number) => void>(() => {})
  const [points, setPoints] = useState<Point[]>([])
  const [active, setActive] = useState(-1)
  const [lap, setLap] = useState(1)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(new Set())
  const { data: dbObstacles, isLoading: obstaclesLoading } = useGetObstacles()
  const shown = Math.max(active, 0)

  const imageUrls = OBSTACLES.map(
    (obstacle) => dbObstacles?.find((o) => o.name === obstacle.dbName)?.image_url ?? null,
  )

  // Position des pastilles : calculée sur le vrai tracé, donc toujours collée dessus.
  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const length = path.getTotalLength()
    setPoints(
      OBSTACLES.map(({ at }) => {
        const { x, y } = path.getPointAtLength(at * length)
        return { x, y }
      }),
    )
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // Le coureur ne tourne que quand la section est visible.
  useEffect(() => {
    const section = sectionRef.current
    const path = pathRef.current
    const progress = progressRef.current
    const runner = runnerRef.current
    if (!section || !path || !progress || !runner) return

    const length = path.getTotalLength()
    progress.style.strokeDasharray = `${length} ${length}`

    let currentActive = -1
    const render = (p: number) => {
      progress.style.strokeDashoffset = String(length * (1 - p))
      const { x, y } = path.getPointAtLength(p * length)
      runner.setAttribute('transform', `translate(${x} ${y})`)
      let next = -1
      OBSTACLES.forEach((obstacle, index) => {
        if (p >= obstacle.at) next = index
      })
      if (next !== currentActive) {
        currentActive = next
        setActive(next)
      }
    }

    if (reducedMotion) {
      progress.style.strokeDashoffset = '0'
      runner.style.display = 'none'
      pickRef.current = (index) => {
        progress.style.strokeDashoffset = String(length * (1 - OBSTACLES[index].at))
        currentActive = index
        setActive(index)
      }
      return
    }
    runner.style.display = ''

    let frame = 0
    let visible = false
    let timeInLap = 0
    let currentLap = 1
    let last = 0
    let currentP = 0
    // Après un clic : le coureur glisse jusqu'à l'obstacle, puis la boucle reprend de là.
    let glide: { from: number; to: number; start: number; index: number } | null = null
    let holdUntil = 0

    const tick = (now: number) => {
      if (!visible) return
      const dt = (now - last) / 1000
      last = now

      if (glide) {
        const ratio = Math.min((now - glide.start) / (GLIDE_SECONDS * 1000), 1)
        currentP = glide.from + (glide.to - glide.from) * ease(ratio)
        if (ratio >= 1) {
          currentP = glide.to
          timeInLap = DWELL_START[glide.index]
          holdUntil = now + HOLD_AFTER_PICK_SECONDS * 1000
          glide = null
        }
      } else if (now >= holdUntil) {
        timeInLap += dt
        if (timeInLap >= TIMELINE.total) {
          timeInLap -= TIMELINE.total
          currentLap += 1
          setLap(currentLap)
        }
        currentP = progressAt(timeInLap)
      }
      render(currentP)
      frame = requestAnimationFrame(tick)
    }

    pickRef.current = (index) => {
      glide = { from: currentP, to: OBSTACLES[index].at, start: performance.now(), index }
      if (!visible) {
        visible = true
        last = performance.now()
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(tick)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        cancelAnimationFrame(frame)
        if (visible) {
          last = performance.now()
          frame = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.25 },
    )
    observer.observe(section)
    render(0)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [reducedMotion])

  const pick = (index: number) => pickRef.current(index)

  return (
    <section
      ref={sectionRef}
      id="concept"
      className="relative w-full overflow-hidden bg-neutral-950 py-16 text-white sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_42%,rgba(38,170,38,0.22),transparent_70%),radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1.5px)] bg-size-[100%_100%,22px_22px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/15 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 xl:px-32">
        <p className="text-center text-xs font-black uppercase tracking-[0.3em] text-primary">
          Le parcours
        </p>
        <h2 className="mt-3 text-balance wrap-break-word text-center text-3xl font-black sm:text-4xl">
          Une boucle de 2 km, autant de tours que tu veux
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-gray-300 sm:text-base">
          10 obstacles à enchaîner, dans le sens des aiguilles d&apos;une montre. Tu boucles un
          tour, tu choisis si tu repars. La première organisation OCR où tu choisis ton niveau de
          défi sur le même parcours.
        </p>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
          <div className="relative">
            <div className="mb-1 flex items-baseline justify-end gap-3" aria-hidden="true">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">
                Tour
              </p>
              <p
                key={lap}
                className="animate-in zoom-in-50 fade-in text-5xl font-black leading-none tabular-nums text-primary duration-300 sm:text-6xl"
              >
                {lap}
              </p>
            </div>
            <svg
              viewBox="-30 -40 1076 694"
              className="h-auto w-full"
              role="img"
              aria-label="Plan du parcours Overbound : une boucle avec 10 obstacles numérotés, du départ en bas à gauche dans le sens des aiguilles d'une montre"
            >
              <path
                ref={pathRef}
                d={COURSE_PATH}
                fill="none"
                stroke="white"
                strokeOpacity={0.14}
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                ref={progressRef}
                d={COURSE_PATH}
                fill="none"
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary"
              />

              <text
                x={60}
                y={548}
                fontSize={24}
                fontWeight={900}
                className="fill-white/70"
                letterSpacing={2}
              >
                DÉPART · ARRIVÉE
              </text>

              {points.map((point, index) => (
                <g
                  key={`${OBSTACLES[index].name}-${index}`}
                  transform={`translate(${point.x} ${point.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Obstacle ${index + 1} : ${OBSTACLES[index].name}`}
                  aria-current={index === active ? 'true' : undefined}
                  onClick={() => pick(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      pick(index)
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>circle:nth-child(2)]:stroke-primary"
                >
                  <circle r={56} fill="transparent" />
                  <circle
                    r={26}
                    className={cn(
                      'transition-colors duration-300',
                      index === active
                        ? 'fill-primary stroke-white'
                        : 'fill-neutral-900 stroke-white/40',
                    )}
                    strokeWidth={3}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={28}
                    fontWeight={900}
                    className="fill-white"
                  >
                    {index + 1}
                  </text>
                </g>
              ))}

              <g ref={runnerRef}>
                <circle r={20} className="fill-primary/30" />
                <circle r={11} className="fill-white stroke-primary" strokeWidth={4} />
              </g>
            </svg>

          </div>

          <div className="mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-neutral-900 lg:aspect-4/5">
              {OBSTACLES.map((obstacle, index) => {
                const url = imageUrls[index]
                if (!url || failedImages.has(url)) return null
                return (
                  // eslint-disable-next-line @next/next/no-img-element -- l'URL vient de la base, host non maîtrisé
                  <img
                    key={`${obstacle.name}-${index}`}
                    src={url}
                    alt=""
                    loading="lazy"
                    onError={() => setFailedImages((prev) => new Set(prev).add(url))}
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover object-[50%_25%] transition-opacity duration-300 motion-reduce:transition-none',
                      index === shown ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                )
              })}
              {!obstaclesLoading &&
                (!imageUrls[shown] || failedImages.has(imageUrls[shown] as string)) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pb-16 text-white/50">
                    <Camera className="h-8 w-8" aria-hidden="true" />
                    <p className="text-xs font-black uppercase tracking-[0.25em]">Photo à venir</p>
                  </div>
                )}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/20 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5" aria-hidden="true">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                  {active >= 0 ? `Obstacle ${active + 1} / ${OBSTACLES.length}` : 'Départ'}
                </p>
                <p className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
                  {OBSTACLES[shown].name}
                </p>
              </div>
            </div>
            <div className="mt-1 flex gap-1">
              {OBSTACLES.map((obstacle, index) => (
                <button
                  key={`${obstacle.name}-${index}`}
                  type="button"
                  onClick={() => pick(index)}
                  aria-label={`Aller à l'obstacle ${index + 1} : ${obstacle.name}`}
                  aria-current={index === active ? 'true' : undefined}
                  className="group flex h-11 flex-1 cursor-pointer items-center"
                >
                  <span
                    className={cn(
                      'h-1 w-full rounded-full transition-colors duration-300 group-hover:bg-primary/70 group-focus-visible:bg-primary/70',
                      index <= active ? 'bg-primary' : 'bg-white/15',
                    )}
                  />
                </button>
              ))}
            </div>
            <ol className={reducedMotion ? 'mt-2 grid grid-cols-2 gap-x-6 text-sm' : 'sr-only'}>
              {OBSTACLES.map((obstacle, index) => (
                <li key={`${obstacle.name}-${index}`} className="border-b border-white/10 py-2 text-gray-300">
                  {index + 1}. {obstacle.name}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <dl className="mt-10 grid divide-y divide-white/10 border-y border-white/10 text-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="py-4 sm:pr-6">
            <dt className="text-xs font-black uppercase tracking-[0.2em] text-primary">OPEN</dt>
            <dd className="mt-1 text-gray-300">
              <span className="font-bold text-white">Sans limite de temps.</span> Autant de tours que
              tu veux, à ton rythme.
            </dd>
          </div>
          <div className="py-4 sm:pl-6">
            <dt className="text-xs font-black uppercase tracking-[0.2em] text-primary">RANKED</dt>
            <dd className="mt-1 text-gray-300">
              <span className="font-bold text-white">Un chrono par tour.</span>{' '}
              {RANKED_LAP_TIME_LIMITS.firstLapMinutes} min au 1er,{' '}
              {RANKED_LAP_TIME_LIMITS.midLapsMinutes} min aux tours 2 à{' '}
              {RANKED_LAP_TIME_LIMITS.lateLapStartsAt - 1}, {RANKED_LAP_TIME_LIMITS.lateLapMinutes} min
              dès le {RANKED_LAP_TIME_LIMITS.lateLapStartsAt}e.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
