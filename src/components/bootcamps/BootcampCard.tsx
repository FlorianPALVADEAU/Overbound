'use client'

import { useState } from 'react'
import { MapPin, Calendar, Clock, ChevronDown, ChevronUp, Loader2, Flame, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Bootcamp } from '@/types/Bootcamp'

function SocialProof({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Zap className="h-3 w-3 text-amber-500" />
        Sois le·la premier·e à te lancer !
      </span>
    )
  }

  const isPopular = count > 12

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {isPopular
        ? <Flame className="h-3 w-3 text-red-500" />
        : <TrendingUp className="h-3 w-3 text-emerald-500" />}
      {isPopular ? 'Très prisé — rejoins le groupe !' : 'Le groupe se forme — rejoins-les !'}
    </span>
  )
}

interface BootcampCardProps {
  bootcamp: Bootcamp
  isAuthenticated: boolean
  onRegister: (id: string) => Promise<void>
  onUnregister: (id: string) => Promise<void>
}

export function BootcampCard({ bootcamp, isAuthenticated, onRegister, onUnregister }: BootcampCardProps) {
  const [loading, setLoading] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  const formattedDate = new Date(bootcamp.starts_at).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  })

  const formattedTime = new Date(bootcamp.starts_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  })

  const isPast = new Date(bootcamp.starts_at) < new Date()

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (bootcamp.is_registered) {
        await onUnregister(bootcamp.id)
      } else {
        await onRegister(bootcamp.id)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-lg shadow-primary/5 transition hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 sm:flex-row">
      {/* Image */}
      <div className="relative h-52 shrink-0 overflow-hidden sm:h-auto sm:w-64 md:w-72">
        {bootcamp.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bootcamp.image_url}
            alt={bootcamp.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent to-background/30 sm:bg-linear-to-r" />

        {/* Badge statut */}
        <div className="absolute left-3 top-3 flex gap-2">
          {isPast && (
            <Badge variant="secondary" className="bg-black/70 text-white">
              Terminé
            </Badge>
          )}
          {bootcamp.is_registered && !isPast && (
            <Badge className="bg-primary text-primary-foreground">
              Inscrit·e ✓
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{bootcamp.title}</h2>
          <SocialProof count={bootcamp.registration_count ?? 0} />
        </div>

        {/* Description */}
        {bootcamp.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {bootcamp.description}
          </p>
        ) : null}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span className="capitalize">{formattedDate}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            {formattedTime}
          </span>
          <span className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {bootcamp.location_name}
              {bootcamp.location_address ? (
                <span className="block text-xs text-muted-foreground/70">{bootcamp.location_address}</span>
              ) : null}
            </span>
          </span>
        </div>

        {/* Carte Google Maps (accordéon) */}
        {bootcamp.lat && bootcamp.lng ? (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition"
              onClick={() => setMapOpen((prev) => !prev)}
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Voir sur la carte
              </span>
              {mapOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {mapOpen && (
              <iframe
                title={`Carte ${bootcamp.location_name}`}
                src={`https://maps.google.com/maps?q=${bootcamp.lat},${bootcamp.lng}&z=14&output=embed`}
                className="h-52 w-full border-0"
                loading="lazy"
                allowFullScreen
              />
            )}
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-auto pt-1">
          {isPast ? (
            <Button variant="outline" disabled size="sm">
              Bootcamp terminé
            </Button>
          ) : isAuthenticated ? (
            <Button
              onClick={handleToggle}
              disabled={loading}
              variant={bootcamp.is_registered ? 'outline' : 'default'}
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {bootcamp.is_registered ? "Se désinscrire" : "S'inscrire gratuitement"}
            </Button>
          ) : (
            <Button asChild size="sm">
              <a href="/auth/login?next=/bootcamps">
                Se connecter pour s'inscrire
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
