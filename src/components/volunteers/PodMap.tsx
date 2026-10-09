'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { COURSE_PATH, COURSE_VIEWBOX as COURSE_BOX } from '@/constants/coursePath'
import { cn } from '@/lib/utils'
import { DEFAULT_MISSION, podCatalog, type PodKey } from '@/lib/volunteers/shared/Pod'

// Où se trouve chaque poste : `at` = position sur le tracé (0 = départ, 1 = arrivée),
// `xy` = coordonnées libres dans le village. Plan indicatif.
type PodPlacement = { at: number } | { xy: readonly [number, number] }

const PLACEMENT: Record<PodKey, PodPlacement> = {
  obstacles: { at: 0.33 },
  ravito: { at: 0.94 },
  arrivee: { at: 0.985 },
  accueil: { xy: [20, 630] },
  consignes: { xy: [170, 655] },
  sponsors: { xy: [320, 630] },
}

// Le plan prolonge le cadre du parcours vers le bas pour loger le village sous le départ.
const COURSE_VIEWBOX = { ...COURSE_BOX, height: COURSE_BOX.height + 110 } as const
const VILLAGE_BOX = { x: -20, y: 570, width: 410, height: 160 } as const
const OBSTACLE_DOTS = [0.06, 0.15, 0.24, 0.33, 0.42, 0.52, 0.62, 0.71, 0.8, 0.89] as const

interface Point {
  x: number
  y: number
}

const toPercent = ({ x, y }: Point) => ({
  left: `${((x - COURSE_VIEWBOX.x) / COURSE_VIEWBOX.width) * 100}%`,
  top: `${((y - COURSE_VIEWBOX.y) / COURSE_VIEWBOX.height) * 100}%`,
})

interface PodMapProps {
  selected: string
  onSelect: (podTitle: string) => void
}

export function PodMap({ selected, onSelect }: PodMapProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pins, setPins] = useState<Partial<Record<PodKey, Point>>>({})
  const [dots, setDots] = useState<Point[]>([])

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const length = path.getTotalLength()
    const onPath = (ratio: number): Point => {
      const { x, y } = path.getPointAtLength(ratio * length)
      return { x, y }
    }
    setPins(
      Object.fromEntries(
        podCatalog.all().map((pod) => {
          const placement = PLACEMENT[pod.key]
          return [pod.key, 'at' in placement ? onPath(placement.at) : { x: placement.xy[0], y: placement.xy[1] }]
        }),
      ),
    )
    setDots(OBSTACLE_DOTS.map(onPath))
  }, [])

  const obstaclesLit = podCatalog.findByTitle(selected)?.key === 'obstacles'

  return (
    <div className="relative w-full" style={{ aspectRatio: `${COURSE_VIEWBOX.width} / ${COURSE_VIEWBOX.height}` }}>
      <svg
        viewBox={`${COURSE_VIEWBOX.x} ${COURSE_VIEWBOX.y} ${COURSE_VIEWBOX.width} ${COURSE_VIEWBOX.height}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Plan indicatif du parcours et du village avec les six postes bénévoles"
      >
        <path ref={pathRef} d={COURSE_PATH} fill="none" stroke="white" strokeOpacity={0.14} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
        <path d={COURSE_PATH} fill="none" strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" className="stroke-white/40" />
        <rect
          {...VILLAGE_BOX}
          rx={24}
          fill="white"
          fillOpacity={0.04}
          stroke="white"
          strokeOpacity={0.25}
          strokeWidth={3}
          strokeDasharray="10 10"
        />
        <text x={VILLAGE_BOX.x + VILLAGE_BOX.width - 20} y={VILLAGE_BOX.y + 32} textAnchor="end" fontSize={22} fontWeight={900} letterSpacing={3} className="fill-white/50">
          VILLAGE
        </text>
        {dots.map((dot, index) => (
          <circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={obstaclesLit ? 12 : 8}
            className={cn('transition-all duration-300 motion-reduce:transition-none', obstaclesLit ? 'fill-primary' : 'fill-neutral-700')}
          />
        ))}
      </svg>

      {podCatalog.all().map((pod, index) => {
        const point = pins[pod.key]
        if (!point) return null
        const active = pod.title === selected
        const labelAbove = pod.key === 'ravito'
        const labelRight = point.x > COURSE_VIEWBOX.x + COURSE_VIEWBOX.width * 0.6
        return (
          <button
            key={pod.key}
            type="button"
            aria-pressed={active}
            aria-label={`Poste : ${pod.title}`}
            onClick={() => onSelect(pod.title)}
            style={toPercent(point)}
            className={cn(
              'group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-black outline-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-white/60 motion-reduce:transition-none',
              active ? 'scale-110 border-white bg-primary text-primary-foreground' : 'border-white/60 bg-neutral-900 text-white hover:scale-110 hover:border-primary',
            )}
          >
            {active ? (
              <>
                <span className="absolute inset-0 -z-10 rounded-full bg-primary/50 motion-safe:animate-ping" aria-hidden />
                <Check className="h-5 w-5" aria-hidden />
              </>
            ) : (
              <span aria-hidden>{index + 1}</span>
            )}
            <span
              className={cn(
                'pointer-events-none absolute w-20 rounded-md bg-black/80 px-1.5 py-1 text-[11px] font-bold leading-tight text-white',
                labelAbove ? 'bottom-full mb-2' : 'top-full mt-2',
                labelRight ? 'right-0 text-right' : 'left-1/2 -translate-x-1/2 text-center',
                active && 'bg-primary text-primary-foreground',
              )}
            >
              {pod.title}
            </span>
          </button>
        )
      })}

      <button
        type="button"
        aria-pressed={selected === DEFAULT_MISSION}
        onClick={() => onSelect(DEFAULT_MISSION)}
        className={cn(
          'absolute right-0 top-0 z-10 min-h-11 rounded-full border px-4 text-xs font-black uppercase tracking-wide outline-none transition-colors focus-visible:ring-4 focus-visible:ring-white/60 motion-reduce:transition-none',
          selected === DEFAULT_MISSION ? 'border-primary bg-primary text-primary-foreground' : 'border-white/30 bg-neutral-900/90 text-white hover:border-primary',
        )}
      >
        Surprends-moi
      </button>
    </div>
  )
}
