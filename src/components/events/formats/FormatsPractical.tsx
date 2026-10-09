import { Apple, CalendarCheck, Dumbbell, Route, Shirt } from 'lucide-react'
import { PRACTICAL_INFOS } from './content'

const ICONS = [Route, Dumbbell, CalendarCheck, Shirt, Apple]

/** Plain list with hairline dividers: no boxes, reads top to bottom on mobile. */
export function FormatsPractical() {
  return (
    <ul className="divide-y divide-border/60 border-y border-border/60">
      {PRACTICAL_INFOS.map((info, i) => {
        const Icon = ICONS[i % ICONS.length]
        return (
          <li key={info.title} className="flex items-start gap-4 py-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 sm:flex sm:flex-1 sm:items-baseline sm:gap-6">
              <p className="font-bold sm:w-48 sm:shrink-0">{info.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground sm:mt-0">{info.text}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
