import type { ReactNode, Ref } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Full-bleed band that gives every page its rhythm (docs/design/design-system.md).
 * Generalizes the event-page LandingBand: same tones, plus a deep tone for the
 * final call to action, a fixed vertical spacing scale and the mountain edge.
 */
export type SectionTone = 'default' | 'deep' | 'light' | 'primary'
export type SectionSpacing = 'none' | 'compact' | 'default' | 'spacious'
export type SectionEdge = 'none' | 'angled' | 'mountain'

const TONE_CLASS: Record<SectionTone, string> = {
  default: 'bg-background text-foreground',
  deep: 'bg-surface-deep text-foreground',
  light: 'tone-light bg-background text-foreground',
  primary: 'tone-primary bg-primary text-primary-foreground',
}

const OVERLAY_CLASS: Record<SectionTone, string> = {
  default: 'bg-background/85',
  deep: 'bg-surface-deep/90',
  light: 'bg-background/90',
  primary: 'bg-primary/80 mix-blend-multiply',
}

export const SECTION_SPACING: Record<SectionSpacing, string> = {
  none: '',
  compact: 'py-12 sm:py-16',
  default: 'py-16 sm:py-20 lg:py-24',
  spacious: 'py-20 sm:py-28',
}

// The diagonal (1.5rem, 2.5rem from sm) stays inside the spacing scale padding.
const ANGLED_CLASS =
  '[clip-path:polygon(0_1.5rem,100%_0,100%_calc(100%-1.5rem),0_100%)] sm:[clip-path:polygon(0_2.5rem,100%_0,100%_calc(100%-2.5rem),0_100%)]'

interface Props {
  tone?: SectionTone
  spacing?: SectionSpacing
  edge?: SectionEdge
  /** Photo behind the content, with a tinted overlay that keeps text readable. */
  backgroundSrc?: string
  id?: string
  className?: string
  /** For effects that track the band itself (e.g. parallax). */
  ref?: Ref<HTMLElement>
  children: ReactNode
}

/** Height of the mountain edge; also reserved as extra padding (EdgeSpacer), so
 * the gap between content and the peaks matches the spacing scale. */
// z-10 + negative margins slide the silhouette over half of the neighbours' own
// padding (they are dark too), so the dark gap beside the peaks stays balanced.
const EDGE_HEIGHT_VAR =
  'z-10 -my-[calc(var(--edge-h)/2)] [--edge-h:2.5rem] sm:[--edge-h:3.5rem] lg:[--edge-h:5rem]'

/** Dark mountain silhouette on the top and bottom edges of a band. */
function MountainEdges() {
  return (
    <>
      <div aria-hidden className="edge-mountain pointer-events-none absolute inset-x-0 -top-px h-(--edge-h) rotate-180 bg-surface-base" />
      <div aria-hidden className="edge-mountain pointer-events-none absolute inset-x-0 -bottom-px h-(--edge-h) bg-surface-base" />
    </>
  )
}

const EdgeSpacer = () => <div aria-hidden className="h-(--edge-h)" />

export function Section({
  tone = 'default',
  spacing = 'default',
  edge = 'none',
  backgroundSrc,
  id,
  className,
  ref,
  children,
}: Props) {
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'relative isolate scroll-mt-4 overflow-clip',
        TONE_CLASS[tone],
        SECTION_SPACING[spacing],
        edge === 'angled' && ANGLED_CLASS,
        edge === 'mountain' && EDGE_HEIGHT_VAR,
        className,
      )}
    >
      {backgroundSrc ? (
        <div className="absolute inset-0 -z-10" aria-hidden>
          <Image src={backgroundSrc} alt="" fill sizes="100vw" className="object-cover" />
          <div className={cn('absolute inset-0', OVERLAY_CLASS[tone])} />
        </div>
      ) : null}
      {edge === 'mountain' ? <MountainEdges /> : null}
      {edge === 'mountain' ? <EdgeSpacer /> : null}
      {children}
      {edge === 'mountain' ? <EdgeSpacer /> : null}
    </section>
  )
}
