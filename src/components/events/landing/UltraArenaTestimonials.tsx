'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Pause, Play, Star, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { testimonials, TestimonialType } from '@/datas/Testimonials'
import { useCarouselAutoplay } from '@/hooks/useCarouselAutoplay'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { Container, SectionHeader, SECTION_SPACING } from '@/components/ds'
import { cn } from '@/lib/utils'
import { testimonialPosterUrl } from '@/lib/testimonials/testimonialPoster'

const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
    />
  ))

function VideoCard({
  testimonial,
  canLoad,
  onPlay,
}: {
  testimonial: TestimonialType
  canLoad: boolean
  onPlay: (id: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const posterUrl = testimonialPosterUrl(testimonial.mediaUrl)
  const id = testimonial.id.toString()

  useEffect(() => {
    const video = videoRef.current
    if (!video || !canLoad) return
    // Reduced motion: no autoplay, only the video the visitor started plays.
    if (!isPaused && (!prefersReducedMotion || isActive)) void video.play()
  }, [canLoad, isPaused, prefersReducedMotion, isActive])

  const handlePlay = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    setIsActive(true)
    setIsMuted(false)
    setIsPaused(false)
    onPlay(id)
    void video.play()
  }

  const handlePause = () => {
    videoRef.current?.pause()
    setIsPaused(true)
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface-deep shadow-xl">
      {/* Video area */}
      <div
        className="group relative min-h-72 w-full flex-1 overflow-hidden sm:min-h-80"
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted={isActive ? isMuted : true}
          playsInline
          preload="none"
          autoPlay={!prefersReducedMotion}
          poster={posterUrl}
          onEnded={() => setIsMuted(true)}
        >
          {canLoad && (
            <>
              <source src={testimonial.mediaUrl} type="video/webm" />
              <source src={testimonial.mediaUrl.replace('.webm', '.mp4')} type="video/mp4" />
            </>
          )}
        </video>

        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isActive ? 'bg-transparent' : 'bg-black/40 hover:bg-black/25'
          }`}
        />

        {/* Play / Pause: always reachable by keyboard and touch */}
        {(
          isActive && !isPaused ? (
            <Button
              onClick={(e) => { e.stopPropagation(); handlePause() }}
              aria-label="Mettre la vidéo en pause"
              className="opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 group-focus-within:opacity-100 absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            >
              <Pause className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              onClick={(e) => { e.stopPropagation(); handlePlay() }}
              aria-label="Lire la vidéo avec le son"
              className="opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 group-focus-within:opacity-100 absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            >
              <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
            </Button>
          )
        )}

        {/* Mute toggle */}
        {isActive && (
          <Button
            onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m) }}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            className="opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 group-focus-within:opacity-100 absolute right-3 top-3 size-11 cursor-pointer rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
          >
            {isMuted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
          </Button>
        )}
      </div>

      {/* Comment overlay card */}
      <div className="absolute bottom-5 left-1/2 w-[90%] -translate-x-1/2 tone-light rounded-xl bg-card/95 p-4 text-card-foreground shadow-xl">
        <div className="mb-2 flex items-center gap-1.5">
          {renderStars(testimonial.rating)}
          <span className="text-xs font-medium text-muted-foreground">{testimonial.rating}/5</span>
        </div>
        {testimonial.comment && (
          <p className="mb-3 line-clamp-3 text-sm leading-snug text-foreground">
            "{testimonial.comment}"
          </p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">{testimonial.name}</p>
            <p className="text-xs text-muted-foreground">
              {testimonial.age} ans • {testimonial.location}
            </p>
          </div>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            ✓ Vérifié
          </span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  onVideoPlay?: (id: string) => void
  isOnSale?: boolean
  registerHref?: string
  onCtaClick?: () => void
}

export function UltraArenaTestimonials({ onVideoPlay, isOnSale = false, registerHref = '#departs', onCtaClick }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [canLoad, setCanLoad] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  // Rotation stops for good once a visitor starts a video.
  useCarouselAutoplay(carouselApi, 5000, { paused: videoStarted })

  // Lazy-load media when section enters viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setCanLoad(true)
        observer.disconnect()
      },
      { rootMargin: '400px 0px', threshold: 0.01 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Only video testimonials (all 5 available)
  const videoTestimonials = testimonials.filter((t) => t.mediaUrl)

  return (
    <section ref={sectionRef} className={cn('relative', SECTION_SPACING.default)}>
      <Container>
        {/* Header */}
        <div className="mb-10 max-w-2xl sm:mb-12">
          <SectionHeader
            eyebrow="Ils en parlent mieux que nous"
            title="Ils ont hésité. Puis ils ont pris leur place."
            lead={<>Comme toi, ils ne savaient pas à quoi s&apos;attendre.</>}
            flush
          />
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {renderStars(5)}
            </div>
            <span className="text-sm font-semibold text-foreground">5/5</span>
            <span className="text-sm text-muted-foreground">
              · {videoTestimonials.length} témoignages vidéo vérifiés
            </span>
          </div>
          <div className="mt-4">
            {isOnSale ? (
              <Button asChild size="cta" onClick={onCtaClick}>
                <Link href={registerHref}>Je m&apos;inscris maintenant</Link>
              </Button>
            ) : (
              <Button asChild size="cta" variant="outline" onClick={onCtaClick}>
                <a href="#formats">Voir si c&apos;est pour moi</a>
              </Button>
            )}
          </div>
        </div>

        {/* Carousel — same pattern as homepage SocialProof */}
        <Carousel
          className="w-full"
          opts={{ align: 'start', loop: false }}
          setApi={setCarouselApi}
        >
          <CarouselContent className="-ml-3 pb-6 md:-ml-4 md:pb-20">
            {videoTestimonials.map((t) => (
              <CarouselItem
                key={t.id.toString()}
                className="h-104 basis-[88%] pl-3 sm:h-112 sm:basis-[55%] md:pl-4 md:basis-[40%] lg:basis-[32%]"
              >
                <VideoCard
                  testimonial={t}
                  canLoad={canLoad}
                  onPlay={(id) => {
                    setVideoStarted(true)
                    onVideoPlay?.(id)
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="bottom-4 left-4 top-auto cursor-pointer  bg-green-500  shadow-lg hover:bg-green-500/90" />
            <CarouselNext className="bottom-4 left-16 right-auto top-auto cursor-pointer border-primary bg-green-500 shadow-lg hover:bg-green-500/90" />
          </div>
        </Carousel>
      </Container>
    </section>
  )
}
