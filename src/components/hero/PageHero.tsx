import type { ReactNode } from 'react'
import { Container, DISPLAY_TITLE, Eyebrow, type EyebrowVariant } from '@/components/ds'
import { cn } from '@/lib/utils'
import { HeroFrame, type HeroVariant } from './HeroFrame'

interface Props {
  image: Parameters<typeof HeroFrame>[0]['image']
  /** `compact` shortens the banner so the page content starts above the fold. */
  variant?: HeroVariant
  eyebrow?: string
  /** `pill-soft` keeps the eyebrow readable on a light photo. */
  eyebrowVariant?: EyebrowVariant
  /** `lg` (default) for article-length titles, `xl` for a short index title that deserves the largest banner. */
  titleSize?: 'lg' | 'xl'
  title: ReactNode
  description?: ReactNode
  /** Buttons or links under the description. */
  actions?: ReactNode
  /** Optional panel next to the text on large screens. */
  aside?: ReactNode
  id?: string
}

const TITLE_SIZE = { lg: 'text-display-lg', xl: 'text-display-xl' } as const

/** Standard page banner: eyebrow, title, short text, actions. Same height on every page. */
export function PageHero({ image, variant, eyebrow, eyebrowVariant, titleSize = 'lg', title, description, actions, aside, id }: Props) {
  return (
    <HeroFrame image={image} variant={variant} id={id}>
      <Container className={cn('grid min-w-0 items-center gap-10 py-10 sm:py-16', aside && 'lg:grid-cols-[1.3fr_0.7fr]')}>
        <div className="min-w-0 max-w-3xl space-y-4 text-center lg:text-left">
          {eyebrow ? (
            <Eyebrow variant={eyebrowVariant} className={cn(eyebrowVariant && eyebrowVariant !== 'text' && 'mx-auto lg:mx-0')}>
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h1 className={cn(DISPLAY_TITLE, TITLE_SIZE[titleSize])}>{title}</h1>
          {description ? (
            <div className="space-y-3 text-lead text-foreground/80">{description}</div>
          ) : null}
          {actions ? (
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center lg:justify-start">{actions}</div>
          ) : null}
        </div>
        {aside ? <div className="hidden min-w-0 lg:block">{aside}</div> : null}
      </Container>
    </HeroFrame>
  )
}
