'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Pause, Play, Star } from 'lucide-react'
import Headings from '../globals/Headings'
import SubHeadings from '../globals/SubHeadings'
import { Button } from '../ui/button'
import {
  testimonials,
  TestimonialType,
  TestimonialTypeEnum,
} from '@/datas/Testimonials'
import AnimatedBanner from './AnimatedBanner'
import { PARTNERS_DATA } from '@/datas/Partners'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'

type Slide =
  | { id: string; type: 'video'; data: TestimonialType }
  | { id: string; type: 'comments'; data: TestimonialType[] }

const createSeededRandom = (seed: number) => {
  let value = seed % 2147483647
  if (value <= 0) {
    value += 2147483646
  }
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

const shuffleWithSeed = <T,>(array: T[], seed: number): T[] => {
  const result = [...array]
  const random = createSeededRandom(seed)
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

const SocialProof = () => {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)

  const uniqueTestimonials = useMemo(() => {
    const seen = new Set<string>()
    return testimonials.filter((item) => {
      const key = `${item.type}-${item.name}-${item.age}-${item.location}-${item.comment}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }, [])

  const slides = useMemo<Slide[]>(() => {
    const seedBase =
      uniqueTestimonials.reduce((acc, item) => acc + (Number(item.id) || 0), 0) ||
      uniqueTestimonials.length
    const videoEntries = uniqueTestimonials.filter(
      (item) => item.type === TestimonialTypeEnum.VIDEO,
    )
    const commentEntries = uniqueTestimonials.filter(
      (item) => item.type === TestimonialTypeEnum.COMMENT,
    )

    const shuffledVideos = shuffleWithSeed(videoEntries, seedBase + 11)
    const shuffledComments = shuffleWithSeed(commentEntries, seedBase + 27)

    const videoSlides: Slide[] = shuffledVideos.map((item) => ({
      id: `video-${item.id}`,
      type: 'video' as const,
      data: item,
    }))

    const commentSlides: Slide[] = []
    for (let index = 0; index < shuffledComments.length; index += 2) {
      const first = shuffledComments[index]
      if (!first) continue
      const second = shuffledComments[index + 1]
      const group = [first]
      if (second) {
        group.push(second)
      }
      commentSlides.push({
        id: `comments-${first.id}-${second?.id ?? 'solo'}`,
        type: 'comments',
        data: group,
      })
    }

    return shuffleWithSeed(
      [...videoSlides, ...commentSlides],
      seedBase + 73,
    )
  }, [uniqueTestimonials])

  useEffect(() => {
    if (!carouselApi) return
    const handleSelect = () => setPlayingVideo(null)
    carouselApi.on('select', handleSelect)
    return () => {
      carouselApi.off('select', handleSelect)
    }
  }, [carouselApi])

  const toggleVideo = (id: string) => {
    setPlayingVideo((current) => (current === id ? null : id))
  }

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))

  const renderVideoSlide = (testimonial: TestimonialType) => (
    <div className="relative flex h-full max-h-[640px] flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-xl">
      <div
        className="relative w-full flex-1 min-h-[360px] cursor-pointer overflow-hidden sm:min-h-[400px]"
        onClick={() => toggleVideo(testimonial.id.toString())}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={testimonial.mediaUrl}
          loop
          muted
          playsInline
          ref={(video) => {
            if (!video) return
            if (playingVideo === testimonial.id.toString()) {
              void video.play()
            } else {
              video.pause()
            }
          }}
        />
        <div className="absolute inset-0 bg-black/40 transition-all duration-300 hover:bg-black/30" />
        <Button
          onClick={(event) => {
            event.stopPropagation()
            toggleVideo(testimonial.id.toString())
          }}
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/30 sm:h-14 sm:w-14"
        >
          {playingVideo === testimonial.id.toString() ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="absolute bottom-8 left-1/2 w-[92%] max-w-[600px] -translate-x-1/2 rounded-xl bg-white/95 p-4.5 shadow-xl sm:p-5.5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
            {renderStars(testimonial.rating)}
          <span className="text-xs font-medium text-gray-700 sm:text-sm">
            {testimonial.rating}/5
          </span>
        </div>
        <p className="mb-3 line-clamp-6 text-sm leading-relaxed text-gray-900 sm:text-base">
          “{testimonial.comment}”
        </p>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-gray-900 sm:text-sm">
              {testimonial.name}
            </h4>
            <p className="text-[11px] text-gray-500 sm:text-xs">
              {testimonial.age} ans • {testimonial.location}
            </p>
          </div>
          <div className="ml-2 flex-shrink-0 rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700">
            ✓ Vérifié
          </div>
        </div>
      </div>
    </div>
  )

  const renderCommentBlock = (testimonial: TestimonialType) => (
    <div
      key={testimonial.id}
      className="rounded-xl border border-gray-100 bg-white/95 p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {renderStars(testimonial.rating)}
        <span className="text-xs font-medium text-gray-700 sm:text-sm">
          {testimonial.rating}/5
        </span>
      </div>
      <blockquote
        className="mb-4 text-sm leading-relaxed text-gray-800 sm:text-base sm:leading-relaxed line-clamp-5"
        title={testimonial.comment}
      >
        “{testimonial.comment}”
      </blockquote>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
            {testimonial.name}
          </h4>
          <p className="text-xs text-gray-500 sm:text-sm">
            {testimonial.age} ans • {testimonial.location}
          </p>
        </div>
        <div className="ml-2 flex-shrink-0 rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700">
          ✓ Vérifié
        </div>
      </div>
    </div>
  )

  const renderCommentSlide = (group: TestimonialType[]) => (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-primary/40 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-xl sm:p-6">
      <div className="flex flex-1 flex-col gap-5">
        {group.map((item) => renderCommentBlock(item))}
      </div>
      {group.length === 1 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 p-4 text-center text-xs font-medium uppercase tracking-wide text-gray-400 sm:p-5 sm:text-sm">
          Ajoute ton témoignage après ta course
        </div>
      ) : null}
    </div>
  )

  return (
    <section className="relative flex w-full flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-12 pt-40 sm:px-6 lg:px-8 xl:px-24">
      <Image
        src="/images/mountain-vector.svg"
        alt="Background"
        className="pointer-events-none absolute -top-2 right-0 w-screen rotate-180 object-cover object-center"
        height={600}
        width={600}
      />

      <Headings
        title="Ils ont relevé le défi"
        description="Découvrez les témoignages de nos participants qui ont vécu l'expérience Overbound"
        sx="mb-10 text-black"
      />

      <div className="relative z-10 flex w-full flex-col items-center gap-18 lg:gap-22">
        <Carousel
          className="w-full"
          opts={{ align: 'start', loop: false }}
          setApi={setCarouselApi}
        >
          <CarouselContent className="-ml-2 sm:-ml-3 md:-ml-4 md:pb-20">
            {slides.map((slide) => (
              <CarouselItem
                key={slide.id}
                className="basis-[95%] pl-2 sm:pl-3 md:pl-4 md:basis-1/2 xl:basis-1/3 h-[540px] sm:h-[560px] lg:h-[600px]"
              >
                {slide.type === 'video'
                  ? renderVideoSlide(slide.data)
                  : renderCommentSlide(slide.data)}
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-4 top-auto bottom-4 bg-primary text-white border-primary hover:bg-primary/90 shadow-lg" />
            <CarouselNext className="left-16 right-auto top-auto bottom-4 bg-primary text-white border-primary hover:bg-primary/90 shadow-lg" />
          </div>
        </Carousel>

        <div className="max-w-full pt-10">
          <AnimatedBanner
            images={PARTNERS_DATA.map((partner) => partner.logo)}
          />
        </div>

        <div className="flex w-full flex-col items-start justify-start gap-4 mt-6">
          <SubHeadings title="Overbound, en chiffres" sx='text-black' />
          <div className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row sm:justify-between sm:gap-4">
            <div className="flex h-48 w-full flex-col items-center justify-center rounded-xl bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg sm:h-56 sm:w-[30%]">
              <div className="mb-2 text-4xl font-bold text-blue-600 sm:text-5xl">
                1
              </div>
              <div className="text-sm text-gray-600 sm:text-base">
                Tribu en or
              </div>
            </div>
            <div className="flex h-48 w-full flex-col items-center justify-center rounded-xl bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg sm:h-56 sm:w-[30%]">
              <div className="mb-2 text-4xl font-bold text-green-600 sm:text-5xl">
                4.8/5
              </div>
              <div className="text-sm text-gray-600 sm:text-base">
                Note moyenne
              </div>
            </div>
            <div className="flex h-48 w-full flex-col items-center justify-center rounded-xl bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg sm:h-56 sm:w-[30%]">
              <div className="mb-2 text-4xl font-bold text-purple-600 sm:text-5xl">
                98%
              </div>
              <div className="text-sm text-gray-600 sm:text-base">
                Recommandent l'expérience
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SocialProof
