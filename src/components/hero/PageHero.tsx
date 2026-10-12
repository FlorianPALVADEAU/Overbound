import type { ReactNode } from 'react'
import { Container, DISPLAY_TITLE, Eyebrow } from '@/components/ds'
import { cn } from '@/lib/utils'
import { HeroFrame } from './HeroFrame'

interface Props {
  image: Parameters<typeof HeroFrame>[0]['image']
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  /** Buttons or links under the description. */
  actions?: ReactNode
  /** Optional panel next to the text on large screens. */
  aside?: ReactNode
  id?: string
}

/** Standard page banner: eyebrow, title, short text, actions. Same height on every page. */
export function PageHero({ image, eyebrow, title, description, actions, aside, id }: Props) {
  return (
    <HeroFrame image={image} id={id}>
      <Container className={cn('grid min-w-0 items-center gap-10 py-10 sm:py-16', aside && 'lg:grid-cols-[1.3fr_0.7fr]')}>
        <div className="min-w-0 max-w-3xl space-y-4 text-center lg:text-left">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className={cn(DISPLAY_TITLE, 'text-display-lg')}>{title}</h1>
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
