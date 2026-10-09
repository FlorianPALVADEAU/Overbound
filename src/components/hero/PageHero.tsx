import type { ReactNode } from 'react'
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
      <div
        className={
          'mx-auto grid w-full min-w-0 max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8 ' +
          (aside ? 'lg:grid-cols-[1.3fr_0.7fr]' : '')
        }
      >
        <div className="min-w-0 max-w-3xl space-y-4 text-center lg:text-left">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-balance wrap-break-word text-3xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80 sm:text-lg">{description}</div>
          ) : null}
          {actions ? (
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center lg:justify-start">{actions}</div>
          ) : null}
        </div>
        {aside ? <div className="hidden min-w-0 lg:block">{aside}</div> : null}
      </div>
    </HeroFrame>
  )
}
