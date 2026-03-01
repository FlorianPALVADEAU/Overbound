import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, CalendarDays, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/types/Event'

interface RegistrationHeaderProps {
  event: Event
  availableSpots: number
  isAuthenticated: boolean
}

export default function RegistrationHeader({
  event,
  availableSpots,
  isAuthenticated,
}: RegistrationHeaderProps) {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Inscription à {event.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(event.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
            <Separator orientation="vertical" className="hidden h-4 md:block" />
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {availableSpots > 0 ? 'Places limitées' : 'Complet'}
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/events/${event.id}`}>Retour à l&apos;événement</Link>
        </Button>
      </div>

      {!isAuthenticated && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous devez être connecté pour poursuivre votre inscription.{' '}
            <a href={`/auth/login?next=/events/${event.id}`} className="underline">
              Se connecter
            </a>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
