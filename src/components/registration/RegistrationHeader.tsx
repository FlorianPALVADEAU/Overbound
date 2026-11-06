import { Separator } from '@/components/ui/separator'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import type { Event } from '@/types/Event'
import { DISPLAY_TITLE, Eyebrow } from '@/components/ds'
import { cn } from '@/lib/utils'

interface RegistrationHeaderProps {
  event: Event
  availableSpots: number
}

export default function RegistrationHeader({
  event,
  availableSpots,
}: RegistrationHeaderProps) {
  return (
    <div className="border-b border-border pb-6">
      <div className="space-y-1">
        <Eyebrow>Inscription</Eyebrow>
        <h1 className={cn(DISPLAY_TITLE, 'text-display-md')}>{event.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(event.date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <Separator orientation="vertical" className="hidden h-3 md:block" />
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
          <Separator orientation="vertical" className="hidden h-3 md:block" />
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {availableSpots > 0
              ? `${availableSpots.toLocaleString('fr-FR')} place${availableSpots > 1 ? 's' : ''} restante${availableSpots > 1 ? 's' : ''}`
              : 'Complet'}
          </span>
        </div>
      </div>
    </div>
  )
}
