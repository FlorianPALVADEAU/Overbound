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

const getPosterUrl = (mediaUrl: string) => {
  const fileName = mediaUrl.split('/').pop()?.replace(/\.(webm|mp4)$/i, '')
  return fileName ? `/images/feedbacks/posters/${fileName}.jpg` : undefined
}

const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
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
  const [isHovered, setIsHovered] = useState(false)
  const posterUrl = getPosterUrl(testimonial.mediaUrl)
  const id = testimonial.id.toString()

  useEffect(() => {
    const video = videoRef.current
    if (!video || !canLoad) return
    if (!isPaused) void video.play()
  }, [canLoad, isPaused])

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
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-xl">
      {/* Video area */}
      <div
        className="relative min-h-72 w-full flex-1 overflow-hidden sm:min-h-80"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted={isActive ? isMuted : true}
          playsInline
          preload="none"
          autoPlay
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

        {/* Play / Pause */}
        {isHovered && (
          isActive && !isPaused ? (
            <Button
              onClick={(e) => { e.stopPropagation(); handlePause() }}
              className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            >
              <Pause className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={(e) => { e.stopPropagation(); handlePlay() }}
              className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
            >
              <Play className="ml-0.5 h-5 w-5" />
            </Button>
          )
        )}

        {/* Mute toggle */}
        {isHovered && isActive && (
          <Button
            onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m) }}
            className="absolute right-3 top-3 h-9 w-9 cursor-pointer rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Comment overlay card */}
      <div className="absolute bottom-5 left-1/2 w-[90%] -translate-x-1/2 rounded-xl bg-white/95 p-4 shadow-xl">
        <div className="mb-2 flex items-center gap-1.5">
          {renderStars(testimonial.rating)}
          <span className="text-xs font-medium text-gray-600">{testimonial.rating}/5</span>
        </div>
        {testimonial.comment && (
          <p className="mb-3 line-clamp-3 text-sm leading-snug text-gray-900">
            "{testimonial.comment}"
          </p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-900">{testimonial.name}</p>
            <p className="text-[11px] text-gray-500">
              {testimonial.age} ans • {testimonial.location}
            </p>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
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

export function UltraArenaTestimonials({ onVideoPlay, isOnSale = false, registerHref = '#tarifs-inscription', onCtaClick }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [canLoad, setCanLoad] = useState(false)

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

  // Reset hover on slide change
  useEffect(() => {
    if (!carouselApi) return
    // No-op — kept for potential future use
  }, [carouselApi])

  // Only video testimonials (all 5 available)
  const videoTestimonials = testimonials.filter((t) => t.mediaUrl)

  return (
    <section ref={sectionRef} className="py-14 sm:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Ils en parlent mieux que nous
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Ils ont hésité. Puis ils ont pris leur place.
          </h2>
          <p className="text-md font-medium text-white/60">
            Comme toi, ils ne savaient pas à quoi s&apos;attendre.
          </p>
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
              <Button asChild size="lg" className="h-11 rounded-xl px-6 text-sm font-semibold" onClick={onCtaClick}>
                <Link href={registerHref}>Je m&apos;inscris maintenant</Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline" className="h-11 rounded-xl px-6 text-sm" onClick={onCtaClick}>
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
                  onPlay={(id) => onVideoPlay?.(id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="bottom-4 left-4 top-auto cursor-pointer  bg-green-500  shadow-lg hover:bg-green-500/90" />
            <CarouselNext className="bottom-4 left-16 right-auto top-auto cursor-pointer border-primary bg-green-500 shadow-lg hover:bg-green-500/90" />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
