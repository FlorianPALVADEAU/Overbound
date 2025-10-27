'use client'
import React, { useEffect, useState } from 'react'
import { Star, Play, Pause } from 'lucide-react'
import Headings from '../globals/Headings'
import SubHeadings from '../globals/SubHeadings'
import { Button } from '../ui/button'
import { testimonials, TestimonialType, TestimonialTypeEnum } from '@/datas/Testimonials'
import AnimatedBanner from './AnimatedBanner'
import { PARTNERS_DATA } from '@/datas/Partners'
import Image from 'next/image'

const SocialProof = () => {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(0) // Nombre initial d'éléments à afficher
  const [isLoading, setIsLoading] = useState(false)
  const toggleVideo = (id: string) => {
    setPlayingVideo(playingVideo === id ? null : id)
  }

  const loadMore = () => {
    setIsLoading(true)
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 15, testimonials.length))
      setIsLoading(false)
    }, 500)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 1280px)')
    const updateVisibleCount = (matches: boolean) => {
      setVisibleCount(matches ? 21 : 6)
    }

    updateVisibleCount(mediaQuery.matches)

    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      updateVisibleCount(event.matches)
    }

    mediaQuery.addEventListener('change', handleMediaQueryChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange)
    }
  }, [])
  

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  // Fonction pour rendre un témoignage vidéo
  const renderVideoTestimonial = (testimonial: TestimonialType) => (
    <div
      key={testimonial.id}
      className="relative mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 bg-gray-900"
    >
      {/* Video */}
      <div 
        className="relative w-full aspect-[9/16] sm:aspect-[3/4] lg:aspect-[2/3] overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={() => toggleVideo(testimonial.id.toString())}
      >
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={testimonial.mediaUrl}
          loop
          muted
          playsInline
          ref={(video) => {
            if (video) {
              if (playingVideo === testimonial.id.toString()) {
                video.play()
              } else {
                video.pause()
              }
            }
          }}
        />
        <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-all duration-300"></div>

        <Button
          onClick={() => toggleVideo(testimonial.id.toString())}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group-hover:scale-110"
        >
          {playingVideo === testimonial.id.toString() ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
          )}
        </Button>
      </div>

      {/* Details */}
      <div className="absolute left-[6%] bottom-6 w-7/8 h-min-2/5 bg-white/95 rounded-lg p-4 sm:p-5">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2 sm:mb-3">
          {renderStars(testimonial.rating)}
          <span className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
            {testimonial.rating}/5
          </span>
        </div>

        {/* Comment */}
        <p className="text-gray-800 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-4">
          "{testimonial.comment}"
        </p>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
              {testimonial.name}
            </h4>
            <p className="text-gray-500 text-xs">
              {testimonial.age} ans • {testimonial.location}
            </p>
          </div>
          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
            ✓ Vérifié
          </div>
        </div>
      </div>
    </div>
  )

  // Fonction pour rendre un témoignage commentaire
  const renderCommentTestimonial = (testimonial: TestimonialType) => (
    <div
      key={testimonial.id}
      className="relative mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 bg-white border border-gray-100"
    >
      <div className="p-4 sm:p-6">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3 sm:mb-4">
          {renderStars(testimonial.rating)}
          <span className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
            {testimonial.rating}/5
          </span>
        </div>

        {/* Comment */}
        <blockquote className="text-gray-800 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 italic">
          "{testimonial.comment}"
        </blockquote>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {testimonial.name}
            </h4>
            <p className="text-gray-500 text-xs sm:text-sm">
              {testimonial.age} ans • {testimonial.location}
            </p>
          </div>
          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
            ✓ Vérifié
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <section className="w-full relative items-center justify-center gap-12 py-16 pt-48 px-4 sm:px-6 lg:px-8 xl:px-32 bg-gradient-to-b from-gray-50 to-white">
      <Image
        src="/images/mountain-vector.svg"
        alt="Background"
        className='object-cover object-center absolute w-full -top-15 -right-0 mt-10 rotate-180'
        height={'600'}
        width={'600'}
      />
      <Headings
        title="Ils ont relevé le défi"
        description="Découvrez les témoignages de nos participants qui ont vécu l'expérience Overbound"
        sx='text-black'
      />

      <div className="w-full h-full flex flex-col justify-center items-center gap-16 lg:gap-32 my-8 lg:my-12">
        {/* Testimonials Masonry Grid */}
        <div className="w-full">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
            {testimonials.slice(0, visibleCount).map((testimonial: TestimonialType) => (
              testimonial.type === TestimonialTypeEnum.VIDEO 
                ? renderVideoTestimonial(testimonial)
                : renderCommentTestimonial(testimonial)
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < testimonials.length && (
            <div className="flex justify-center mt-8 sm:mt-12">
              <Button
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Chargement...
                  </div>
                ) : (
                  `Voir plus de témoignages (${testimonials.length - visibleCount} restants)`
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Brand Banner Section */}
        <div className="w-full flex flex-col gap-2">
          <SubHeadings title="Ils nous font confiance" />
          <AnimatedBanner
              images={PARTNERS_DATA.map(partner => partner.logo)}
          />
        </div>

        {/* Stats Section */}
        <div className="w-full flex flex-col items-start justify-start gap-4">
          <SubHeadings title="Overbound, en chiffres" />
          <div className="w-full flex flex-col sm:flex-row justify-center sm:justify-between items-center ">
            <div className="w-full sm:w-[30%] h-48 sm:h-60 bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 mb-2">1</div>
              <div className="text-gray-600 text-sm sm:text-base text-center">Tribu en or</div>
            </div>
            <div className="w-full sm:w-[30%] h-48 sm:h-60 bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 mb-2">4.8/5</div>
              <div className="text-gray-600 text-sm sm:text-base text-center">Note moyenne</div>
            </div>
            <div className="w-full sm:w-[30%] h-48 sm:h-60 bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600 text-sm sm:text-base text-center">Recommandent l'expérience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SocialProof
